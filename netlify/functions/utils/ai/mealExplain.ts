/**
 * Meal "Why This?" intelligence — deterministic reasoning from knowledge + household context.
 */

import type { InventoryItem, PlannedMeal, Profile, MealPlanData } from '../../../../src/types/index.js';
import type {
  MealIntelligence,
  MealRecommendationType,
  MealSpecialOccasion,
  MealSubstitutionHint,
} from '../../../../src/types/mealIntelligence.js';
import { resolveSubstitutions, parseSubstitutionReason } from './substitutionEngine.js';
import { getKnowledgeNode } from './knowledgeLoader.js';
import {
  resolveIngredientKnowledgeId,
  buildInventoryKnowledgeIndex,
} from '../inventoryContext.js';
import type { DecisionLedgerEntry } from './decisionLedger.js';
import { processLedgerOutcomes, ledgerContextForMeal } from './outcomeProcessor.js';

export interface MealExplainContext {
  meal: PlannedMeal;
  inventory: InventoryItem[];
  profile: Profile;
  coverage?: MealPlanData['coverage'];
  metrics?: MealPlanData['metrics'];
  allMeals?: PlannedMeal[];
  ledgerEntries?: DecisionLedgerEntry[];
}

function namesMatch(a: string, b: string): boolean {
  const x = a.toLowerCase().trim();
  const y = b.toLowerCase().trim();
  return x === y || x.includes(y) || y.includes(x);
}

function dietaryReasonFromProfile(profile: Profile): ReturnType<typeof parseSubstitutionReason> {
  const restrictions = profile.dietary_restrictions.map((r) => r.toLowerCase());
  if (restrictions.some((r) => r.includes('vegan'))) return 'vegan';
  if (restrictions.some((r) => r.includes('vegetarian'))) return 'vegetarian';
  if (restrictions.some((r) => r.includes('gluten'))) return 'gluten_free';
  if (restrictions.some((r) => r.includes('dairy'))) return 'dairy_free';
  if (restrictions.some((r) => r.includes('nut'))) return 'nut_free';
  return 'missing';
}

function recommendationLabel(type: MealRecommendationType): string {
  const map: Record<MealRecommendationType, string> = {
    inventory_match: 'Pantry-first pick',
    pantry_challenge: 'Pantry challenge',
    style_match: 'Matches your cooking style',
    leftover_chain: 'Leftover smart lunch',
    easy_night: 'Easy night',
    variety: 'Adds variety',
    nutrition_goal: 'Fits nutrition goals',
    new_suggestion: 'New for your kitchen',
    household_favorite: 'Household favorite pattern',
  };
  return map[type];
}

function inferRecommendationType(ctx: MealExplainContext): MealRecommendationType {
  const { meal, coverage } = ctx;
  const name = meal.name.toLowerCase();
  const tags = new Set(meal.tags ?? []);

  if (tags.has('easy_night') || name.includes('free night') || name.includes('pizza night')) {
    return 'easy_night';
  }
  if (name.startsWith('leftover') || tags.has('leftovers_friendly')) {
    return 'leftover_chain';
  }
  if (coverage?.planning_goal === 'pantry_challenge') return 'pantry_challenge';
  if (coverage?.planning_goal === 'healthy_light') return 'nutrition_goal';
  if (coverage?.planning_goal === 'variety') return 'variety';

  const inPantry = meal.ingredients.filter((i) => i.in_inventory).length;
  const ratio = meal.ingredients.length ? inPantry / meal.ingredients.length : 0;
  if (ratio >= 0.7) return 'inventory_match';

  if (isHouseholdFavorite(ctx)) return 'household_favorite';
  if (matchesCuisineStyle(meal, ctx.profile)) return 'style_match';

  return 'new_suggestion';
}

function isHouseholdFavorite(ctx: MealExplainContext): boolean {
  const memory = ctx.profile.last_meal_memory as { meal?: string; items?: string[] } | undefined;
  if (!memory?.meal) return false;
  return namesMatch(ctx.meal.name, memory.meal);
}

function matchesCuisineStyle(meal: PlannedMeal, profile: Profile): boolean {
  const prefs = profile.cuisine_preferences.map((c) => c.toLowerCase());
  if (!prefs.length) return false;
  const blob = `${meal.name} ${meal.description ?? ''}`.toLowerCase();
  return prefs.some((p) => blob.includes(p.split('/')[0].toLowerCase()));
}

function buildSubstitutions(ctx: MealExplainContext): MealSubstitutionHint[] {
  const { meal, inventory } = ctx;
  const invIndex = buildInventoryKnowledgeIndex(inventory);
  const dietaryReason = dietaryReasonFromProfile(ctx.profile);
  const hints: MealSubstitutionHint[] = [];

  for (const ing of meal.ingredients) {
    if (ing.in_inventory) continue;
    const knowledgeId = resolveIngredientKnowledgeId(ing.name, inventory);
    if (!knowledgeId) continue;

    const result = resolveSubstitutions(knowledgeId, { reason: dietaryReason, limit: 2 });
    if (!result?.suggestions.length) continue;

    for (const s of result.suggestions) {
      const inPantry = [...invIndex.values()].some(
        (e) => e.knowledge_id === s.id || namesMatch(e.name, s.display_name),
      );
      hints.push({
        missing: ing.name,
        swap: s.display_name,
        note: s.note,
        knowledge_id: s.id,
        in_pantry: inPantry,
      });
    }
    if (hints.filter((h) => h.missing === ing.name).length >= 1) break;
  }

  return hints.slice(0, 4);
}

function buildComplexity(meal: PlannedMeal): MealIntelligence['complexity'] {
  const prep = meal.prep_time_minutes ?? 30;
  const tags = new Set(meal.tags ?? []);
  const isDinner = meal.meal_type === 'dinner';
  const isParty = tags.has('dinner_party') || tags.has('crowd_favorite');
  const isEasy = tags.has('easy_night') || tags.has('30_minutes') || prep <= 25;

  let level: MealIntelligence['complexity']['level'] = 'moderate';
  if (isEasy || meal.meal_type === 'breakfast' || meal.meal_type === 'snack') level = 'simple';
  if (isParty || prep >= 60) level = 'elaborate';

  let courses: 1 | 2 | 3 = 1;
  if (isDinner && level === 'moderate') courses = 2;
  if (isDinner && (isParty || level === 'elaborate')) courses = 3;

  const wine = isDinner && (isParty || level === 'elaborate' || tags.has('dinner_party'));

  return {
    level,
    courses,
    prep_time_minutes: prep,
    wine_pairing_suggested: wine,
    wine_note: wine
      ? 'Consider a medium body red or crisp white depending on sauce richness — hosting mode can expand pairings.'
      : undefined,
  };
}

function buildSpecialOccasion(ctx: MealExplainContext): MealSpecialOccasion {
  const { meal, coverage } = ctx;
  const tags = new Set(meal.tags ?? []);
  const style = coverage?.cooking_style ?? '';
  const isEntertaining = style === 'entertaining' || tags.has('dinner_party') || tags.has('crowd_favorite');
  const complexity = buildComplexity(meal);

  let category: MealSpecialOccasion['category'] = 'none';
  let label: string | undefined;
  if (tags.has('dinner_party')) {
    category = 'dinner_party';
    label = 'Dinner party ready';
  } else if (isEntertaining) {
    category = 'entertaining';
    label = 'Entertaining upgrade';
  } else if (complexity.level === 'elaborate' && meal.meal_type === 'dinner') {
    category = 'date_night';
    label = 'Special dinner';
  }

  const expandable = meal.meal_type === 'dinner' && (complexity.courses >= 2 || isEntertaining);

  const menuPrep: string[] = [];
  const groceryPrep: string[] = [];
  const inventoryPrep: string[] = [];

  if (expandable) {
    if (complexity.courses >= 2) {
      menuPrep.push('Prep a simple starter while the main rests — salad or bread fits most styles.');
    }
    if (complexity.courses >= 3) {
      menuPrep.push('Plan dessert or cheese course ahead — can be store-bought elevated with pantry garnish.');
    }
    if (complexity.wine_pairing_suggested) {
      menuPrep.push('Chill wine and set glasses before you start cooking.');
    }
    const missing = meal.ingredients.filter((i) => !i.in_inventory);
    if (missing.length) {
      groceryPrep.push(`Shop ahead for: ${missing.slice(0, 4).map((i) => i.name).join(', ')}.`);
    }
    const inPantry = meal.ingredients.filter((i) => i.in_inventory);
    if (inPantry.length) {
      inventoryPrep.push(`Pull from pantry now: ${inPantry.slice(0, 5).map((i) => i.name).join(', ')}.`);
    }
    inventoryPrep.push('Check quantities against household size before cook day.');
  }

  return {
    expandable,
    category,
    label,
    menu_prep_hints: menuPrep,
    grocery_prep_hints: groceryPrep,
    inventory_prep_hints: inventoryPrep,
  };
}

function buildNutritionFit(ctx: MealExplainContext): string {
  const { meal, profile, coverage } = ctx;
  const restrictions = profile.dietary_restrictions.filter((r) => r.toLowerCase() !== 'none');
  const goal = coverage?.planning_goal;

  const parts: string[] = [];
  if (goal === 'healthy_light') {
    parts.push('Aligned with your lighter, balanced plan — reasonable portions for the household.');
  } else if (goal === 'big_family') {
    parts.push('Scaled for a hungry household with satisfying portions.');
  } else if (meal.meal_type === 'breakfast' || meal.meal_type === 'snack') {
    parts.push('Light slot in the day — keeps energy steady without heavy prep.');
  } else {
    parts.push('Balanced slot in your weekly mix — not every meal needs to be health-forward.');
  }

  if (restrictions.length) {
    parts.push(`Respects your restrictions: ${restrictions.join(', ')}.`);
  }
  if (profile.allergies?.length) {
    parts.push(`Allergies noted: ${profile.allergies.join(', ')} — verify labels when shopping.`);
  }

  const subs = buildSubstitutions(ctx);
  if (subs.some((s) => s.in_pantry)) {
    parts.push('Missing items have pantry swaps available if you prefer not to shop.');
  }

  return parts.join(' ');
}

function buildLikeability(ctx: MealExplainContext): string {
  const { meal, profile } = ctx;
  const type = inferRecommendationType(ctx);

  if (ctx.ledgerEntries?.length) {
    const ledgerNote = ledgerContextForMeal(meal.name, processLedgerOutcomes(ctx.ledgerEntries));
    if (ledgerNote.similar_kept) {
      return 'Similar to meals you kept before — Clara weighted this toward proven household wins.';
    }
    if (ledgerNote.was_replaced_before) {
      return 'Adjusted from prior feedback — this version avoids patterns you recently replaced.';
    }
  }

  if (type === 'household_favorite') {
    return `Similar to a recent meal you cooked (${(profile.last_meal_memory as { meal?: string })?.meal}) — Clara favors patterns that worked before.`;
  }
  if (type === 'leftover_chain') {
    return 'Practical and satisfying — repurposes prior dinner so nothing goes to waste.';
  }
  if (type === 'easy_night') {
    return 'Low effort by design — saves cook energy for nights you chose to go all-in.';
  }
  if (meal.tags?.includes('crowd_favorite')) {
    return 'Tagged crowd-pleaser — broad appeal for mixed tastes at the table.';
  }
  if (type === 'new_suggestion') {
    return 'Something new for rotation — expands your repertoire without repeating last week.';
  }
  if (type === 'style_match') {
    return `Fits your preferred cuisines (${profile.cuisine_preferences.join(', ') || 'home cooking'}).`;
  }
  return 'Chosen for practical fit — flavor, effort, and pantry overlap balanced for your household.';
}

function buildWhyChosen(ctx: MealExplainContext): string {
  const { meal, coverage, metrics } = ctx;
  const type = inferRecommendationType(ctx);
  const parts: string[] = [];

  switch (type) {
    case 'inventory_match':
      parts.push('Most ingredients are already in your kitchen — minimal shopping, maximum use of what you have.');
      break;
    case 'pantry_challenge':
      parts.push('Pantry Challenge mode — Clara prioritized on-hand items before suggesting purchases.');
      break;
    case 'leftover_chain':
      parts.push('Connects to an earlier dinner in this plan — realistic lunch, not a brand-new recipe every midday.');
      break;
    case 'easy_night':
      parts.push(`One of your ${coverage?.cook_nights != null ? 'planned easy' : 'low-effort'} nights — intentional break from full cooking.`);
      break;
    case 'variety':
      parts.push('Adds protein/cuisine variety so the week does not feel repetitive.');
      break;
    case 'nutrition_goal':
      parts.push('Supports your lighter eating goal while staying family-realistic.');
      break;
    default:
      parts.push(meal.description || 'Selected to fit your plan coverage and household preferences.');
  }

  if (coverage?.cooking_style && coverage.cooking_style !== 'profile_default') {
    parts.push(`Cooking style for this plan: ${coverage.cooking_style.replace(/_/g, ' ')}.`);
  }
  if (metrics?.inventory_utilization_score != null) {
    parts.push(`This plan overall uses ~${metrics.inventory_utilization_score}% of tracked inventory.`);
  }

  if (ctx.ledgerEntries?.length) {
    const outcomes = processLedgerOutcomes(ctx.ledgerEntries);
    const ledgerNote = ledgerContextForMeal(ctx.meal.name, outcomes);
    if (ledgerNote.note) parts.push(ledgerNote.note);
    if (outcomes.replaced_meals.length) {
      parts.push(`Avoiding patterns from recent replaces: ${outcomes.replaced_meals.slice(0, 2).join(', ')}.`);
    }
  }

  return parts.join(' ');
}

function collectEvidence(ctx: MealExplainContext): string[] {
  const evidence: string[] = [];
  for (const ing of ctx.meal.ingredients) {
    const kid = resolveIngredientKnowledgeId(ing.name, ctx.inventory);
    if (kid && getKnowledgeNode(kid)) evidence.push(kid);
  }
  if (ctx.coverage?.planning_goal) evidence.push(`goal.${ctx.coverage.planning_goal}`);
  if (ctx.ledgerEntries?.length) {
    evidence.push(...processLedgerOutcomes(ctx.ledgerEntries).ledger_evidence.slice(0, 3));
  }
  return [...new Set(evidence)].slice(0, 10);
}

export function buildMealIntelligence(ctx: MealExplainContext): MealIntelligence {
  const type = inferRecommendationType(ctx);
  const substitutions = buildSubstitutions(ctx);
  const complexity = buildComplexity(ctx.meal);
  const special = buildSpecialOccasion(ctx);
  const inPantryCount = ctx.meal.ingredients.filter((i) => i.in_inventory).length;
  const outcomes = ctx.ledgerEntries?.length ? processLedgerOutcomes(ctx.ledgerEntries) : null;
  const baseConfidence = substitutions.length ? 0.82 : 0.75;

  return {
    recommendation_type: type,
    recommendation_label: recommendationLabel(type),
    headline: `${ctx.meal.name} — ${recommendationLabel(type)}`,
    why_chosen: buildWhyChosen(ctx),
    nutrition_fit: buildNutritionFit(ctx),
    likeability: buildLikeability(ctx),
    inventory_story:
      inPantryCount > 0
        ? `${inPantryCount} of ${ctx.meal.ingredients.length} ingredients already in your pantry.`
        : 'Most ingredients need a shop run — substitutions below use what you may already have.',
    substitutions,
    complexity,
    special_occasion: special,
    evidence: collectEvidence(ctx),
    confidence: Math.min(0.95, baseConfidence + (outcomes?.confidence_boost ?? 0)),
  };
}

export function enrichMealsWithIntelligence(
  planData: MealPlanData,
  inventory: InventoryItem[],
  profile: Profile,
  ledgerEntries?: DecisionLedgerEntry[],
): MealPlanData {
  const meals = (planData.meals ?? []).map((meal) => ({
    ...meal,
    intelligence: buildMealIntelligence({
      meal,
      inventory,
      profile,
      coverage: planData.coverage,
      metrics: planData.metrics,
      allMeals: planData.meals,
      ledgerEntries,
    }),
  }));
  return { ...planData, meals };
}
