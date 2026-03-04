import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  metadata: { type: mongoose.Schema.Types.Mixed },
}, { _id: false });

const conversationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  messages: { type: [messageSchema], default: [] },
  sessionContext: {
    type: mongoose.Schema.Types.Mixed,
    default: () => ({
      pendingIntent: null,
      filledSlots: {},
      missingSlot: null,
      lastIntent: null,
    }),
  },
  active: { type: Boolean, default: true },
}, { timestamps: true });

// Index for quick lookup of user's active conversation
conversationSchema.index({ userId: 1, active: 1 });

const Conversation = mongoose.model('Conversation', conversationSchema);
export default Conversation;
