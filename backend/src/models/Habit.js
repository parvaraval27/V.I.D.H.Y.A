import mongoose from 'mongoose';

const habitSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Habit title is required'],
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  tags: [{
    type: String,
    trim: true
  }],
  startDate: {
    type: Date,
    default: Date.now
  },
  schedule: {
    type: {
      kind: {
        type: String,
        enum: ['daily', 'weekdays', 'every_n_days', 'monthly', 'custom'],
        default: 'daily'
      },
      days: [Number], // 0-6 for weekly (Sun-Sat), custom day numbers
      n: Number, // for every_n_days
      dayOfMonth: Number // for monthly
    },
    default: { kind: 'daily' }
  },
  reminder: {
    enabled: {
      type: Boolean,
      default: false
    },
    time: String, // "HH:MM" format
    channels: [{
      type: String,
      enum: ['email', 'push', 'in-app'],
      default: 'in-app'
    }]
  },
  target: {
    type: Number,
    default: 1 // times per scheduled day
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  visibility: {
    type: String,
    enum: ['private', 'friends', 'public'],
    default: 'private'
  },
  archive: {
    type: Boolean,
    default: false
  },
  settings: {
    allowMissedMarking: {
      type: Boolean,
      default: true
    }
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

// Index for performance
habitSchema.index({ userId: 1 });
habitSchema.index({ userId: 1, archive: 1 });

const Habit = mongoose.model('Habit', habitSchema);
export default Habit;
