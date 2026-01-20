import mongoose from 'mongoose';

const reminderTypeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: [true, 'Type name is required'] },
  color: { type: String, default: '#10B981' }, // default green
  createdAt: { type: Date, default: Date.now }
});

reminderTypeSchema.index({ userId: 1 });

const ReminderType = mongoose.model('ReminderType', reminderTypeSchema);
export default ReminderType;
