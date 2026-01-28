import User from '../models/User.js';
import Task from '../models/Task.js';
import TaskLog from '../models/TaskLog.js';
import TaskSummary from '../models/TaskSummary.js';

// Get user profile with computed stats
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -verificationCode -resetToken -resetTokenExpiry');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Compute stats
    const stats = await computeUserStats(req.user._id);

    res.json({
      user: user.toObject(),
      stats
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
};

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const { profile, academic, career, codingProfiles, skills, studyPreferences, preferences } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update profile fields
    if (profile) {
      user.profile = { ...user.profile?.toObject?.() || user.profile || {}, ...profile };
    }
    if (academic) {
      user.academic = { ...user.academic?.toObject?.() || user.academic || {}, ...academic };
    }
    if (career) {
      user.career = { ...user.career?.toObject?.() || user.career || {}, ...career };
    }
    if (codingProfiles) {
      user.codingProfiles = { ...user.codingProfiles?.toObject?.() || user.codingProfiles || {}, ...codingProfiles };
    }
    if (skills) {
      user.skills = { ...user.skills?.toObject?.() || user.skills || {}, ...skills };
    }
    if (studyPreferences) {
      user.studyPreferences = { ...user.studyPreferences?.toObject?.() || user.studyPreferences || {}, ...studyPreferences };
    }
    if (preferences) {
      user.preferences = { ...user.preferences?.toObject?.() || user.preferences || {}, ...preferences };
    }

    await user.save();

    // Return updated user without sensitive fields
    const updatedUser = await User.findById(req.user._id).select('-password -verificationCode -resetToken -resetTokenExpiry');
    const stats = await computeUserStats(req.user._id);

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser.toObject(),
      stats
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
};

// Get user stats
export const getStats = async (req, res) => {
  try {
    const stats = await computeUserStats(req.user._id);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Error fetching stats', error: error.message });
  }
};

// Helper function to compute user stats
async function computeUserStats(userId) {
  try {
    // Total tasks
    const totalTasks = await Task.countDocuments({ userId, archive: false });
    const archivedTasks = await Task.countDocuments({ userId, archive: true });
    
    // Total completions (sum of all log counts)
    const logs = await TaskLog.find({ userId });
    const totalCompletions = logs.reduce((sum, log) => sum + (log.count || 1), 0);
    
    // Unique days active (days with at least one completion)
    const uniqueDates = new Set(logs.map(log => log.date.toISOString().split('T')[0]));
    const daysActive = uniqueDates.size;
    
    // Best streak across all tasks
    const summaries = await TaskSummary.find({ userId });
    const bestStreak = summaries.reduce((max, s) => Math.max(max, s.maxStreak || 0), 0);
    const currentStreakMax = summaries.reduce((max, s) => Math.max(max, s.currentStreak || 0), 0);
    
    // Average completion rate
    const avgCompletionRate = summaries.length > 0 
      ? summaries.reduce((sum, s) => sum + (s.completionRate || 0), 0) / summaries.length 
      : 0;
    
    // Productivity score (weighted combination)
    const productivityScore = Math.round(
      (avgCompletionRate * 40) + 
      (Math.min(bestStreak, 30) / 30 * 30) + 
      (Math.min(daysActive, 100) / 100 * 20) +
      (Math.min(totalCompletions, 500) / 500 * 10)
    );
    
    // This week's completions
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const thisWeekLogs = logs.filter(log => new Date(log.date) >= weekStart);
    const thisWeekCompletions = thisWeekLogs.reduce((sum, log) => sum + (log.count || 1), 0);
    
    // Account age in days
    const user = await User.findById(userId);
    const accountAgeDays = user ? Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0;

    return {
      totalTasks,
      archivedTasks,
      totalCompletions,
      daysActive,
      bestStreak,
      currentStreakMax,
      avgCompletionRate: Math.round(avgCompletionRate * 100),
      productivityScore,
      thisWeekCompletions,
      accountAgeDays
    };
  } catch (error) {
    console.error('Error computing stats:', error);
    return {
      totalTasks: 0,
      archivedTasks: 0,
      totalCompletions: 0,
      daysActive: 0,
      bestStreak: 0,
      currentStreakMax: 0,
      avgCompletionRate: 0,
      productivityScore: 0,
      thisWeekCompletions: 0,
      accountAgeDays: 0
    };
  }
}

// Change password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'Error changing password', error: error.message });
  }
};

// Update username
export const updateUsername = async (req, res) => {
  try {
    const { username } = req.body;

    if (!username || username.trim().length < 3) {
      return res.status(400).json({ message: 'Username must be at least 3 characters' });
    }

    // Check if username is taken
    const existing = await User.findOne({ username: username.trim(), _id: { $ne: req.user._id } });
    if (existing) {
      return res.status(400).json({ message: 'Username is already taken' });
    }

    const user = await User.findById(req.user._id);
    user.username = username.trim();
    await user.save();

    res.json({ message: 'Username updated successfully', username: user.username });
  } catch (error) {
    console.error('Error updating username:', error);
    res.status(500).json({ message: 'Error updating username', error: error.message });
  }
};
