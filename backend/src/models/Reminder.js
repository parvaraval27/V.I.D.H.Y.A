import mongoose from 'mongoose';

const reminderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: [true, 'Reminder title is required'] },
  description: { type: String, default: '' },
  typeId: { type: mongoose.Schema.Types.ObjectId, ref: 'ReminderType', default: null },
  // base date/time of the reminder occurrence (used as anchor for repeats)
  occurrenceDate: { type: Date, required: true },
  // repeat: 'single' | 'monthly' | 'yearly'
  repeat: {
    kind: { type: String, enum: ['single', 'monthly', 'yearly'], default: 'single' },
    // every N months/years
    interval: { type: Number, default: 1 },
    // optional end date for repeating
    until: { type: Date, default: null }
  },
  // optional override color, else color from type will be used
  color: { type: String, default: null },
  archived: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

reminderSchema.index({ userId: 1 });
reminderSchema.index({ userId: 1, archived: 1 });

const Reminder = mongoose.model('Reminder', reminderSchema);
export default Reminder;
