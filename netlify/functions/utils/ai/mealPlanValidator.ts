/**
 * Agent Suite v6 — post-GPT meal plan validation against pantry + dish library.
 */

import type { InventoryItem, MealPlanData, PlannedMeal, Profile } from '../../../../src/types/index.js';
import { matchDishesForPantry } from './dishMatcher.js';

function inventoryHasName(inventory: InventoryItem[], name: string): boolean {
  const lower = name.toLowerCase();
  if (lower.length < 2) return false;
  return inventory.some((i) => {
    const n = i.name.toLowerCase();
    return n === lower || n.includes(lower) || lower.includes(n);
  });
}

function pantryScore(meal: PlannedMeal, inventory: InventoryItem[]): number {
  const ings = meal.ingredients ?? [];
  if (!ings.length) return 0;
  let hits = 0;
  for (const ing of ings) {
    if (ing.in_inventory === true || inventoryHasName(inventory, ing.name)) hits++;
  }
  return hits / ings.length;
}

function isEasyNightMeal(meal: PlannedMeal): boolean {
  if (meal.tags?.includes('easy_night')) return true;
  return /\b(leftover|sandwich|pizza|free night|takeout|easy night)\b/i.test(meal.name);
}

export interface MealPlanValidationResult {
  plan: MealPlanData;
  repaired_count: number;
  low_pantry_count: number;
}

/** Replace weak GPT slots with corpus matches when pantry fit is poor */
export function validateAndRepairMealPlan(
  plan: MealPlanData,
  inventory: InventoryItem[],
  profile: Profile,
): MealPlanValidationResult {
  if (!inventory.length || !plan.meals?.length) {
    return { plan, repaired_count: 0, low_pantry_count: 0 };
  }

  const dishPool = matchDishesForPantry(inventory, profile, { limit: 100 });
  let repaired = 0;
  let lowPantry = 0;
  let dishIdx = 0;

  const meals = plan.meals.map((meal) => {
    if (isEasyNightMeal(meal)) return meal;

    const score = pantryScore(meal, inventory);
    if (score >= 0.4) return meal;

    lowPantry++;

    const course = meal.course ?? (meal.meal_type === 'breakfast' ? 'breakfast' : 'main');
    const courseMatches = dishPool.filter((d) => d.course === course || (course === 'main' && d.course === 'main'));
    const pool = courseMatches.length ? courseMatches : dishPool;
    const candidate = pool[dishIdx % pool.length];
    dishIdx++;

    if (!candidate || candidate.pantry_match < 20) return meal;

    repaired++;
    return {
      ...meal,
      name: candidate.title.replace(/\s*\([^)]+\)\s*$/, '').trim() || candidate.title,
      description: candidate.description ?? meal.description,
      ingredients: candidate.ingredients.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        unit: i.unit,
        in_inventory: candidate.ingredients_in_pantry.some(
          (p) => p.toLowerCase() === i.name.toLowerCase() || inventoryHasName(inventory, i.name),
        ),
      })),
      prep_time_minutes: candidate.prep_time_minutes ?? meal.prep_time_minutes,
      tags: [...new Set([...(meal.tags ?? []), 'pantry_matched', ...(candidate.tags ?? []).slice(0, 2)])],
    };
  });

  const uses = new Set(plan.uses_inventory ?? []);
  for (const m of meals) {
    for (const ing of m.ingredients ?? []) {
      if (ing.in_inventory) uses.add(ing.name);
    }
  }

  return {
    plan: { ...plan, meals, uses_inventory: [...uses] },
    repaired_count: repaired,
    low_pantry_count: lowPantry,
  };
}
