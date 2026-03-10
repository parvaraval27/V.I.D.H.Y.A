// Assistant controller handles chat messages, conversation history, suggestions and resets.
import Conversation from '../models/Conversation.js';
import User from '../models/User.js';
import Task from '../models/Task.js';
import { processMessage, isReady } from '../assistant/nlpEngine.js';
import { fillSlots, createContext } from '../assistant/slotFiller.js';
import { executeAction } from '../assistant/actionExecutor.js';
import { llmFallback, isLLMAvailable } from '../assistant/llmFallback.js';

const LLM_DAILY_LIMIT = 20;
const NLP_CONFIDENCE_THRESHOLD = 0.7;

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

    // --- LLM Fallback Logic ---
    let usedLLM = false;
    let llmCallsRemaining = LLM_DAILY_LIMIT;

    // Intents where nlp.js extracted a meaningful entity (title, etc.) — trust those.
    // For "soft" intents (help, greeting, thanks, profile.stats, navigate.*) that
    // have no required entities, nlp.js often overfits on vague user messages.
    // Route those to LLM when the message doesn't match expected patterns.
    const TRUSTED_INTENTS = ['task.create', 'task.update', 'task.delete', 'task.restore',
      'task.mark', 'task.unmark', 'task.query', 'task.list'];

    const hasEntities = nlpResult.entities && Object.keys(nlpResult.entities).length > 0;
    const isTrustedIntent = TRUSTED_INTENTS.includes(nlpResult.intent) && hasEntities;

    // Simple keyword checks for soft intents
    const SOFT_INTENT_KEYWORDS = {
      'help': /\b(help|what can you do|commands?)\b/i,
      'greeting': /\b(hi|hello|hey|good\s*(morning|afternoon|evening)|howdy|sup)\b/i,
      'thanks': /\b(thanks?|thank\s*you|thx|ty|cheers)\b/i,
      'profile.stats': /\b(stats?|streak|progress|score|how.*doing|summary)\b/i,
    };
    const softKeywordPattern = SOFT_INTENT_KEYWORDS[nlpResult.intent];
    const softIntentMatchesKeywords = softKeywordPattern && softKeywordPattern.test(rawText);

    const isLikelyMisclassified = !isTrustedIntent
      && nlpResult.intent !== 'None'
      && !softIntentMatchesKeywords;

    const needsLLM = (nlpResult.intent === 'None' || nlpResult.score < NLP_CONFIDENCE_THRESHOLD || isLikelyMisclassified)
      && !context.pendingIntent; // don't override active slot-filling

    if (needsLLM && isLLMAvailable()) {
      // Check user's daily LLM budget
      const user = await User.findById(userId);
      if (user) {
        const now = new Date();
        const lastReset = user.assistantUsage?.llmLastReset || new Date(0);
        if (now.toDateString() !== lastReset.toDateString()) {
          user.assistantUsage = { llmCallsToday: 0, llmLastReset: now };
        }

        llmCallsRemaining = LLM_DAILY_LIMIT - (user.assistantUsage.llmCallsToday || 0);

        if (llmCallsRemaining > 0) {
          // Fetch user's task titles for context
          const tasks = await Task.find({ userId, archive: false }).select('title').lean();
          const taskTitles = tasks.map(t => t.title);

          const llmResult = await llmFallback(rawText, taskTitles);
          if (llmResult && llmResult.intent !== 'None') {
            // Override NLP result with LLM result
            nlpResult.intent = llmResult.intent;
            nlpResult.score = 0.85; // synthetic confidence for downstream logic
            nlpResult.answer = llmResult.message || nlpResult.answer;
            // Merge LLM-extracted slots into entities
            if (llmResult.slots) {
              Object.assign(nlpResult.entities, llmResult.slots);
            }
            usedLLM = true;
          }

          // Decrement budget
          user.assistantUsage.llmCallsToday = (user.assistantUsage.llmCallsToday || 0) + 1;
          await user.save();
          llmCallsRemaining = LLM_DAILY_LIMIT - user.assistantUsage.llmCallsToday;
        }
      }
    }

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

        // If the action needs a follow-up (e.g. task.update with no changes specified),
        // keep the context alive so the next message fills in the details.
        if (actionResult.pending) {
          context.pendingIntent = slotResult.intent;
          context.filledSlots = { ...slotResult.slots };
          context.missingSlot = '_update_fields';
        }
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
      usedLLM,
      llmCallsRemaining,
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
