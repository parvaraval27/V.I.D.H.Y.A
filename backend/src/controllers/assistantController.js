// Assistant controller handles chat messages, conversation history, suggestions and resets.
import Conversation from '../models/Conversation.js';
import { processMessage, isReady } from '../assistant/nlpEngine.js';
import { fillSlots, createContext } from '../assistant/slotFiller.js';
import { executeAction } from '../assistant/actionExecutor.js';

/**
 * POST /api/assistant/message
 * Body: { text: string }
 */
export const handleMessage = async (req, res) => {
  try {
    if (!isReady()) {
      return res.status(503).json({ message: 'Assistant is still starting up. Please try again in a moment.' });
    }

    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Message text is required.' });
    }

    const userId = req.user._id;
    const rawText = text.trim();

    // Get or create active conversation
    let convo = await Conversation.findOne({ userId, active: true });
    if (!convo) {
      convo = await Conversation.create({ userId });
    }

    // Restore session context (it should be plain object not Mongoose doc)
    const stored = convo.sessionContext ? convo.sessionContext.toJSON ? convo.sessionContext.toJSON() : convo.sessionContext : {};
    const context = {
      pendingIntent: stored.pendingIntent || null,
      filledSlots: stored.filledSlots && typeof stored.filledSlots === 'object' ? { ...stored.filledSlots } : {},
      missingSlot: stored.missingSlot || null,
      lastIntent: stored.lastIntent || null,
    };

    // Run NLP
    const nlpResult = await processMessage(rawText);

    // Slot filling
    const slotResult = fillSlots(nlpResult, context, rawText);

    let responseMessage;
    let responseAction = null;
    let responseData = null;

    if (slotResult.ready) {
      // Intent is fully resolved
      // For greeting/help/thanks the answer comes from NLP corpus
      if (['greeting', 'help', 'thanks'].includes(slotResult.intent) && nlpResult.answer) {
        responseMessage = nlpResult.answer;
      } else if (slotResult.intent === 'None' || !slotResult.intent) {
        responseMessage = nlpResult.answer || "I didn't quite get that. Type **help** to see what I can do.";
      } else {
        const actionResult = await executeAction(userId, slotResult.intent, slotResult.slots);
        responseMessage = actionResult.message;
        responseAction = actionResult.action || null;
        responseData = actionResult.data || null;
      }
    } else {
      // Follow up as we need more info now
      responseMessage = slotResult.prompt;
    }

    // Append messages to conversation
    convo.messages.push({ role: 'user', text: rawText, timestamp: new Date() });
    convo.messages.push({
      role: 'assistant',
      text: responseMessage,
      timestamp: new Date(),
      metadata: {
        intent: slotResult.intent,
        score: nlpResult.score,
        action: responseAction,
        slots: slotResult.slots,
      },
    });

    // Save updated context
    convo.sessionContext = context;
    convo.markModified('sessionContext');
    convo.markModified('messages');
    await convo.save();

    res.json({
      message: responseMessage,
      action: responseAction,
      data: responseData,
      intent: slotResult.intent,
      confidence: nlpResult.score,
    });
  } catch (err) {
    console.error('[Assistant] handleMessage error:', err);
    res.status(500).json({ message: 'Something went wrong processing your message.' });
  }
};

/**
 * GET /api/assistant/history
 * Returns messages from the active conversation.
 */
export const getHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const convo = await Conversation.findOne({ userId, active: true });
    if (!convo) return res.json({ messages: [] });

    res.json({ messages: convo.messages });
  } catch (err) {
    console.error('[Assistant] getHistory error:', err);
    res.status(500).json({ message: 'Failed to fetch history.' });
  }
};

/**
 * POST /api/assistant/reset
 * Clears session context and optionally starts a new conversation.
 */
export const resetConversation = async (req, res) => {
  try {
    const userId = req.user._id;
    const { newSession } = req.body || {};

    if (newSession) {
      // Archive current and create new
      await Conversation.updateMany({ userId, active: true }, { active: false });
      const convo = await Conversation.create({ userId });
      return res.json({ message: 'Started a new conversation.', conversationId: convo._id });
    }

    // Just clear context within current conversation
    const convo = await Conversation.findOne({ userId, active: true });
    if (convo) {
      convo.sessionContext = createContext();
      convo.markModified('sessionContext');
      await convo.save();
    }

    res.json({ message: 'Conversation context cleared.' });
  } catch (err) {
    console.error('[Assistant] resetConversation error:', err);
    res.status(500).json({ message: 'Failed to reset conversation.' });
  }
};

/**
 * GET /api/assistant/suggestions
 * Returns example commands for help/onboarding.
 */
export const getSuggestions = async (_req, res) => {
  res.json({
    suggestions: [
      'Add a task called Meditation daily',
      'Mark Meditation as done',
      'Show my tasks',
      "What's my streak on Meditation?",
      'Show my stats',
      'Go to calendar',
      'Help',
    ],
  });
};
