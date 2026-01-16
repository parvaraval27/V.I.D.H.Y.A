import Task from '../models/Task.js';
import TaskLog from '../models/TaskLog.js';
import TaskSummary from '../models/TaskSummary.js';

// Helper function to normalize date to midnight
const normalizeDateToMidnight = (date, timezone = 'UTC') => {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

// Helper to calculate completion rate
const calculateCompletionRate = async (taskId, startDate) => {
  const task = await Task.findById(taskId);
  if (!task) return 0;

  const today = normalizeDateToMidnight(new Date());
  const daysSinceStart = Math.floor((today - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1;
  
  const totalLogs = await TaskLog.countDocuments({ taskId });
  
  if (daysSinceStart <= 0) return 0;
  return Math.min(totalLogs / daysSinceStart, 1);
};

// Helper to compute streak
const computeStreak = async (taskId, currentDate) => {
  let streak = 1;
  let prevDate = new Date(currentDate);
  prevDate.setDate(prevDate.getDate() - 1);

  while (true) {
    const log = await TaskLog.findOne({
      taskId,
      date: normalizeDateToMidnight(prevDate)
    });

    if (!log) break;

    streak++;
    prevDate.setDate(prevDate.getDate() - 1);
  }

  return streak;
};

export const getTasks = async (req, res) => {
  try {
    const { archive } = req.query;
    const query = { userId: req.user._id };

    if (archive !== undefined) {
      query.archive = archive === 'true';
    } else {
      query.archive = false;
    }

    const tasks = await Task.find(query).sort({ createdAt: -1 });

    const taskIds = tasks.map(t => t._id);
    const summaries = await TaskSummary.find({ taskId: { $in: taskIds } });

    const summaryMap = {};
    summaries.forEach(s => {
      summaryMap[s.taskId] = s;
    });

    const tasksWithSummary = tasks.map(task => ({
      ...task.toObject(),
      summary: summaryMap[task._id] || null
    }));

    res.json(tasksWithSummary);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: 'Error fetching tasks', error: error.message });
  }
};

export const createTask = async (req, res) => {
  try {
    const { title, description, tags, schedule, reminder, target, difficulty, visibility } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const task = new Task({
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

    await task.save();

    const summary = new TaskSummary({
      taskId: task._id,
      userId: req.user._id,
      currentStreak: 0,
      maxStreak: 0,
      completionRate: 0,
      totalCompletions: 0
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
    const { title, description, tags, schedule, reminder, target, difficulty, visibility, archive } = req.body;

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
    if (reminder) task.reminder = reminder;
    if (target) task.target = target;
    if (difficulty) task.difficulty = difficulty;
    if (visibility) task.visibility = visibility;
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

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    task.archive = true;
    await task.save();

    res.json({ message: 'Task archived successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ message: 'Error deleting task', error: error.message });
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

    const logDate = normalizeDateToMidnight(date || new Date());
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

    let summary = await TaskSummary.findOne({ taskId: id });
    if (!summary) {
      summary = new TaskSummary({
        taskId: id,
        userId: req.user._id
      });
    }

    const currentStreak = await computeStreak(id, logDate);
    summary.currentStreak = currentStreak;
    summary.maxStreak = Math.max(summary.maxStreak, currentStreak);
    summary.lastCompletedAt = logDate;
    summary.totalCompletions = (summary.totalCompletions || 0) + 1;
    summary.completionRate = await calculateCompletionRate(id, task.startDate);

    await summary.save();

    res.json({
      log: log.toObject(),
      summary: summary.toObject()
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

    const logDate = normalizeDateToMidnight(date || new Date());
    await TaskLog.deleteOne({ taskId: id, date: logDate });

    let summary = await TaskSummary.findOne({ taskId: id });
    if (!summary) {
      return res.status(404).json({ message: 'Task summary not found' });
    }

    const lastLog = await TaskLog.findOne({ taskId: id }).sort({ date: -1 });
    summary.lastCompletedAt = lastLog ? lastLog.date : null;

    const totalLogs = await TaskLog.countDocuments({ taskId: id });
    summary.totalCompletions = totalLogs;

    if (lastLog) {
      summary.currentStreak = await computeStreak(id, lastLog.date);
    } else {
      summary.currentStreak = 0;
    }

    summary.completionRate = await calculateCompletionRate(id, task.startDate);
    await summary.save();

    res.json({ message: 'Task unmarked', summary: summary.toObject() });
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

export const getDashboardData = async (req, res) => {
  try {
    const { range } = req.query;
    const days = parseInt(range) || 30;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const tasks = await Task.find({ userId: req.user._id, archive: false }).sort({ createdAt: -1 });

    const taskIds = tasks.map(t => t._id);

    const logs = await TaskLog.find({
      taskId: { $in: taskIds },
      date: { $gte: startDate }
    }).sort({ date: 1 });

    const summaries = await TaskSummary.find({ taskId: { $in: taskIds } });

    const taskData = tasks.map(task => {
      const summary = summaries.find(s => s.taskId.equals(task._id));
      const taskLogs = logs.filter(l => l.taskId.equals(task._id));

      return {
        ...task.toObject(),
        summary: summary || null,
        recentLogs: taskLogs
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