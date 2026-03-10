/*LLM Fallback module, it uses api key to classify the intents and extract slots when nlp confidence is too low
IT is only used when NLP score is <0.7 or intent is none and user still has LLM budget remaining
*/

import Groq from 'groq-sdk';

let groq = null;
function getGroq() {
  if (!groq && process.env.GROQ_API_KEY) {
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groq;
}

const VALID_INTENTS = [
  'task.create', 'task.update', 'task.delete', 'task.restore',
  'task.mark', 'task.unmark', 'task.query', 'task.list',
  'profile.stats', 'navigate.calendar', 'navigate.tasks',
  'navigate.career', 'navigate.dsa', 'navigate.home',
  'greeting', 'help', 'thanks', 'None',
];

const SYSTEM_PROMPT = `You are an intent classifier for a student productivity app called VIDHYA.
Given the user's message and optionally their task list, classify the intent and extract any slots.

Available intents: ${VALID_INTENTS.join(', ')}

Slot definitions per intent:
- task.create: title (required), schedule_kind (daily/weekly/monthly/once), target_number, difficulty (easy/medium/hard), priority (low/medium/high), tag, deadline
- task.update: title (required — the existing task name), new_title, priority, difficulty, schedule_kind, tag
- task.delete: title (required)
- task.restore: title (required)
- task.mark: title (required), date
- task.unmark: title (required), date
- task.query: title (required)
- task.list: (no slots)
- profile.stats: (no slots)
- navigate.*: (no slots)
- greeting/help/thanks/None: (no slots)

Respond ONLY with valid JSON (no markdown, no explanation):
{ "intent": "<intent>", "slots": { ... }, "message": "<friendly response>" }

Rules:
- If the user wants to create, add, start, or track something → task.create
- If the user wants to mark/complete/finish a task → task.mark
- If the user wants to delete/remove/stop tracking → task.delete
- If the user is asking about progress, stats, streaks → profile.stats or task.query
- If the message is casual (hi, thanks, bye) → greeting/thanks
- If you truly cannot determine intent → use "None" with a helpful message
- For task-related intents, extract the task title from the message into the "title" slot
- Match task titles loosely against the user's known tasks when provided`;

/**
 * Call Groq LLM to classify intent and extract slots.
 * @param {string} userText - the raw user message
 * @param {string[]} taskTitles - user's existing task titles for context
 * @returns {{ intent: string, slots: object, message: string } | null}
 */
export async function llmFallback(userText, taskTitles = []) {
  const client = getGroq();
  if (!client) {
    console.warn('[LLM] GROQ_API_KEY not set — skipping LLM fallback.');
    return null;
  }

  const userPrompt = taskTitles.length > 0
    ? `User's existing tasks: ${taskTitles.slice(0, 50).join(', ')}\n\nUser message: "${userText}"`
    : `User message: "${userText}"`;

  try {
    const completion = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.1,
      max_tokens: 300,
      response_format: { type: 'json_object' },
    });

    const raw = completion.choices?.[0]?.message?.content;
    if (!raw) return null;

    const parsed = JSON.parse(raw);

    // Validate intent
    if (!parsed.intent || !VALID_INTENTS.includes(parsed.intent)) {
      parsed.intent = 'None';
    }

    return {
      intent: parsed.intent,
      slots: parsed.slots && typeof parsed.slots === 'object' ? parsed.slots : {},
      message: typeof parsed.message === 'string' ? parsed.message : '',
    };
  } catch (err) {
    console.error('[LLM] Groq API error:', err.message);
    return null;
  }
}

export function isLLMAvailable() {
  return !!getGroq();
}
