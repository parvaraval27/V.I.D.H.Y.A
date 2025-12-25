import mongoose from 'mongoose';

const habitSummarySchema = new mongoose.Schema({
  habitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Habit',
    unique: true,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  currentStreak: {
    type: Number,
    default: 0
  },
  maxStreak: {
    type: Number,
    default: 0
  },
  completionRate: {
    type: Number,
    default: 0, // 0 to 1
    min: 0,
    max: 1
  },
  lastCompletedAt: Date,
  longestGapDays: {
    type: Number,
    default: 0
  },
  totalCompletions: {
    type: Number,
    default: 0
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for fast dashboard queries
habitSummarySchema.index({ userId: 1 });

const HabitSummary = mongoose.model('HabitSummary', habitSummarySchema);
export default HabitSummary;
