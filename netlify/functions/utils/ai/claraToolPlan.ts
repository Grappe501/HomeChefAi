/**
 * Agent Suite v6 — intent-selective Clara tool planning.
 * Only run tools the message actually needs.
 */

import type { ClassifiedIntent } from './orchestrator.js';
import { isBasicAssistantMessage } from '../../../../src/types/credits.js';

export type ClaraToolName =
  | 'lookup_pantry'
  | 'get_ledger_context'
  | 'find_substitutes'
  | 'suggest_directions'
  | 'match_dishes'
  | 'lookup_knowledge'
  | 'skill_coach'
  | 'query_brain';

export function planClaraTools(intent: ClassifiedIntent, message: string): Set<ClaraToolName> {
  const tools = new Set<ClaraToolName>();
  const m = message.trim();

  if (isBasicAssistantMessage(m)) {
    tools.add('lookup_pantry');
    return tools;
  }

  tools.add('lookup_pantry');
  tools.add('get_ledger_context');

  if (intent === 'substitution' || /\bsubstitut/i.test(m)) {
    tools.add('find_substitutes');
    return tools;
  }

  if (intent === 'skill') {
    tools.add('skill_coach');
    tools.add('lookup_knowledge');
    return tools;
  }

  if (intent === 'suggestion' || intent === 'meal_plan') {
    tools.add('suggest_directions');
    tools.add('match_dishes');
    tools.add('query_brain');
    return tools;
  }

  if (/\bwhat (can|should|could) i (make|cook)|\btonight\b|\bdirections\b|\bthree (directions|options)\b/i.test(m)) {
    tools.add('suggest_directions');
    tools.add('match_dishes');
    tools.add('query_brain');
  } else if (/\b(recipe|dish library|from (my )?pantry)\b/i.test(m)) {
    tools.add('match_dishes');
  }

  if (/\b(what is|how to|technique|ingredient|why does|tell me about|flavor|taste profile|culture|cuisine)\b/i.test(m)) {
    tools.add('lookup_knowledge');
  }

  if (/\b(farmers market|grocery|shop|store|where to buy|csa|butcher|market|whole foods|walmart|kroger|costco|aldi|trader joe|local food|seasonal produce)\b/i.test(m)) {
    tools.add('lookup_knowledge');
  }

  if (intent === 'skill' || /\b(how do i|teach me|learn to|improve my)\b/i.test(m)) {
    tools.add('skill_coach');
    if (!tools.has('lookup_knowledge')) tools.add('lookup_knowledge');
  }

  if (intent === 'hosting') {
    tools.add('match_dishes');
    tools.add('query_brain');
  }

  if (
    intent === 'chat' &&
    /\b(dinner|lunch|breakfast|meal|plan|pantry|expir|waste|what should i)\b/i.test(m)
  ) {
    tools.add('query_brain');
  }

  return tools;
}

/** Phase 2 — use BM25 text search instead of pantry-only matching when the user names a dish or mood. */
export function needsDishSearch(message: string): boolean {
  const m = message.trim();
  if (/\b(find|search|similar|craving|in the mood|recipe for|looking for|like a|something with|dish library|from the library)\b/i.test(m)) {
    return true;
  }
  if (/\b(chicken|pasta|curry|soup|salad|tacos|stir.?fry|risotto|ramen|pizza)\b/i.test(m) && m.length > 20) {
    return true;
  }
  return m.split(/\s+/).length >= 5;
}
