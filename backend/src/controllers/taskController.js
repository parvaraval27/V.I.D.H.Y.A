import Task from '../models/Task.js';
import TaskLog from '../models/TaskLog.js';
import TaskSummary from '../models/TaskSummary.js';

// Allowed palette for sticky notes
const ALLOWED_COLORS = ['#ff7eb9','#ff65a3','#7afcff','#feff9c','#fff740'];
const DEFAULT_LABEL_COLOR = '#feff9c';

// Helper function to normalize date to midnight for a given timezone offset (minutes east of UTC)
// timezoneOffsetMinutes: integer minutes (e.g., IST = +330), defaults to 0 (UTC)
const normalizeDateToMidnight = (date, timezoneOffsetMinutes = 0) => {
  const d = new Date(date);
  // Shift by timezone offset to get local wall-clock time anchored at user's zone
  const shifted = new Date(d.getTime() + timezoneOffsetMinutes * 60000);
  // zero out the UTC hours on shifted to represent local midnight
  shifted.setUTCHours(0, 0, 0, 0);
  // shift back to UTC timestamp representing that local midnight
  const result = new Date(shifted.getTime() - timezoneOffsetMinutes * 60000);
  return result;
};

// Helper to calculate completion rate
const calculateCompletionRate = async (taskId, startDate) => {
  const task = await Task.findById(taskId);
  if (!task) return 0;

  const today = normalizeDateToMidnight(new Date());
  // Normalize startDate to midnight to avoid negative/zero-day issues when task was created later in the day
  const start = normalizeDateToMidnight(new Date(startDate));
  const daysSinceStart = Math.floor((today - start) / (1000 * 60 * 60 * 24)) + 1;
  
  const totalLogs = await TaskLog.countDocuments({ taskId });
  
  // If daysSinceStart <= 0 treat as day 1 if there are any completions
  if (daysSinceStart <= 0) return totalLogs > 0 ? 1 : 0;
  return Math.min(totalLogs / daysSinceStart, 1);
};

// Helper to compute streak
const computeStreak = async (taskId, currentDate, timezoneOffsetMinutes = 0) => {
  let streak = 1;
  let prevDate = new Date(currentDate);
  prevDate.setDate(prevDate.getDate() - 1);

  while (true) {
    const log = await TaskLog.findOne({
      taskId,
      date: normalizeDateToMidnight(prevDate, timezoneOffsetMinutes)
    });

    if (!log) break;

    streak++;
    prevDate.setDate(prevDate.getDate() - 1);
  }

  return streak;
};

// Simple weekly score: number of completions in the last 7 days
const computeWeeklyScore = async (taskId, referenceDate = new Date(), timezoneOffsetMinutes = 0) => {
  const end = normalizeDateToMidnight(referenceDate, timezoneOffsetMinutes);
  const start = new Date(end);
  start.setDate(start.getDate() - 6);
  const count = await TaskLog.countDocuments({ taskId, date: { $gte: start, $lte: end } });
  return count;
};

// Simple productivity index heuristic
const computeProductivityIndex = (summary) => {
  // combine completion rate (0..1), streaks and total completions
  const rateScore = Math.round((summary.completionRate || 0) * 100);
  const streakScore = (summary.currentStreak || 0) * 2;
  const totalScore = Math.round((summary.totalCompletions || 0) * 0.1);
  return rateScore + streakScore + totalScore;
};

export const getTasks = async (req, res) => {
  try {
    const { archive, tags, priority, status, sort, q, completed } = req.query;
    const timezoneOffset = req.query.tz ? parseInt(req.query.tz, 10) : 0; // minutes east of UTC
    const query = { userId: req.user._id };

    if (archive !== undefined) {
      query.archive = archive === 'true';
    } else {
      query.archive = false;
    }

    if (tags) {
      const tagsArr = String(tags).split(',').map(t => t.trim()).filter(Boolean);
      if (tagsArr.length) query.tags = { $in: tagsArr };
    }

    if (priority) {
      query.priority = String(priority).toLowerCase();
    }

    // Fetch tasks
    let tasks = await Task.find(query).lean();

    // Attach summaries
    const taskIds = tasks.map(t => t._id);
    const summaries = await TaskSummary.find({ taskId: { $in: taskIds } }).lean();
    const summaryMap = {};
    summaries.forEach(s => { summaryMap[String(s.taskId)] = s; });

    let tasksWithSummary = tasks.map(task => ({ ...task, summary: summaryMap[String(task._id)] || null }));

    // Text query search
    if (q) {
      const qLower = String(q).toLowerCase();
      tasksWithSummary = tasksWithSummary.filter(t => (t.title && String(t.title).toLowerCase().includes(qLower)) || (t.description && String(t.description).toLowerCase().includes(qLower)) || (t.tags && t.tags.join(' ').toLowerCase().includes(qLower)));
    }

    // Filter for one-time tasks based on completion status:
    // - If completed='true' (Done tab): show ONLY completed one-time tasks
    // - Otherwise (Active tab): hide completed one-time tasks, show recurring + incomplete one-time
    if (completed === 'true') {
      // Show only completed one-time tasks
      tasksWithSummary = tasksWithSummary.filter(t => {
        const isOnceTask = t.schedule && t.schedule.kind === 'once';
        const isCompleted = t.summary && t.summary.totalCompletions >= 1;
        return isOnceTask && isCompleted;
      });
    } else {
      // Exclude completed one-time tasks (keep recurring + incomplete one-time)
      tasksWithSummary = tasksWithSummary.filter(t => {
        const isOnceTask = t.schedule && t.schedule.kind === 'once';
        const isCompleted = t.summary && t.summary.totalCompletions >= 1;
        return !isOnceTask || !isCompleted;
      });
    }

    // Status filter (simple): 'doneToday' filters tasks with lastCompletedAt today (respecting timezone offset)
    if (status === 'doneToday') {
      const today = normalizeDateToMidnight(new Date(), timezoneOffset);
      tasksWithSummary = tasksWithSummary.filter(t => t.summary && t.summary.lastCompletedAt && normalizeDateToMidnight(t.summary.lastCompletedAt, timezoneOffset).getTime() === today.getTime());
    }

    // Sorting options
    if (sort === 'priority') {
      const order = { high: 0, medium: 1, low: 2 };
      tasksWithSummary.sort((a, b) => order[a.priority] - order[b.priority]);
    } else if (sort === 'completion') {
      tasksWithSummary.sort((a, b) => (b.summary?.completionRate || 0) - (a.summary?.completionRate || 0));
    } else {
      tasksWithSummary.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    res.json(tasksWithSummary);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: 'Error fetching tasks', error: error.message });
  }
};

export const createTask = async (req, res) => {
  try {
    const { title, description, tags, schedule, target, difficulty, priority, labelColor, startDate, position, width, height, zIndex, deadline, enableStreak } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const taskData = {
      userId: req.user._id,
      title,
      description,
      tags: tags || [],
      schedule: schedule || { kind: 'daily' },
      target: target || 1,
      difficulty: difficulty || 'medium',
      priority: priority ? String(priority).toLowerCase() : 'medium',
      // Validate labelColor against allowed palette
      labelColor: ALLOWED_COLORS.includes(labelColor) ? labelColor : DEFAULT_LABEL_COLOR,
      startDate: startDate || new Date(),
      deadline: deadline || null,
      enableStreak: enableStreak === undefined ? true : !!enableStreak
    };

    // optional layout fields
    if (position && typeof position.x === 'number' && typeof position.y === 'number') taskData.position = position;
    if (typeof width === 'number') taskData.width = width;
    if (typeof height === 'number') taskData.height = height;
    if (typeof zIndex === 'number') taskData.zIndex = zIndex;

    const task = new Task(taskData);

    await task.save();

    const summary = new TaskSummary({
      taskId: task._id,
      userId: req.user._id,
      currentStreak: 0,
      maxStreak: 0,
      completionRate: 0,
      totalCompletions: 0,
      weeklyScore: 0,
      productivityIndex: 0
    });

    await summary.save();

    res.status(201).json({
      ...task.toObject(),
      summary: summary.toObject()
    });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ message: 'Error creating task', error: error.message });
  }
};

export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, tags, schedule, target, difficulty, priority, labelColor, archive, deadline, enableStreak } = req.body;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (tags) task.tags = tags;
    if (schedule) task.schedule = schedule;
    if (deadline !== undefined) task.deadline = deadline;
    if (enableStreak !== undefined) task.enableStreak = !!enableStreak;
    if (target) task.target = target;
    if (difficulty) task.difficulty = difficulty;
    if (priority) task.priority = String(priority).toLowerCase();
    if (labelColor) {
      if (!ALLOWED_COLORS.includes(labelColor)) return res.status(400).json({ message: 'Invalid labelColor' });
      task.labelColor = labelColor;
    }
    if (archive !== undefined) task.archive = archive;

    task.updatedAt = new Date();
    await task.save();

    const summary = await TaskSummary.findOne({ taskId: id });

    res.json({
      ...task.toObject(),
      summary: summary ? summary.toObject() : null
    });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ message: 'Error updating task', error: error.message });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { permanent } = req.query;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (String(permanent) === 'true') {
      // remove task and associated logs & summary
      await TaskLog.deleteMany({ taskId: id });
      await TaskSummary.deleteMany({ taskId: id });
      await task.deleteOne();
      return res.json({ message: 'Task permanently deleted' });
    }

    task.archive = true;
    await task.save();

    res.json({ message: 'Task archived successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ message: 'Error deleting task', error: error.message });
  }
};

export const restoreTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (task.userId.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Unauthorized' });

    task.archive = false;
    await task.save();
    res.json({ message: 'Task restored', task: task.toObject() });
  } catch (error) {
    console.error('Error restoring task:', error);
    res.status(500).json({ message: 'Error restoring task', error: error.message });
  }
};

export const markTaskComplete = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, count } = req.body;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Consider timezone offset from client (minutes east of UTC) via body or header
    const tzOffset = (req.body.timezoneOffset || req.headers['x-timezone-offset']) ? parseInt(req.body.timezoneOffset || req.headers['x-timezone-offset'], 10) || 0 : 0;

    const logDate = normalizeDateToMidnight(date || new Date(), tzOffset);

    // Sanity check: don't allow future-dated completion relative to user's timezone
    const nowNormalized = normalizeDateToMidnight(new Date(), tzOffset);
    if (logDate.getTime() > nowNormalized.getTime()) {
      return res.status(400).json({ message: 'Cannot complete tasks in the future' });
    }

    // Prevent marking a 'once' task more than once
    if (task.schedule && task.schedule.kind === 'once') {
      const existingSummary = await TaskSummary.findOne({ taskId: id });
      if (existingSummary && existingSummary.totalCompletions >= 1) {
        return res.status(400).json({ message: "Task 'once' is already completed." });
      }
    }

    let log = await TaskLog.findOne({ taskId: id, date: logDate });

    if (log) {
      log.count = (log.count || 0) + (count || 1);
    } else {
      log = new TaskLog({
        taskId: id,
        userId: req.user._id,
        date: logDate,
        count: count || 1,
        meta: { device: 'web', source: 'dashboard' }
      });
    }

    await log.save();

    // Find the latest completion date for this task (anchor for current streak)
    const lastLog = await TaskLog.findOne({ taskId: id }).sort({ date: -1 });
    const anchorDate = lastLog ? lastLog.date : logDate;

    // Update task's lastCompletedDate for quick lookups
    task.lastCompletedDate = anchorDate;
    await task.save();

    let summary = await TaskSummary.findOne({ taskId: id });
    if (!summary) {
      summary = new TaskSummary({
        taskId: id,
        userId: req.user._id
      });
    }

    // Compute streak anchored to the most recent completion date if task has streaks enabled
    const currentStreak = task.enableStreak ? await computeStreak(id, anchorDate, tzOffset) : 0;
    summary.currentStreak = currentStreak;
    summary.maxStreak = Math.max(summary.maxStreak, currentStreak);
    summary.lastCompletedAt = anchorDate;

    // Recompute totals from DB to avoid retroactive inconsistencies
    const totalLogs = await TaskLog.countDocuments({ taskId: id });
    summary.totalCompletions = totalLogs;
    summary.completionRate = await calculateCompletionRate(id, task.startDate);
    summary.weeklyScore = await computeWeeklyScore(id, anchorDate, tzOffset);
    summary.productivityIndex = computeProductivityIndex(summary);

    await summary.save();

    res.json({
      log: log.toObject(),
      summary: summary.toObject(),
      task: task.toObject()
    });
  } catch (error) {
    console.error('Error marking task:', error);
    res.status(500).json({ message: 'Error marking task', error: error.message });
  }
};

export const unmarkTaskComplete = async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.body;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const tzOffset = (req.body.timezoneOffset || req.headers['x-timezone-offset']) ? parseInt(req.body.timezoneOffset || req.headers['x-timezone-offset'], 10) || 0 : 0;
    const logDate = normalizeDateToMidnight(date || new Date(), tzOffset);

    const log = await TaskLog.findOne({ taskId: id, date: logDate });
    if (log) {
      if ((log.count || 1) > 1) {
        log.count = (log.count || 1) - 1;
        await log.save();
      } else {
        await TaskLog.deleteOne({ _id: log._id });
      }
    } else {
      return res.status(404).json({ message: 'No completion found for that date' });
    }

    let summary = await TaskSummary.findOne({ taskId: id });
    if (!summary) {
      return res.status(404).json({ message: 'Task summary not found' });
    }

    const lastLog = await TaskLog.findOne({ taskId: id }).sort({ date: -1 });
    summary.lastCompletedAt = lastLog ? lastLog.date : null;

    const totalLogs = await TaskLog.countDocuments({ taskId: id });
    summary.totalCompletions = totalLogs;

    if (lastLog && task.enableStreak) {
      summary.currentStreak = await computeStreak(id, lastLog.date, tzOffset);
    } else {
      summary.currentStreak = 0;
    }

    summary.completionRate = await calculateCompletionRate(id, task.startDate);
    await summary.save();

    // Update task's lastCompletedDate
    task.lastCompletedDate = summary.lastCompletedAt;
    await task.save();

    res.json({ message: 'Task unmarked', summary: summary.toObject(), task: task.toObject() });
  } catch (error) {
    console.error('Error unmarking task:', error);
    res.status(500).json({ message: 'Error unmarking task', error: error.message });
  }
};

export const getTaskHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { from, to } = req.query;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const query = { taskId: id };

    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = new Date(from);
      if (to) query.date.$lte = new Date(to);
    }

    const logs = await TaskLog.find(query).sort({ date: 1 });

    res.json(logs);
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ message: 'Error fetching history', error: error.message });
  }
};

export const getTaskSummary = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const summary = await TaskSummary.findOne({ taskId: id });

    res.json(summary || { message: 'No summary found' });
  } catch (error) {
    console.error('Error fetching summary:', error);
    res.status(500).json({ message: 'Error fetching summary', error: error.message });
  }
};

export const bulkMarkTasks = async (req, res) => {
  try {
    const { ids, date } = req.body; // ids: array of task ids
    if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ message: 'ids array required' });

    const logDate = normalizeDateToMidnight(date || new Date());
    const results = [];

    for (const id of ids) {
      const task = await Task.findById(id);
      if (!task || task.userId.toString() !== req.user._id.toString()) continue;

      let log = await TaskLog.findOne({ taskId: id, date: logDate });
      if (log) {
        log.count = (log.count || 0) + 1;
      } else {
        log = new TaskLog({ taskId: id, userId: req.user._id, date: logDate, count: 1, meta: { source: 'bulk' } });
      }
      await log.save();

      task.lastCompletedDate = logDate;
      await task.save();

      let summary = await TaskSummary.findOne({ taskId: id });
      if (!summary) summary = new TaskSummary({ taskId: id, userId: req.user._id });

      const currentStreak = await computeStreak(id, logDate);
      summary.currentStreak = currentStreak;
      summary.maxStreak = Math.max(summary.maxStreak, currentStreak);
      summary.lastCompletedAt = logDate;
      summary.totalCompletions = (summary.totalCompletions || 0) + 1;
      summary.completionRate = await calculateCompletionRate(id, task.startDate);
      summary.weeklyScore = await computeWeeklyScore(id, logDate);
      summary.productivityIndex = computeProductivityIndex(summary);
      await summary.save();

      results.push({ id, summary: summary.toObject() });
    }

    res.json({ message: 'Bulk mark completed', results });
  } catch (error) {
    console.error('Error bulk marking tasks:', error);
    res.status(500).json({ message: 'Error bulk marking tasks', error: error.message });
  }
};

export const bulkUnmarkTasks = async (req, res) => {
  try {
    const { ids, date } = req.body;
    if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ message: 'ids array required' });

    const logDate = normalizeDateToMidnight(date || new Date());
    const results = [];

    for (const id of ids) {
      const task = await Task.findById(id);
      if (!task || task.userId.toString() !== req.user._id.toString()) continue;

      await TaskLog.deleteOne({ taskId: id, date: logDate });

      let summary = await TaskSummary.findOne({ taskId: id });
      if (!summary) continue;

      const lastLog = await TaskLog.findOne({ taskId: id }).sort({ date: -1 });
      summary.lastCompletedAt = lastLog ? lastLog.date : null;
      summary.totalCompletions = await TaskLog.countDocuments({ taskId: id });
      summary.currentStreak = lastLog ? await computeStreak(id, lastLog.date) : 0;
      summary.completionRate = await calculateCompletionRate(id, task.startDate);
      summary.weeklyScore = await computeWeeklyScore(id, lastLog || new Date());
      summary.productivityIndex = computeProductivityIndex(summary);
      await summary.save();

      task.lastCompletedDate = summary.lastCompletedAt;
      await task.save();

      results.push({ id, summary: summary.toObject() });
    }

    res.json({ message: 'Bulk unmark completed', results });
  } catch (error) {
    console.error('Error bulk unmarking tasks:', error);
    res.status(500).json({ message: 'Error bulk unmarking tasks', error: error.message });
  }
};

export const getStatistics = async (req, res) => {
  try {
    const userId = req.user._id;
    const totalTasks = await Task.countDocuments({ userId, archive: false });
    const totalCompletedAllTime = await TaskLog.countDocuments({ userId });

    const last7 = new Date(); last7.setDate(last7.getDate() - 7);
    const completedLast7 = await TaskLog.countDocuments({ userId, date: { $gte: last7 } });

    const summaries = await TaskSummary.find({ userId }).sort({ productivityIndex: -1 }).limit(5);

    res.json({ totalTasks, totalCompletedAllTime, completedLast7, topTasks: summaries.map(s => ({ taskId: s.taskId, productivityIndex: s.productivityIndex })) });
  } catch (error) {
    console.error('Error getting statistics:', error);
    res.status(500).json({ message: 'Error getting statistics', error: error.message });
  }
};

export const updateTaskPosition = async (req, res) => {
  try {
    const { id } = req.params;
    const { position, zIndex, width, height } = req.body;

    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (task.userId.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Unauthorized' });

    if (position) {
      if (typeof position.x === 'number') task.position.x = position.x;
      if (typeof position.y === 'number') task.position.y = position.y;
    }

    if (typeof zIndex === 'number') task.zIndex = zIndex;
    if (typeof width === 'number') task.width = width;
    if (typeof height === 'number') task.height = height;

    await task.save();
    res.json({ message: 'Position updated', task: task.toObject() });
  } catch (error) {
    console.error('Error updating position:', error);
    res.status(500).json({ message: 'Error updating position', error: error.message });
  }
};

export const bulkUpdatePositions = async (req, res) => {
  try {
    const { positions } = req.body; // [{ id, position: {x,y}, zIndex, width, height }, ...]
    if (!Array.isArray(positions)) return res.status(400).json({ message: 'positions array required' });

    const results = [];
    for (const p of positions) {
      const task = await Task.findById(p.id);
      if (!task || task.userId.toString() !== req.user._id.toString()) continue;
      if (p.position) {
        if (typeof p.position.x === 'number') task.position.x = p.position.x;
        if (typeof p.position.y === 'number') task.position.y = p.position.y;
      }
      if (typeof p.zIndex === 'number') task.zIndex = p.zIndex;
      if (typeof p.width === 'number') task.width = p.width;
      if (typeof p.height === 'number') task.height = p.height;
      await task.save();
      results.push({ id: p.id, position: task.position, zIndex: task.zIndex, width: task.width, height: task.height });
    }

    res.json({ message: 'Positions updated', results });
  } catch (error) {
    console.error('Error bulk updating positions:', error);
    res.status(500).json({ message: 'Error bulk updating positions', error: error.message });
  }
};

export const getDashboardData = async (req, res) => {
  try {
    const { range } = req.query;
    const days = parseInt(range) || 30;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const tasks = await Task.find({ userId: req.user._id, archive: false }).sort({ priority: 1, createdAt: -1 }).lean();

    const taskIds = tasks.map(t => t._id);

    const logs = await TaskLog.find({
      taskId: { $in: taskIds },
      date: { $gte: startDate }
    }).sort({ date: 1 }).lean();

    const summaries = await TaskSummary.find({ taskId: { $in: taskIds } }).lean();

    const taskData = tasks.map(task => {
      const summary = summaries.find(s => String(s.taskId) === String(task._id));
      const recentLogs = logs.filter(l => String(l.taskId) === String(task._id));

      return {
        ...task,
        summary: summary || null,
        recentLogs
      };
    });

    res.json({
      tasks: taskData,
      range: days,
      startDate,
      endDate: new Date()
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ message: 'Error fetching dashboard data', error: error.message });
  }
};