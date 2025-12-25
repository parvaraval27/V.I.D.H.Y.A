import Habit from '../models/Habit.js';
import HabitLog from '../models/HabitLog.js';
import HabitSummary from '../models/HabitSummary.js';

// Helper function to normalize date to midnight
const normalizeDateToMidnight = (date, timezone = 'UTC') => {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

// Helper to calculate completion rate
const calculateCompletionRate = async (habitId, startDate) => {
  const habit = await Habit.findById(habitId);
  if (!habit) return 0;

  const today = normalizeDateToMidnight(new Date());
  const daysSinceStart = Math.floor((today - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1;
  
  const totalLogs = await HabitLog.countDocuments({ habitId });
  
  if (daysSinceStart <= 0) return 0;
  return Math.min(totalLogs / daysSinceStart, 1);
};

// Helper to compute streak
const computeStreak = async (habitId, currentDate) => {
  let streak = 1;
  let prevDate = new Date(currentDate);
  prevDate.setDate(prevDate.getDate() - 1);

  while (true) {
    const log = await HabitLog.findOne({
      habitId,
      date: normalizeDateToMidnight(prevDate)
    });

    if (!log) break;

    streak++;
    prevDate.setDate(prevDate.getDate() - 1);
  }

  return streak;
};

export const getHabits = async (req, res) => {
  try {
    const { archive } = req.query;
    const query = { userId: req.user._id };

    if (archive !== undefined) {
      query.archive = archive === 'true';
    } else {
      query.archive = false; // default to active habits
    }

    const habits = await Habit.find(query).sort({ createdAt: -1 });

    // Get summaries for all habits
    const habitIds = habits.map(h => h._id);
    const summaries = await HabitSummary.find({ habitId: { $in: habitIds } });

    const summaryMap = {};
    summaries.forEach(s => {
      summaryMap[s.habitId] = s;
    });

    const habitsWithSummary = habits.map(habit => ({
      ...habit.toObject(),
      summary: summaryMap[habit._id] || null
    }));

    res.json(habitsWithSummary);
  } catch (error) {
    console.error('Error fetching habits:', error);
    res.status(500).json({ message: 'Error fetching habits', error: error.message });
  }
};

export const createHabit = async (req, res) => {
  try {
    const { title, description, tags, schedule, reminder, target, difficulty, visibility } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const habit = new Habit({
      userId: req.user._id,
      title,
      description,
      tags: tags || [],
      schedule: schedule || { kind: 'daily' },
      reminder: reminder || { enabled: false },
      target: target || 1,
      difficulty: difficulty || 'medium',
      visibility: visibility || 'private'
    });

    await habit.save();

    // Create initial summary
    const summary = new HabitSummary({
      habitId: habit._id,
      userId: req.user._id,
      currentStreak: 0,
      maxStreak: 0,
      completionRate: 0,
      totalCompletions: 0
    });

    await summary.save();

    res.status(201).json({
      ...habit.toObject(),
      summary: summary.toObject()
    });
  } catch (error) {
    console.error('Error creating habit:', error);
    res.status(500).json({ message: 'Error creating habit', error: error.message });
  }
};

export const updateHabit = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, tags, schedule, reminder, target, difficulty, visibility, archive } = req.body;

    const habit = await Habit.findById(id);
    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }

    if (habit.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (title) habit.title = title;
    if (description !== undefined) habit.description = description;
    if (tags) habit.tags = tags;
    if (schedule) habit.schedule = schedule;
    if (reminder) habit.reminder = reminder;
    if (target) habit.target = target;
    if (difficulty) habit.difficulty = difficulty;
    if (visibility) habit.visibility = visibility;
    if (archive !== undefined) habit.archive = archive;

    habit.updatedAt = new Date();
    await habit.save();

    const summary = await HabitSummary.findOne({ habitId: id });

    res.json({
      ...habit.toObject(),
      summary: summary ? summary.toObject() : null
    });
  } catch (error) {
    console.error('Error updating habit:', error);
    res.status(500).json({ message: 'Error updating habit', error: error.message });
  }
};

export const deleteHabit = async (req, res) => {
  try {
    const { id } = req.params;

    const habit = await Habit.findById(id);
    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }

    if (habit.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Soft delete: archive the habit
    habit.archive = true;
    await habit.save();

    res.json({ message: 'Habit archived successfully' });
  } catch (error) {
    console.error('Error deleting habit:', error);
    res.status(500).json({ message: 'Error deleting habit', error: error.message });
  }
};

export const markHabitComplete = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, count } = req.body;

    const habit = await Habit.findById(id);
    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }

    if (habit.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const logDate = normalizeDateToMidnight(date || new Date());
    let log = await HabitLog.findOne({ habitId: id, date: logDate });

    if (log) {
      log.count = (log.count || 0) + (count || 1);
    } else {
      log = new HabitLog({
        habitId: id,
        userId: req.user._id,
        date: logDate,
        count: count || 1,
        meta: { device: 'web', source: 'dashboard' }
      });
    }

    await log.save();

    // Update summary
    let summary = await HabitSummary.findOne({ habitId: id });
    if (!summary) {
      summary = new HabitSummary({
        habitId: id,
        userId: req.user._id
      });
    }

    // Recompute streak
    const currentStreak = await computeStreak(id, logDate);
    summary.currentStreak = currentStreak;
    summary.maxStreak = Math.max(summary.maxStreak, currentStreak);
    summary.lastCompletedAt = logDate;
    summary.totalCompletions = (summary.totalCompletions || 0) + 1;
    summary.completionRate = await calculateCompletionRate(id, habit.startDate);

    await summary.save();

    res.json({
      log: log.toObject(),
      summary: summary.toObject()
    });
  } catch (error) {
    console.error('Error marking habit:', error);
    res.status(500).json({ message: 'Error marking habit', error: error.message });
  }
};

export const unmarkHabitComplete = async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.body;

    const habit = await Habit.findById(id);
    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }

    if (habit.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const logDate = normalizeDateToMidnight(date || new Date());
    await HabitLog.deleteOne({ habitId: id, date: logDate });

    // Recalculate summary
    let summary = await HabitSummary.findOne({ habitId: id });
    if (!summary) {
      return res.status(404).json({ message: 'Habit summary not found' });
    }

    const lastLog = await HabitLog.findOne({ habitId: id }).sort({ date: -1 });
    summary.lastCompletedAt = lastLog ? lastLog.date : null;

    const totalLogs = await HabitLog.countDocuments({ habitId: id });
    summary.totalCompletions = totalLogs;

    if (lastLog) {
      summary.currentStreak = await computeStreak(id, lastLog.date);
    } else {
      summary.currentStreak = 0;
    }

    summary.completionRate = await calculateCompletionRate(id, habit.startDate);
    await summary.save();

    res.json({ message: 'Habit unmarked', summary: summary.toObject() });
  } catch (error) {
    console.error('Error unmarking habit:', error);
    res.status(500).json({ message: 'Error unmarking habit', error: error.message });
  }
};

export const getHabitHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { from, to } = req.query;

    const habit = await Habit.findById(id);
    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }

    if (habit.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const query = { habitId: id };

    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = new Date(from);
      if (to) query.date.$lte = new Date(to);
    }

    const logs = await HabitLog.find(query).sort({ date: 1 });

    res.json(logs);
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ message: 'Error fetching history', error: error.message });
  }
};

export const getHabitSummary = async (req, res) => {
  try {
    const { id } = req.params;

    const habit = await Habit.findById(id);
    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }

    if (habit.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const summary = await HabitSummary.findOne({ habitId: id });

    res.json(summary || { message: 'No summary found' });
  } catch (error) {
    console.error('Error fetching summary:', error);
    res.status(500).json({ message: 'Error fetching summary', error: error.message });
  }
};

export const getDashboardData = async (req, res) => {
  try {
    const { range } = req.query;
    const days = parseInt(range) || 30;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const habits = await Habit.find({ userId: req.user._id, archive: false }).sort({ createdAt: -1 });

    const habitIds = habits.map(h => h._id);

    const logs = await HabitLog.find({
      habitId: { $in: habitIds },
      date: { $gte: startDate }
    }).sort({ date: 1 });

    const summaries = await HabitSummary.find({ habitId: { $in: habitIds } });

    const habitData = habits.map(habit => {
      const summary = summaries.find(s => s.habitId.equals(habit._id));
      const habitLogs = logs.filter(l => l.habitId.equals(habit._id));

      return {
        ...habit.toObject(),
        summary: summary || null,
        recentLogs: habitLogs
      };
    });

    res.json({
      habits: habitData,
      range: days,
      startDate,
      endDate: new Date()
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ message: 'Error fetching dashboard data', error: error.message });
  }
};
