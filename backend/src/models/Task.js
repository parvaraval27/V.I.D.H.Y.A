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
  // priority for sorting and highlights
  priority: { type: String, enum: ['low','medium','high'], default: 'medium' },
  // labelColor lets frontend colorize task cards (hex or css color)
  labelColor: { type: String, default: '#1D4ED8' },
  // lastCompletedDate speeds up streak computation without scanning logs
  lastCompletedDate: { type: Date, default: null },
  // Positioning for board / sticky notes
  position: {
    x: { type: Number, default: 20 },
    y: { type: Number, default: 20 }
  },
  zIndex: { type: Number, default: 0 },
  width: { type: Number, default: 300 },
  height: { type: Number, default: 160 },
  archive: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  startDate: { type: Date, default: Date.now }
});

// Indexes to speed up queries
taskSchema.index({ userId: 1 });
taskSchema.index({ userId: 1, archive: 1 });
taskSchema.index({ userId: 1, priority: 1 });

const Task = mongoose.model('Task', taskSchema);
export default Task;
