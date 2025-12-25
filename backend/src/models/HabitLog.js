import mongoose from 'mongoose';

const habitLogSchema = new mongoose.Schema({
  habitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Habit',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true // normalized to user's local midnight
  },
  count: {
    type: Number,
    default: 1
  },
  meta: {
    device: String, // 'web', 'mobile', etc.
    source: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Unique index on habitId + date + userId
habitLogSchema.index({ habitId: 1, date: 1 }, { unique: true });
habitLogSchema.index({ userId: 1, date: 1 });
habitLogSchema.index({ userId: 1 });

const HabitLog = mongoose.model('HabitLog', habitLogSchema);
export default HabitLog;
