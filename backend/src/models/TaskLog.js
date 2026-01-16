import mongoose from 'mongoose';

const taskLogSchema = new mongoose.Schema({
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  count: { type: Number, default: 1 },
  meta: { type: Object, default: {} }
});

// Unique index on taskId + date
taskLogSchema.index({ taskId: 1, date: 1 }, { unique: true });
taskLogSchema.index({ userId: 1, date: 1 });

const TaskLog = mongoose.model('TaskLog', taskLogSchema);
export default TaskLog;
