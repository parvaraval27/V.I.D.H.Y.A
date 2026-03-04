/*NLP engine wraps the npljs module for classifying intents and extract entities.
* Exports:
*   trainAndGet()       → trains from corpus.json, returns the nlp container
*   processMessage(text) → { intent, score, entities, answer, sentiment }
*/

import { containerBootstrap } from '@nlpjs/basic';
import { Nlp } from '@nlpjs/nlp';
import { LangEn } from '@nlpjs/lang-en';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let nlpManager = null;

/**
 * Train the NLP model from corpus.json and cache the model to disk.
 * Returns the trained Nlp instance.
 */
async function trainAndGet() {
  const container = await containerBootstrap();
  container.use(Nlp);
  container.use(LangEn);

  const nlp = container.get('nlp');
  nlp.settings.autoSave = false;
  nlp.settings.autoLoad = false;
  nlp.addLanguage('en');

  // Load corpus
  const corpusPath = path.join(__dirname, 'corpus.json');
  const corpus = JSON.parse(fs.readFileSync(corpusPath, 'utf-8'));

  // Add intents, utterances, answers
  for (const item of corpus.data) {
    for (const utterance of item.utterances) {
      nlp.addDocument('en', utterance, item.intent);
    }
    if (item.answers && item.answers.length) {
      for (const answer of item.answers) {
        nlp.addAnswer('en', item.intent, answer);
      }
    }
  }

  // --- Custom entity extractors ---

  // Schedule kind
  nlp.addNerRuleOptionTexts('en', 'schedule_kind', 'daily', ['daily', 'every day', 'each day']);
  nlp.addNerRuleOptionTexts('en', 'schedule_kind', 'weekly', ['weekly', 'every week', 'each week']);
  nlp.addNerRuleOptionTexts('en', 'schedule_kind', 'monthly', ['monthly', 'every month', 'each month']);
  nlp.addNerRuleOptionTexts('en', 'schedule_kind', 'once', ['once', 'one time', 'one-time', 'single']);

  // Priority
  nlp.addNerRuleOptionTexts('en', 'priority', 'low', ['low', 'low priority']);
  nlp.addNerRuleOptionTexts('en', 'priority', 'medium', ['medium', 'medium priority', 'normal']);
  nlp.addNerRuleOptionTexts('en', 'priority', 'high', ['high', 'high priority', 'urgent', 'important']);

  // Difficulty
  nlp.addNerRuleOptionTexts('en', 'difficulty', 'easy', ['easy', 'simple']);
  nlp.addNerRuleOptionTexts('en', 'difficulty', 'medium', ['medium']);
  nlp.addNerRuleOptionTexts('en', 'difficulty', 'hard', ['hard', 'difficult', 'tough']);

  // Between-regex patterns for extracting title from utterances
  // "called X", "named X", "task X"
  nlp.addNerBetweenCondition('en', 'title', 'called', '', { skip: ['a', 'the'] });
  nlp.addNerBetweenCondition('en', 'title', 'named', '', { skip: ['a', 'the'] });

  // Number (target / times per day) — regex-based
  nlp.addNerRegexRule('en', 'target_number', /(\d+)\s*(?:times?\s*(?:a|per)\s*day|x\s*(?:a|per)\s*day)/i);

  // Tag extraction — #word
  nlp.addNerRegexRule('en', 'tag', /#(\w+)/g);

  // Train
  console.log('[NLP] Training model...');
  await nlp.train();
  console.log('[NLP] Model trained successfully.');

  // Cache trained model
  const modelPath = path.join(__dirname, 'model.nlp');
  const modelData = nlp.export(true);
  // v4 export can be JSON string; write it
  fs.writeFileSync(modelPath, typeof modelData === 'string' ? JSON.stringify(JSON.parse(modelData), null, 4) : JSON.stringify(modelData, null, 4));
  console.log('[NLP] Model cached to', modelPath);

  nlpManager = nlp;
  return nlp;
}

/**
 * Process a user message.
 * Returns { intent, score, entities, answer, sentiment, sourceText }
 */
async function processMessage(text) {
  if (!nlpManager) {
    throw new Error('NLP engine not trained yet. Call trainAndGet() first.');
  }

  const result = await nlpManager.process('en', text);

  // Normalize entities into a simple map
  const entities = {};
  if (result.entities && result.entities.length) {
    for (const ent of result.entities) {
      const key = ent.entity;
      const value = ent.option || ent.sourceText || ent.utteranceText || ent.resolution?.value;
      if (entities[key]) {
        // Collect multiples (like multiple tags)
        if (!Array.isArray(entities[key])) entities[key] = [entities[key]];
        entities[key].push(value);
      } else {
        entities[key] = value;
      }
    }
  }

  // Extract title from %title% slot if present (from the trained utterance templates)
  // nlp.js v4 uses "slot filling" — it puts matched slot values in entities keyed by the slot name
  // The entities should already contain 'title' if the template was matched.

  return {
    intent: result.intent || 'None',
    score: result.score || 0,
    entities,
    answer: result.answer || null,
    sentiment: result.sentiment ? result.sentiment.vote : 'neutral',
    sourceText: text,
  };
}

/**
 * Check if engine is ready.
 */
function isReady() {
  return nlpManager !== null;
}

export { trainAndGet, processMessage, isReady };
