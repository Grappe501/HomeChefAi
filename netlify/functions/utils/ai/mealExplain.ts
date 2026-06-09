/**
 * Meal "Why This?" intelligence — deterministic reasoning from real pantry + household data only.
 * Never claims history the user has not actually created.
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
import { buildIngredientTrivia } from './ingredientTrivia.js';
import { buildMealDeepContext } from './ingredientDeepDive.js';

export interface MealExplainContext {
  meal: PlannedMeal;
  inventory: InventoryItem[];
  profile: Profile;
  coverage?: MealPlanData['coverage'];
  metrics?: MealPlanData['metrics'];
  allMeals?: PlannedMeal[];
  ledgerEntries?: DecisionLedgerEntry[];
}

function normalizeMealName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

function exactNameMatch(a: string, b: string): boolean {
  return normalizeMealName(a) === normalizeMealName(b);
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
    household_favorite: 'Repeat from your cook log',
  };
  return map[type];
}

function findPriorDinnerForLeftover(meal: PlannedMeal, allMeals?: PlannedMeal[]): PlannedMeal | null {
  if (!allMeals?.length) return null;
  const sameOrPriorDay = allMeals.filter(
    (m) => m.meal_type === 'dinner' && m.day < meal.day && m.day >= meal.day - 2,
  );
  return sameOrPriorDay.sort((a, b) => b.day - a.day)[0] ?? null;
}

function matchedCuisinePreferences(meal: PlannedMeal, profile: Profile): string[] {
  const prefs = profile.cuisine_preferences.filter((c) => c.toLowerCase() !== 'none');
  if (!prefs.length) return [];
  const blob = `${meal.name} ${meal.description ?? ''}`.toLowerCase();
  return prefs.filter((p) => {
    const token = p.split('/')[0].toLowerCase().trim();
    return token.length > 2 && blob.includes(token);
  });
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

  const memory = ctx.profile.last_meal_memory as { meal?: string } | undefined;
  if (memory?.meal && exactNameMatch(meal.name, memory.meal)) return 'household_favorite';

  if (matchedCuisinePreferences(meal, ctx.profile).length) return 'style_match';

  return 'new_suggestion';
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
        (e) => e.knowledge_id === s.id || exactNameMatch(e.name, s.display_name),
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
    parts.push('This plan asked for lighter meals — reasonable portions, not diet-clinic strict.');
  } else if (goal === 'big_family') {
    parts.push(`Sized for ${profile.household_size ?? coverage?.people ?? 2} people with satisfying portions.`);
  } else if (meal.meal_type === 'breakfast') {
    parts.push('Morning slot — quick energy without heavy prep.');
  } else if (meal.meal_type === 'snack') {
    parts.push('Light snack slot between main meals.');
  } else if (meal.meal_type === 'lunch') {
    parts.push('Midday meal — balanced against your other dinners this week.');
  } else {
    parts.push('Dinner slot in a mixed week — not every plate needs to be health-forward.');
  }

  if (restrictions.length) {
    parts.push(`Your profile lists: ${restrictions.join(', ')} — verify labels when you shop.`);
  }
  if (profile.allergies?.length) {
    parts.push(`Allergies on file: ${profile.allergies.join(', ')} — double-check every ingredient.`);
  }

  const subs = buildSubstitutions(ctx);
  const pantrySwaps = subs.filter((s) => s.in_pantry);
  if (pantrySwaps.length) {
    parts.push(`Missing items can swap to pantry: ${pantrySwaps.map((s) => `${s.missing} → ${s.swap}`).join('; ')}.`);
  }

  return parts.join(' ');
}

function buildLikeability(ctx: MealExplainContext): string {
  const { meal, profile, coverage } = ctx;
  const type = inferRecommendationType(ctx);
  const cuisines = matchedCuisinePreferences(meal, profile);
  const household = profile.household_size ?? coverage?.people ?? 2;

  if (ctx.ledgerEntries?.length) {
    const ledgerNote = ledgerContextForMeal(meal.name, processLedgerOutcomes(ctx.ledgerEntries));
    if (ledgerNote.exact_kept_before && ledgerNote.exact_kept_name) {
      return `You kept "${ledgerNote.exact_kept_name}" on a previous plan review — you already said yes to this one.`;
    }
    if (ledgerNote.was_replaced_before) {
      return 'This is a fresh pick — not the same meal you replaced before.';
    }
  }

  const memory = profile.last_meal_memory as { meal?: string; date?: string } | undefined;
  if (type === 'household_favorite' && memory?.meal) {
    return `Matches "${memory.meal}" from your recent cook log — a meal your kitchen already knows.`;
  }

  if (type === 'leftover_chain') {
    const prior = findPriorDinnerForLeftover(meal, ctx.allMeals);
    if (prior) {
      return `Practical follow-up to ${prior.name} — less waste, less decision fatigue at lunch.`;
    }
    return 'Built around repurposing food you already cooked — practical, not fancy.';
  }

  if (type === 'easy_night') {
    return 'Low-effort by design for a night you chose not to cook from scratch.';
  }

  if (meal.tags?.includes('crowd_favorite') || meal.tags?.includes('dinner_party')) {
    return `Tagged for ${household > 4 ? 'a larger table' : 'broad appeal'} — flavors that tend to land with mixed tastes.`;
  }

  if (cuisines.length) {
    return `Name and ingredients align with your saved cuisine prefs: ${cuisines.join(', ')}.`;
  }

  if (type === 'inventory_match') {
    return 'Low shopping friction — uses what you already bought, which usually means less stress at cook time.';
  }

  if (type === 'new_suggestion') {
    return 'New to this week\'s rotation — expands options without repeating last plan\'s mains.';
  }

  if (type === 'pantry_challenge') {
    return 'Pantry Challenge mode — built to burn down what you have before buying more.';
  }

  return 'Balanced for effort, flavor, and what is actually in your kitchen right now.';
}

function buildWhyChosen(ctx: MealExplainContext): string {
  const { meal, coverage, metrics, allMeals } = ctx;
  const parts: string[] = [];

  const inPantry = meal.ingredients.filter((i) => i.in_inventory);
  const missing = meal.ingredients.filter((i) => !i.in_inventory);

  if (meal.ingredients.length === 0) {
    parts.push(meal.description || 'Selected for this week\'s coverage mix.');
  } else if (inPantry.length === meal.ingredients.length) {
    parts.push(
      `Every ingredient is in your pantry now: ${inPantry.map((i) => i.name).join(', ')}.`,
    );
  } else if (inPantry.length > 0) {
    parts.push(
      `${inPantry.length} of ${meal.ingredients.length} ingredients on hand — ${inPantry.map((i) => i.name).join(', ')}.`,
    );
    if (missing.length) {
      parts.push(`Still need: ${missing.map((i) => i.name).join(', ')}.`);
    }
  } else {
    parts.push(`Would require shopping for: ${missing.map((i) => i.name).join(', ')}.`);
  }

  const goal = coverage?.planning_goal;
  if (goal === 'use_inventory') {
    parts.push('Planning goal: use inventory first — this slot prioritizes on-hand items.');
  } else if (goal === 'pantry_challenge') {
    parts.push('Planning goal: pantry challenge — minimize new purchases.');
  } else if (goal === 'quick_meals') {
    parts.push('Planning goal: quick meals — prep time kept reasonable.');
  } else if (goal === 'variety') {
    parts.push('Planning goal: variety — different proteins and flavors across the week.');
  } else if (goal === 'healthy_light') {
    parts.push('Planning goal: lighter eating this week.');
  } else if (goal === 'big_family') {
    parts.push(`Planning goal: feed ${coverage?.people ?? ctx.profile.household_size ?? 2} people well.`);
  }

  if (meal.name.toLowerCase().startsWith('leftover') || meal.tags?.includes('leftovers_friendly')) {
    const prior = findPriorDinnerForLeftover(meal, allMeals);
    if (prior) {
      parts.push(`Chains to ${prior.name} on day ${prior.day} — intentional leftover flow, not a random recipe.`);
    }
  }

  if (coverage?.cooking_style && coverage.cooking_style !== 'profile_default') {
    parts.push(`Cooking style for this plan: ${coverage.cooking_style.replace(/_/g, ' ')}.`);
  }

  if (metrics?.inventory_utilization_score != null && metrics.inventory_utilization_score > 0) {
    parts.push(`Whole plan uses ~${metrics.inventory_utilization_score}% of tracked inventory.`);
  }

  if (ctx.ledgerEntries?.length) {
    const outcomes = processLedgerOutcomes(ctx.ledgerEntries);
    const avoids = outcomes.replaced_meals.slice(0, 2);
    if (avoids.length) {
      parts.push(`Recent replaces on your ledger: ${avoids.join(', ')} — this meal is not one of those.`);
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
  const deep = buildMealDeepContext(ctx.meal, ctx.inventory);

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
        : ctx.meal.ingredients.length
          ? 'None of these ingredients are flagged in your pantry — check stock or shop.'
          : 'Ingredient list not attached — verify pantry before cook day.',
    substitutions,
    complexity,
    special_occasion: special,
    evidence: collectEvidence(ctx),
    confidence: Math.min(0.95, baseConfidence + (outcomes?.confidence_boost ?? 0)),
    ingredient_trivia: deep.ingredient_trivia ?? buildIngredientTrivia(ctx.meal, ctx.inventory),
    deep_dives: deep.deep_dives.length ? deep.deep_dives : undefined,
    dish_context: deep.dish_context,
    teaching_moments: deep.teaching_moments.length ? deep.teaching_moments : undefined,
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
