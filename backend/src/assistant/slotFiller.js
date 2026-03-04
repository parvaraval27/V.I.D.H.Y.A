/* Slot filler is a multi turn state machine used to collect required data. Each intent will have a set of required and optional slots.
If a required slot is missing after NLP processing, then the filler will record it as a pending intent and ask user for missing piece.
In next message, if pending intent is set, then slot will be filled before rerun
*/

// Slot definitions per intent
const SLOT_DEFS = {
  'task.create': {
    required: ['title'],
    optional: ['schedule_kind', 'target_number', 'difficulty', 'priority', 'tag', 'deadline'],
    prompts: {
      title: "What should the task be called?",
    },
  },
  'task.update': {
    required: ['title'],
    optional: ['new_title', 'priority', 'difficulty', 'schedule_kind', 'tag'],
    prompts: {
      title: "Which task do you want to update?",
    },
  },
  'task.delete': {
    required: ['title'],
    optional: [],
    prompts: {
      title: "Which task should I delete?",
    },
  },
  'task.restore': {
    required: ['title'],
    optional: [],
    prompts: {
      title: "Which task do you want to restore?",
    },
  },
  'task.mark': {
    required: ['title'],
    optional: ['date'],
    prompts: {
      title: "Which task did you complete?",
    },
  },
  'task.unmark': {
    required: ['title'],
    optional: ['date'],
    prompts: {
      title: "Which task should I unmark?",
    },
  },
  'task.query': {
    required: ['title'],
    optional: [],
    prompts: {
      title: "Which task do you want to know about?",
    },
  },
};

/*Create a fresh session context*/
function createContext() {
  return {
    pendingIntent: null,
    filledSlots: {},
    missingSlot: null,
    lastIntent: null,
  };
}

/**
 * Given NLP result and current session context, decide whether to:
 *  - Execute the action (all required slots filled)
 *  - Ask a follow-up question (a required slot is missing)
 *
 * Returns { ready: boolean, intent, slots, prompt? }
 *
 * @param {object} nlpResult  - from processMessage()
 * @param {object} context    - session context (mutated in place)
 * @param {string} rawText    - original user message
 */
function fillSlots(nlpResult, context, rawText) {
  // Ensure context fields are initialized (may be null from MongoDB)
  if (!context.filledSlots || typeof context.filledSlots !== 'object') context.filledSlots = {};
  if (context.pendingIntent === undefined) context.pendingIntent = null;
  if (context.missingSlot === undefined) context.missingSlot = null;

  // --- Case 1: We were waiting for a slot answer ---
  if (context.pendingIntent && context.missingSlot) {
    const intent = context.pendingIntent;
    const slotKey = context.missingSlot;

    // The user's raw text IS the slot value (e.g. they typed a task name)
    // But also check if NLP found a relevant entity
    const entityValue = nlpResult.entities[slotKey] || null;
    context.filledSlots[slotKey] = entityValue || rawText.trim();

    // Also merge any other entities NLP found
    Object.assign(context.filledSlots, nlpResult.entities);
    // Don't overwrite the slot we just filled explicitly
    context.filledSlots[slotKey] = entityValue || rawText.trim();

    // Check if there are still missing required slots
    const def = SLOT_DEFS[intent];
    if (def) {
      for (const reqSlot of def.required) {
        if (!context.filledSlots[reqSlot]) {
          context.missingSlot = reqSlot;
          return {
            ready: false,
            intent,
            slots: { ...context.filledSlots },
            prompt: def.prompts[reqSlot] || `What is the ${reqSlot}?`,
          };
        }
      }
    }

    // All required slots filled — ready to execute
    const slots = { ...context.filledSlots };
    // Clear pending state
    context.pendingIntent = null;
    context.missingSlot = null;
    context.filledSlots = {};
    context.lastIntent = intent;
    return { ready: true, intent, slots };
  }

  // --- Case 2: Fresh message — use NLP result ---
  const intent = nlpResult.intent;
  const def = SLOT_DEFS[intent];

  // If intent has no slot requirements (navigation, greeting, etc.), just execute
  if (!def) {
    context.pendingIntent = null;
    context.missingSlot = null;
    context.filledSlots = {};
    context.lastIntent = intent;
    return { ready: true, intent, slots: nlpResult.entities };
  }

  // Merge extracted entities
  const slots = { ...nlpResult.entities };

  // Try to extract title from raw text if NLP didn't get it via entity extraction
  if (!slots.title && (intent.startsWith('task.'))) {
    const extracted = extractTitleFromText(rawText, intent);
    if (extracted) slots.title = extracted;
  }

  // Check required slots
  for (const reqSlot of def.required) {
    if (!slots[reqSlot]) {
      // Missing a required slot — enter multi-turn mode
      context.pendingIntent = intent;
      context.filledSlots = slots;
      context.missingSlot = reqSlot;
      context.lastIntent = intent;
      return {
        ready: false,
        intent,
        slots,
        prompt: def.prompts[reqSlot] || `What is the ${reqSlot}?`,
      };
    }
  }

  // All required slots present
  context.pendingIntent = null;
  context.missingSlot = null;
  context.filledSlots = {};
  context.lastIntent = intent;
  return { ready: true, intent, slots };
}

/**
 * Heuristic title extraction from raw text when NLP entity extraction misses it.
 * Handles patterns like:
 *   "add a task called Meditation"   → "Meditation"
 *   "mark Meditation as done"        → "Meditation"
 *   "delete task Meditation"         → "Meditation"
 *   "what's my streak on Meditation" → "Meditation"
 */
function extractTitleFromText(text, intent) {
  // Pattern: "called/named X"
  let match = text.match(/(?:called|named)\s+(.+?)(?:\s+(?:with|daily|weekly|monthly|once|hard|easy|medium|high|low|recurring|target|that|tagged|#).*)?$/i);
  if (match) return cleanTitle(match[1]);

  // Pattern: "task X" (only if not followed by keywords that indicate it's not a title)
  match = text.match(/task\s+(.+?)(?:\s+(?:as\s+done|done|complete|completed|to\s+|priority|difficulty|schedule|daily|weekly|monthly).*)?$/i);
  if (match && match[1].length < 60) return cleanTitle(match[1]);

  // Intent-specific patterns
  if (intent === 'task.mark' || intent === 'task.unmark') {
    // "mark X as done", "complete X", "unmark X"
    match = text.match(/(?:mark|complete|tick|check off|unmark|undo|uncheck)\s+(.+?)(?:\s+(?:as\s+done|done|complete|completed|for\s+today))?$/i);
    if (match) return cleanTitle(match[1]);

    // "X is done"
    match = text.match(/^(.+?)\s+is\s+done$/i);
    if (match) return cleanTitle(match[1]);

    // "I finished X", "done with X"
    match = text.match(/(?:finished|done with|completed)\s+(.+)$/i);
    if (match) return cleanTitle(match[1]);
  }

  if (intent === 'task.query') {
    // "streak on X", "stats for X", "about task X", "how is X going"
    match = text.match(/(?:streak on|stats for|about task|progress on|rate for|how is|details of|details for)\s+(.+?)(?:\s+going)?$/i);
    if (match) return cleanTitle(match[1]);

    // "X streak"
    match = text.match(/^(.+?)\s+streak$/i);
    if (match) return cleanTitle(match[1]);
  }

  if (intent === 'task.delete' || intent === 'task.restore') {
    // "delete/remove/archive/restore X"
    match = text.match(/(?:delete|remove|archive|trash|restore|unarchive|bring back)\s+(?:task\s+)?(.+)$/i);
    if (match) return cleanTitle(match[1]);
  }

  return null;
}

function cleanTitle(raw) {
  if (!raw) return null;
  // Remove trailing noise words
  let t = raw.trim();
  t = t.replace(/\s+(as done|done|complete|completed|for today|for me)$/i, '').trim();
  // Remove leading "a ", "the ", "task "
  t = t.replace(/^(?:a |the |task )/i, '').trim();
  return t || null;
}

export { createContext, fillSlots, SLOT_DEFS };
