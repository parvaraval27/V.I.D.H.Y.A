import mongoose from 'mongoose';

const taskSummarySchema = new mongoose.Schema({
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  currentStreak: { type: Number, default: 0 },
  maxStreak: { type: Number, default: 0 },
  lastCompletedAt: { type: Date, default: null },
  totalCompletions: { type: Number, default: 0 },
  completionRate: { type: Number, default: 0 },
  // Gamification / productivity metrics
  weeklyScore: { type: Number, default: 0 },
  productivityIndex: { type: Number, default: 0 }
});

taskSummarySchema.index({ userId: 1 });

const TaskSummary = mongoose.model('TaskSummary', taskSummarySchema);
export default TaskSummary;
