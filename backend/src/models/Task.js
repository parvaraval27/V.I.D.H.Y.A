import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: [true, 'Task title is required'] },
  description: { type: String },
  tags: { type: [String], default: [] },
  schedule: { type: Object, default: { kind: 'daily' } },
  reminder: { type: Object, default: { enabled: false } },
  target: { type: Number, default: 1 },
  difficulty: { type: String, default: 'medium' },
  visibility: { type: String, default: 'private' },
  archive: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  startDate: { type: Date, default: Date.now }
});

// Indexes to speed up queries
taskSchema.index({ userId: 1 });
taskSchema.index({ userId: 1, archive: 1 });

const Task = mongoose.model('Task', taskSchema);
export default Task;
