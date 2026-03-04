/* Action executor will map resolved {intent,slots} to database operations.
Each handler receives (userId, slots) and returns { message, data?, action? }.
The "action" field tells the frontend to do something extra (like navigate).
*/

import Task from '../models/Task.js';
import TaskLog from '../models/TaskLog.js';
import TaskSummary from '../models/TaskSummary.js';

// ───── Helpers ───────────────────────────────────────────

/*
Fuzzy-find a task by title for a user.
Returns the best match or null.
If multiple tasks match equally, returns an array for disambiguation.
*/

async function findTaskByTitle(userId, titleQuery) {
  if (!titleQuery) return null;
  const q = titleQuery.toLowerCase().trim();
  const tasks = await Task.find({ userId, archive: false });

  // Exact match first
  const exact = tasks.find(t => t.title.toLowerCase() === q);
  if (exact) return exact;

  // Substring match
  const subs = tasks.filter(t => t.title.toLowerCase().includes(q));
  if (subs.length === 1) return subs[0];
  if (subs.length > 1) return subs; // disambiguation needed

  // Reverse substring (query contains title)
  const rev = tasks.filter(t => q.includes(t.title.toLowerCase()));
  if (rev.length === 1) return rev[0];
  if (rev.length > 1) return rev;

  // Simple Levenshtein-ish: starts-with
  const starts = tasks.filter(t => t.title.toLowerCase().startsWith(q));
  if (starts.length === 1) return starts[0];
  if (starts.length > 1) return starts;

  return null;
}

function disambiguationMessage(tasks) {
  const names = tasks.slice(0, 5).map((t, i) => `${i + 1}. **${t.title}**`).join('\n');
  return `I found multiple tasks that match. Which one did you mean?\n${names}`;
}

// Timezone offset (minutes east of UTC) from slots or default 0
function getTzOffset(slots) {
  return parseInt(slots.timezoneOffset || slots.tz || 0, 10);
}

// Normalize date to local midnight — mirrors taskController logic
function normalizeDateToMidnight(date, tzOffsetMinutes = 0) {
  const d = new Date(date);
  const shifted = new Date(d.getTime() + tzOffsetMinutes * 60000);
  shifted.setUTCHours(0, 0, 0, 0);
  return new Date(shifted.getTime() - tzOffsetMinutes * 60000);
}

// ─── Intent Handlers ───────────────────────────────────────────

const handlers = {
  // ── Task CRUD ──

  'task.create': async (userId, slots) => {
    const title = slots.title;
    if (!title) return { message: "I need a task title to create one." };

    const taskData = {
      userId,
      title,
      tags: [],
      schedule: { kind: 'daily', interval: 1 },
      target: 1,
      difficulty: 'medium',
      priority: 'medium',
      startDate: new Date(),
    };

    // Optional slots
    if (slots.schedule_kind) taskData.schedule.kind = slots.schedule_kind;
    if (slots.target_number) taskData.target = parseInt(slots.target_number, 10) || 1;
    if (slots.difficulty) taskData.difficulty = slots.difficulty;
    if (slots.priority) taskData.priority = slots.priority;
    if (slots.tag) {
      taskData.tags = Array.isArray(slots.tag) ? slots.tag : [slots.tag];
    }

    const task = await Task.create(taskData);
    return {
      message: `Created task **${task.title}** (${task.schedule.kind}, target ${task.target}x/day).`,
      data: { task },
      action: { type: 'task_created', taskId: task._id },
    };
  },

  'task.update': async (userId, slots) => {
    const result = await findTaskByTitle(userId, slots.title);
    if (!result) return { message: `I couldn't find a task matching "${slots.title}".` };
    if (Array.isArray(result)) return { message: disambiguationMessage(result) };

    const task = result;
    const updates = {};

    if (slots.new_title) updates.title = slots.new_title;
    if (slots.priority) updates.priority = slots.priority;
    if (slots.difficulty) updates.difficulty = slots.difficulty;
    if (slots.schedule_kind) updates['schedule.kind'] = slots.schedule_kind;
    if (slots.target_number) updates.target = parseInt(slots.target_number, 10) || task.target;

    if (Object.keys(updates).length === 0) {
      return { message: `What do you want to change about **${task.title}**? (e.g. priority, difficulty, schedule)` };
    }

    await Task.findByIdAndUpdate(task._id, { $set: updates });
    const changed = Object.entries(updates).map(([k, v]) => `${k}: ${v}`).join(', ');
    return {
      message: `Updated **${task.title}** — ${changed}.`,
      action: { type: 'task_updated', taskId: task._id },
    };
  },

  'task.delete': async (userId, slots) => {
    const result = await findTaskByTitle(userId, slots.title);
    if (!result) return { message: `I couldn't find a task matching "${slots.title}".` };
    if (Array.isArray(result)) return { message: disambiguationMessage(result) };

    const task = result;
    // Archive by default (safer)
    await Task.findByIdAndUpdate(task._id, { archive: true });
    return {
      message: `Archived task **${task.title}**. You can restore it anytime.`,
      action: { type: 'task_deleted', taskId: task._id },
    };
  },

  'task.restore': async (userId, slots) => {
    const q = (slots.title || '').toLowerCase().trim();
    const tasks = await Task.find({ userId, archive: true });
    const task = tasks.find(t => t.title.toLowerCase().includes(q));
    if (!task) return { message: `I couldn't find an archived task matching "${slots.title}".` };

    await Task.findByIdAndUpdate(task._id, { archive: false });
    return {
      message: `Restored task **${task.title}**.`,
      action: { type: 'task_restored', taskId: task._id },
    };
  },

  // ── Mark / Unmark ──

  'task.mark': async (userId, slots) => {
    const result = await findTaskByTitle(userId, slots.title);
    if (!result) return { message: `I couldn't find a task matching "${slots.title}".` };
    if (Array.isArray(result)) return { message: disambiguationMessage(result) };

    const task = result;
    const tz = getTzOffset(slots);
    const markDate = normalizeDateToMidnight(slots.date || new Date(), tz);

    // Prevent future‑date marking
    const todayMidnight = normalizeDateToMidnight(new Date(), tz);
    if (markDate > todayMidnight) {
      return { message: "You can't mark a task complete for a future date." };
    }

    // Check once-task already completed
    if (task.schedule?.kind === 'once') {
      const existing = await TaskLog.findOne({ taskId: task._id, userId });
      if (existing) return { message: `**${task.title}** is a one-time task and was already completed.` };
    }

    // Upsert log
    const existingLog = await TaskLog.findOne({ taskId: task._id, userId, date: markDate });
    if (existingLog) {
      existingLog.count = (existingLog.count || 1) + 1;
      existingLog.meta = { ...existingLog.meta, source: 'assistant' };
      await existingLog.save();
    } else {
      await TaskLog.create({ taskId: task._id, userId, date: markDate, count: 1, meta: { source: 'assistant' } });
    }

    // Update task's lastCompletedDate
    task.lastCompletedDate = markDate;
    await task.save();

    // Recompute summary
    const summary = await recomputeSummary(task, tz);

    return {
      message: `Marked **${task.title}** as done! 🎉 Streak: ${summary.currentStreak} day(s).`,
      data: { task, summary },
      action: { type: 'task_marked', taskId: task._id },
    };
  },

  'task.unmark': async (userId, slots) => {
    const result = await findTaskByTitle(userId, slots.title);
    if (!result) return { message: `I couldn't find a task matching "${slots.title}".` };
    if (Array.isArray(result)) return { message: disambiguationMessage(result) };

    const task = result;
    const tz = getTzOffset(slots);
    const date = normalizeDateToMidnight(slots.date || new Date(), tz);

    const log = await TaskLog.findOne({ taskId: task._id, userId, date });
    if (!log) return { message: `**${task.title}** wasn't marked for that day.` };

    if (log.count > 1) {
      log.count -= 1;
      await log.save();
    } else {
      await TaskLog.deleteOne({ _id: log._id });
    }

    const summary = await recomputeSummary(task, tz);
    return {
      message: `Unmarked one completion of **${task.title}**. Count now: ${log.count > 1 ? log.count - 1 : 0}.`,
      data: { task, summary },
      action: { type: 'task_unmarked', taskId: task._id },
    };
  },

  // ── Queries ──

  'task.list': async (userId, _slots) => {
    const tasks = await Task.find({ userId, archive: false }).sort({ createdAt: -1 }).lean();
    if (tasks.length === 0) return { message: "You don't have any active tasks. Want to create one?" };

    const lines = tasks.map((t, i) => `${i + 1}. **${t.title}** — ${t.schedule?.kind || 'daily'}, target ${t.target || 1}x/day`);
    return {
      message: `You have **${tasks.length}** active task(s):\n${lines.join('\n')}`,
      data: { count: tasks.length },
    };
  },

  'task.query': async (userId, slots) => {
    const result = await findTaskByTitle(userId, slots.title);
    if (!result) return { message: `I couldn't find a task matching "${slots.title}".` };
    if (Array.isArray(result)) return { message: disambiguationMessage(result) };

    const task = result;
    const summary = await TaskSummary.findOne({ taskId: task._id, userId });
    if (!summary) return { message: `**${task.title}** — no completion data yet.` };

    const lines = [
      ` **${task.title}** stats:`,
      `• Streak: **${summary.currentStreak}** day(s) (best: ${summary.maxStreak})`,
      `• Completion rate: **${Math.round((summary.completionRate || 0) * 100)}%**`,
      `• Total completions: **${summary.totalCompletions}**`,
      `• Weekly score: **${summary.weeklyScore || 0}** / 7`,
    ];
    if (summary.productivityIndex != null) {
      lines.push(`• Productivity index: **${summary.productivityIndex}**`);
    }
    return { message: lines.join('\n'), data: { summary } };
  },

  // ── Profile stats ──

  'profile.stats': async (userId, _slots) => {
    const totalTasks = await Task.countDocuments({ userId, archive: false });
    const summaries = await TaskSummary.find({ userId });
    const totalCompletions = summaries.reduce((s, sm) => s + (sm.totalCompletions || 0), 0);
    const avgRate = summaries.length
      ? Math.round(summaries.reduce((s, sm) => s + (sm.completionRate || 0), 0) / summaries.length * 100)
      : 0;
    const maxStreak = summaries.reduce((mx, sm) => Math.max(mx, sm.maxStreak || 0), 0);

    return {
      message: [
        ` **Your stats:**`,
        `• Active tasks: **${totalTasks}**`,
        `• Total completions: **${totalCompletions}**`,
        `• Average completion rate: **${avgRate}%**`,
        `• Best streak: **${maxStreak}** day(s)`,
      ].join('\n'),
    };
  },

  // ── Navigation ──

  'navigate.tasks':    async () => ({ message: 'Taking you to the task dashboard.', action: { type: 'navigate', path: '/tasks' } }),
  'navigate.board':    async () => ({ message: 'Opening the task board.', action: { type: 'navigate', path: '/tasks/board' } }),
  'navigate.calendar': async () => ({ message: 'Opening the calendar.', action: { type: 'navigate', path: '/calendar' } }),
  'navigate.profile':  async () => ({ message: 'Opening your profile.', action: { type: 'navigate', path: '/profile' } }),
  'navigate.dsa':      async () => ({ message: 'Opening the DSA helper.', action: { type: 'navigate', path: '/dsa' } }),
  'navigate.career':   async () => ({ message: 'Opening the Career Canvas.', action: { type: 'navigate', path: '/career' } }),
  'navigate.home':     async () => ({ message: 'Going home.', action: { type: 'navigate', path: '/' } }),
};

// ─── Summary recalculation ──────

async function recomputeSummary(task, tzOffset = 0) {
  const target = task.target || 1;
  const logs = await TaskLog.find({ taskId: task._id }).sort({ date: -1 });

  const totalCompletions = logs.reduce((s, l) => s + (l.count || 1), 0);

  // Streak from latest log backwards
  let currentStreak = 0;
  if (logs.length) {
    const latestDate = normalizeDateToMidnight(logs[0].date, tzOffset);
    const today = normalizeDateToMidnight(new Date(), tzOffset);
    const diffDays = Math.round((today - latestDate) / 86400000);
    if (diffDays <= 1 && (logs[0].count || 1) >= target) {
      currentStreak = 1;
      let prev = new Date(latestDate);
      prev.setDate(prev.getDate() - 1);
      for (const log of logs.slice(1)) {
        const logDate = normalizeDateToMidnight(log.date, tzOffset);
        if (logDate.getTime() === prev.getTime() && (log.count || 1) >= target) {
          currentStreak++;
          prev.setDate(prev.getDate() - 1);
        } else {
          break;
        }
      }
    }
  }

  // Completion rate
  const start = normalizeDateToMidnight(task.startDate || task.createdAt, tzOffset);
  const today = normalizeDateToMidnight(new Date(), tzOffset);
  const days = Math.max(1, Math.floor((today - start) / 86400000) + 1);
  const completionRate = Math.min(totalCompletions / (days * target), 1);

  // Weekly score (last 7 days)
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - 6);
  const weeklyScore = await TaskLog.countDocuments({
    taskId: task._id,
    date: { $gte: weekStart, $lte: today },
  });

  // Productivity index
  const rateScore = Math.round(completionRate * 100);
  const streakScore = currentStreak * 2;
  const totalScore = Math.round(totalCompletions * 0.1);
  const productivityIndex = Math.min(rateScore + streakScore + totalScore, 200);

  const summary = await TaskSummary.findOneAndUpdate(
    { taskId: task._id, userId: task.userId },
    {
      $set: {
        currentStreak,
        maxStreak: Math.max(currentStreak, 0),
        totalCompletions,
        completionRate,
        weeklyScore,
        productivityIndex,
        lastCompletedAt: logs.length ? logs[0].date : undefined,
      },
    },
    { upsert: true, new: true }
  );

  // Ensure maxStreak never decreases
  if (currentStreak > summary.maxStreak) {
    summary.maxStreak = currentStreak;
    await summary.save();
  }

  return summary;
}

// ─── Main execute function ─────────────────────────────────────

/**
 * Execute an action for a resolved intent.
 * @param {string} userId
 * @param {string} intent
 * @param {object} slots
 * @returns {{ message: string, data?: object, action?: object }}
 */
export async function executeAction(userId, intent, slots) {
  const handler = handlers[intent];
  if (!handler) {
    return { message: "I'm not sure what you mean. Type **help** to see what I can do." };
  }
  try {
    return await handler(userId, slots);
  } catch (err) {
    console.error(`[Assistant] Action error for ${intent}:`, err);
    return { message: `Something went wrong while processing your request. Error: ${err.message}` };
  }
}
