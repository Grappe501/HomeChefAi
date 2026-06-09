/**
 * Clara Orchestrator — intent routing + expert assembly (Phase 3–4).
 */

import type { InventoryItem, Profile } from '../../../../src/types/index.js';
import type { MealDirectionsResult } from '../../../../src/types/mealDirections.js';
import type { IntentDomain } from './brainRegistry.js';
import { expertsForIntent } from './brainRegistry.js';
import { buildMealDirections } from './reasoning.js';

export type ClassifiedIntent = IntentDomain | 'general';

const DIRECTION_PATTERNS = [
  /\bwhat (can|should|could) i (make|cook|fix)\b/i,
  /\bwhat to (make|cook)\b/i,
  /\bdinner ideas?\b/i,
  /\blunch ideas?\b/i,
  /\bmeal ideas?\b/i,
  /\bideas for (dinner|lunch|breakfast|tonight)\b/i,
  /\bcook( something)? (with|from) (my )?pantry\b/i,
  /\bthree (directions|options|paths)\b/i,
  /\bhelp me decide what to cook\b/i,
];

const MEAL_PLAN_PATTERNS = [
  /\bmeal plan\b/i,
  /\bplan (my )?(meals|dinners|week)\b/i,
  /\bplan ahead\b/i,
];

const SUBSTITUTION_PATTERNS = [
  /\bsubstitut(e|ion)\b/i,
  /\bout of\b/i,
  /\bcan i use .+ instead\b/i,
  /\breplace .+ with\b/i,
];

export function classifyIntent(message: string): ClassifiedIntent {
  const m = message.trim();
  if (!m) return 'general';
  if (SUBSTITUTION_PATTERNS.some((p) => p.test(m))) return 'substitution';
  if (MEAL_PLAN_PATTERNS.some((p) => p.test(m))) return 'meal_plan';
  if (DIRECTION_PATTERNS.some((p) => p.test(m))) return 'suggestion';
  if (/\bhost(ing| a dinner| party)\b/i.test(m)) return 'hosting';
  return 'chat';
}

export function wantsDirectionsFirst(message: string): boolean {
  return classifyIntent(message) === 'suggestion' || DIRECTION_PATTERNS.some((p) => p.test(message));
}

export function buildDirectionsResponse(
  inventory: InventoryItem[],
  profile: Profile,
  message?: string,
): MealDirectionsResult & { intent: ClassifiedIntent; expert_ids: string[] } {
  const intent: ClassifiedIntent = 'suggestion';
  const experts = expertsForIntent(intent);
  const result = buildMealDirections(inventory, profile, { count: 3 });
  if (message && /\bquick\b/i.test(message)) {
    result.reasoning_note += ' Favor under-30-minute techniques.';
  }
  return {
    ...result,
    intent,
    expert_ids: experts.map((e) => e.id),
  };
}

export function formatDirectionsReply(
  result: MealDirectionsResult,
  assistantName: string,
): string {
  if (!result.directions.length) {
    return `${assistantName} checked your pantry — add a few staples and I can suggest three cooking directions.`;
  }
  const lines = result.directions.map(
    (d, i) => `${i + 1}. **${d.cuisine_label}** — ${d.title}\n   ${d.tagline}`,
  );
  return `Chef, here are three directions from your pantry:\n\n${lines.join('\n\n')}\n\nPick one and I'll build a full plan or recipe around it.`;
}

export function expertIdsForIntent(intent: IntentDomain): string[] {
  return expertsForIntent(intent).map((e) => e.id);
}

/** Meal tags to enforce in planner output (Phase 8.7) */
export function mealTagsForPlanContext(options: {
  planning_goal?: string;
  cooking_style?: string;
  experience_type?: string;
}): string[] {
  const tags = new Set<string>(['weeknight']);

  if (options.planning_goal === 'quick_meals') tags.add('30_minutes');
  if (options.planning_goal === 'big_family') tags.add('crowd_favorite');
  if (options.planning_goal === 'use_inventory' || options.planning_goal === 'pantry_challenge') {
    tags.add('leftovers_friendly');
  }
  if (options.cooking_style === 'entertaining' || options.experience_type === 'dinner_party') {
    tags.add('dinner_party');
    tags.add('crowd_favorite');
  }
  if (options.cooking_style === 'meal_prep') tags.add('freezer_friendly');
  if (options.planning_goal === 'healthy_light') tags.add('30_minutes');

  return [...tags];
}
