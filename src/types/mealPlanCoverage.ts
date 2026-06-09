export type CoveragePreset =
  | 'dinners_only'
  | 'breakfast_dinner'
  | 'lunch_dinner'
  | 'all_meals'
  | 'custom';

export type PlanningGoalId =
  | 'save_money'
  | 'use_inventory'
  | 'quick_meals'
  | 'healthy_light'
  | 'big_family'
  | 'variety'
  | 'kid_friendly'
  | 'pantry_challenge';

/** Temporary per-plan style override (profile cuisines are the default hint). */
export type CookingStyleId =
  | 'profile_default'
  | 'comfort'
  | 'southern'
  | 'cajun'
  | 'italian'
  | 'mexican'
  | 'asian'
  | 'bbq_smoked'
  | 'homestead'
  | 'meal_prep'
  | 'entertaining';

export const COOKING_STYLES: { id: CookingStyleId; label: string }[] = [
  { id: 'profile_default', label: 'From my profile' },
  { id: 'comfort', label: 'Comfort Food' },
  { id: 'southern', label: 'Southern' },
  { id: 'cajun', label: 'Cajun / Creole' },
  { id: 'italian', label: 'Italian' },
  { id: 'mexican', label: 'Mexican' },
  { id: 'asian', label: 'Asian-Inspired' },
  { id: 'bbq_smoked', label: 'BBQ & Smoked' },
  { id: 'homestead', label: 'Homestead' },
  { id: 'meal_prep', label: 'Meal Prep' },
  { id: 'entertaining', label: 'Entertaining' },
];

export const COOK_NIGHT_PRESETS = [
  { value: 3, label: 'Cook 3 nights' },
  { value: 5, label: 'Cook 5 nights' },
] as const;

export interface MealCounts {
  breakfasts: number;
  lunches: number;
  dinners: number;
  snacks: number;
}

export interface MealPlanCoverage {
  days: number;
  counts: MealCounts;
  preset: CoveragePreset;
  people: number;
  planningGoal: PlanningGoalId;
}

export const PLAN_LENGTH_OPTIONS = [3, 5, 7, 14] as const;

export const COVERAGE_PRESETS: { id: CoveragePreset; label: string }[] = [
  { id: 'dinners_only', label: 'Dinners only' },
  { id: 'breakfast_dinner', label: 'Breakfast + dinner' },
  { id: 'lunch_dinner', label: 'Lunch + dinner' },
  { id: 'all_meals', label: 'Breakfast + lunch + dinner' },
  { id: 'custom', label: 'Custom' },
];

export const PLANNING_GOALS: { id: PlanningGoalId; label: string }[] = [
  { id: 'save_money', label: 'Save money' },
  { id: 'use_inventory', label: 'Use what we have' },
  { id: 'pantry_challenge', label: 'Pantry challenge' },
  { id: 'quick_meals', label: 'Quick meals' },
  { id: 'healthy_light', label: 'Healthy / light' },
  { id: 'big_family', label: 'Big family meals' },
  { id: 'variety', label: 'Variety' },
  { id: 'kid_friendly', label: 'Kid-friendly' },
];

export function countsForPreset(preset: CoveragePreset, days: number): MealCounts {
  switch (preset) {
    case 'breakfast_dinner':
      return { breakfasts: days, lunches: 0, dinners: days, snacks: 0 };
    case 'lunch_dinner':
      return { breakfasts: 0, lunches: days, dinners: days, snacks: 0 };
    case 'all_meals':
      return { breakfasts: days, lunches: days, dinners: days, snacks: 0 };
    case 'custom':
      return { breakfasts: 0, lunches: 0, dinners: days, snacks: 0 };
    case 'dinners_only':
    default:
      return { breakfasts: 0, lunches: 0, dinners: days, snacks: 0 };
  }
}

export function totalMeals(counts: MealCounts): number {
  return counts.breakfasts + counts.lunches + counts.dinners + counts.snacks;
}

/** Full-day coverage: breakfast + lunch + dinner all requested */
export function isFullDayCoverage(counts: MealCounts): boolean {
  return counts.breakfasts > 0 && counts.lunches > 0 && counts.dinners > 0;
}

/** Show UI warning — many meals or full-day plan */
export function shouldWarnHeavyPlan(counts: MealCounts): boolean {
  return isFullDayCoverage(counts) || totalMeals(counts) >= 14;
}

export function formatPlannedFor(people: number): string {
  return `Planned for ${people} ${people === 1 ? 'person' : 'people'}`;
}

export function formatCoverageSummary(counts: MealCounts): string {
  const parts: string[] = [];
  if (counts.breakfasts) parts.push(`${counts.breakfasts} breakfast${counts.breakfasts === 1 ? '' : 's'}`);
  if (counts.lunches) parts.push(`${counts.lunches} lunch${counts.lunches === 1 ? '' : 'es'}`);
  if (counts.dinners) parts.push(`${counts.dinners} dinner${counts.dinners === 1 ? '' : 's'}`);
  if (counts.snacks) parts.push(`${counts.snacks} snack${counts.snacks === 1 ? '' : 's'}`);
  return parts.length ? parts.join(', ') : 'no meals selected';
}

export function formatPlanningLabel(counts: MealCounts): string {
  return `Planning: ${formatCoverageSummary(counts)}`;
}

export function planningGoalPrompt(goal: PlanningGoalId): string {
  const map: Record<PlanningGoalId, string> = {
    save_money: 'Prioritize budget-friendly ingredients and minimize waste.',
    use_inventory: 'Maximize use of current pantry inventory before suggesting purchases.',
    pantry_challenge: 'Pantry Challenge: use inventory first, minimize grocery spend, reduce waste. Favor items already on hand.',
    quick_meals: 'Favor meals under 30 minutes prep time.',
    healthy_light: 'Lean toward lighter, nutritious options.',
    big_family: 'Generous portions suitable for a hungry household.',
    variety: 'Avoid repeating the same proteins or cuisines back-to-back.',
    kid_friendly: 'Include approachable, family-friendly options.',
  };
  return map[goal];
}

export function cookingStylePrompt(style: CookingStyleId, profileCuisines: string[]): string {
  if (style === 'profile_default') {
    return profileCuisines.length
      ? `Cooking style from profile: ${profileCuisines.join(', ')}.`
      : 'General American home cooking.';
  }
  const map: Record<Exclude<CookingStyleId, 'profile_default'>, string> = {
    comfort: 'Comfort food — hearty, familiar, satisfying.',
    southern: 'Southern home cooking — biscuits, greens, classic comfort.',
    cajun: 'Cajun / Creole — bold spice, roux, Louisiana flavors.',
    italian: 'Italian — pasta, tomatoes, olive oil, herbs.',
    mexican: 'Mexican — beans, rice, cumin, chiles, tortillas.',
    asian: 'Asian-inspired — soy, ginger, rice, stir-fry balance.',
    bbq_smoked: 'BBQ & smoked — low-and-slow, grilled, smoky flavors.',
    homestead: 'Homestead — from-scratch, pantry staples, practical.',
    meal_prep: 'Meal prep — batch-friendly, stores well, efficient.',
    entertaining: 'Entertaining — crowd-pleasing, a step above weeknight.',
  };
  return map[style];
}

export function cookNightsPrompt(cookNights: number, dinnerSlots: number): string {
  if (dinnerSlots <= 0 || cookNights >= dinnerSlots) {
    return 'Every dinner slot is a home-cooked meal.';
  }
  const easy = dinnerSlots - cookNights;
  return `Of ${dinnerSlots} dinner slots: plan exactly ${cookNights} home-cooked dinners. The other ${easy} slot(s) are easy nights — use labels like "Leftover night", "Sandwich night", "Soup night", "Pizza night", or "Free night". Tag easy nights with "easy_night".`;
}

/** Meals allocated to a day-range chunk (days startDay..startDay+dayCount-1). */
export function chunkMealCounts(
  counts: MealCounts,
  startDay: number,
  dayCount: number,
  planDays: number,
): MealCounts {
  const alloc = (total: number) => {
    if (total <= 0) return 0;
    if (total === planDays) return dayCount;
    const endDay = startDay + dayCount - 1;
    const allocatedBefore = Math.round(((startDay - 1) / planDays) * total);
    const allocatedThrough = Math.round((endDay / planDays) * total);
    return Math.max(0, allocatedThrough - allocatedBefore);
  };

  return {
    breakfasts: alloc(counts.breakfasts),
    lunches: alloc(counts.lunches),
    dinners: alloc(counts.dinners),
    snacks: alloc(counts.snacks),
  };
}

export function chunkSizeForCoverage(counts: MealCounts, planDays: number): number {
  const perDay = totalMeals(counts) / Math.max(planDays, 1);
  if (perDay >= 3) return 1;
  if (perDay >= 2) return 2;
  return 3;
}

export function buildMealScopePrompt(counts: MealCounts, startDay: number, dayCount: number, planDays: number): string {
  const chunk = chunkMealCounts(counts, startDay, dayCount, planDays);
  const endDay = startDay + dayCount - 1;
  const lines: string[] = [`Plan meals for days ${startDay} through ${endDay} (${dayCount} days).`];

  const add = (type: string, n: number) => {
    if (n <= 0) return;
    const spread =
      n === dayCount
        ? `one ${type} per day on each of these days`
        : `${n} ${type}${n === 1 ? '' : 's'} spread across these days`;
    lines.push(`- Exactly ${n} ${type}${n === 1 ? '' : 's'} (${spread}).`);
  };

  add('breakfast', chunk.breakfasts);
  add('lunch', chunk.lunches);
  add('dinner', chunk.dinners);
  add('snack', chunk.snacks);

  if (totalMeals(chunk) === 0) {
    lines.push('- No meals requested for this chunk.');
  }

  lines.push('Use correct meal_type values: breakfast, lunch, dinner, snack.');
  return lines.join('\n');
}
