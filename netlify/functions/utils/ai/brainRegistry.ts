import type { MealTagId } from '../../../src/types/mealTags';

/**
 * AI Brain Registry — expert personas Clara orchestrates.
 * SOUSCHEF-AI-FOUNDATION-1.0 · Layer 2–3 shell
 *
 * Clara (sous_chef) merges expert outputs into one voice.
 * Do not call OpenAI once per feature — route through orchestrator (future).
 */

export type ExpertId =
  | 'sous_chef'
  | 'executive_chef'
  | 'nutritionist'
  | 'food_scientist'
  | 'budget_analyst'
  | 'homestead_advisor'
  | 'dinner_host'
  | 'food_historian'
  | 'preservation_expert'
  | 'flavor_architect';

export type IntentDomain =
  | 'meal_plan'
  | 'chat'
  | 'suggestion'
  | 'substitution'
  | 'hosting'
  | 'skill'
  | 'legacy';

export interface ExpertDefinition {
  id: ExpertId;
  displayName: string;
  role: string;
  /** Knowledge registry slices this expert may query */
  knowledgeSlices: string[];
  /** Graph memory types this expert reads */
  graphScopes: string[];
  systemPromptPrefix: string;
}

export const CLARA_ORCHESTRATOR_ID: ExpertId = 'sous_chef';

export const EXPERT_REGISTRY: Record<ExpertId, ExpertDefinition> = {
  sous_chef: {
    id: 'sous_chef',
    displayName: 'Sous Chef Clara',
    role: 'Orchestrator — merges expert reasoning into one helpful kitchen voice',
    knowledgeSlices: ['*'],
    graphScopes: ['*'],
    systemPromptPrefix:
      'You are Sous Chef Clara, the household kitchen intelligence. Synthesize expert inputs. Address the user as Chef. Be warm, precise, never condescending.',
  },
  executive_chef: {
    id: 'executive_chef',
    displayName: 'Executive Chef',
    role: 'Menu direction, technique selection, meal architecture',
    knowledgeSlices: ['techniques', 'meal_patterns', 'cuisines', 'ingredients'],
    graphScopes: ['preferences', 'skill', 'cook_logs'],
    systemPromptPrefix:
      'You are the Executive Chef advisor. Think in menus, techniques, and experiences — not single recipes.',
  },
  nutritionist: {
    id: 'nutritionist',
    displayName: 'Nutritionist',
    role: 'Dietary constraints, balance, allergens — not medical diagnosis',
    knowledgeSlices: ['nutrition', 'ingredients'],
    graphScopes: ['dietary', 'allergies', 'health_goals'],
    systemPromptPrefix:
      'You are a practical kitchen nutritionist. Respect stated dietary restrictions. Suggest balance, not fad diets.',
  },
  food_scientist: {
    id: 'food_scientist',
    displayName: 'Food Scientist',
    role: 'Why techniques work — heat, emulsion, gluten, maillard',
    knowledgeSlices: ['food_science', 'techniques'],
    graphScopes: ['skill'],
    systemPromptPrefix:
      'You explain cooking science in one or two sentences — micro-lessons, never lectures.',
  },
  budget_analyst: {
    id: 'budget_analyst',
    displayName: 'Budget Analyst',
    role: 'Cost, waste, pantry challenge, receipt patterns',
    knowledgeSlices: ['meal_patterns', 'substitutions'],
    graphScopes: ['receipts', 'waste', 'inventory'],
    systemPromptPrefix:
      'You minimize spend and waste. Favor inventory, leftovers, and smart substitutions.',
  },
  homestead_advisor: {
    id: 'homestead_advisor',
    displayName: 'Homestead Advisor',
    role: 'Preservation, batch cooking, garden-to-table, meal prep',
    knowledgeSlices: ['culture', 'meal_patterns', 'techniques'],
    graphScopes: ['inventory', 'seasonal'],
    systemPromptPrefix:
      'You advise practical homestead kitchens — batch, preserve, stretch ingredients.',
  },
  dinner_host: {
    id: 'dinner_host',
    displayName: 'Dinner Host',
    role: 'Events, timelines, scaling, crowd favorites',
    knowledgeSlices: ['hosting', 'meal_patterns'],
    graphScopes: ['household_size', 'experiences', 'guests'],
    systemPromptPrefix:
      'You plan hosting — timelines, make-ahead, oven conflicts, crowd-pleasing menus.',
  },
  food_historian: {
    id: 'food_historian',
    displayName: 'Food Historian',
    role: 'Tradition, origin stories, cultural context',
    knowledgeSlices: ['culture', 'traditions', 'cuisines'],
    graphScopes: ['traditions', 'recipes'],
    systemPromptPrefix:
      'You connect dishes to culture and family story — briefly, respectfully.',
  },
  preservation_expert: {
    id: 'preservation_expert',
    displayName: 'Preservation Expert',
    role: 'Canning, ferment, freeze, cure — safety first',
    knowledgeSlices: ['food_science', 'techniques'],
    graphScopes: ['inventory', 'seasonal'],
    systemPromptPrefix:
      'You advise preservation with food safety as non-negotiable.',
  },
  flavor_architect: {
    id: 'flavor_architect',
    displayName: 'Flavor Architect',
    role: 'Pairings, substitutions, flavor direction',
    knowledgeSlices: ['flavor_profiles', 'ingredients', 'substitutions'],
    graphScopes: ['preferences', 'cuisine'],
    systemPromptPrefix:
      'You reason about flavor direction — offer 2–3 distinct paths, not one recipe.',
  },
};

/** Which experts to invoke per intent (orchestrator uses this in S3+) */
export const INTENT_EXPERT_MAP: Record<IntentDomain, ExpertId[]> = {
  meal_plan: ['executive_chef', 'budget_analyst', 'flavor_architect', 'nutritionist'],
  chat: ['sous_chef', 'flavor_architect'],
  suggestion: ['executive_chef', 'budget_analyst'],
  substitution: ['flavor_architect'],
  hosting: ['dinner_host', 'executive_chef', 'budget_analyst'],
  skill: ['food_scientist', 'executive_chef'],
  legacy: ['food_historian', 'sous_chef'],
};

export function expertsForIntent(intent: IntentDomain): ExpertDefinition[] {
  return INTENT_EXPERT_MAP[intent].map((id) => EXPERT_REGISTRY[id]);
}

export function mealTagsForIntent(intent: IntentDomain): MealTagId[] {
  switch (intent) {
    case 'hosting':
      return ['crowd_favorite', 'dinner_party'];
    case 'meal_plan':
      return ['weeknight', 'leftovers_friendly'];
    default:
      return ['weeknight'];
  }
}
