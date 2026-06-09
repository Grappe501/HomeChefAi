/**
 * Meal / recipe tags — foundation for Dinner Party Mode, Brain, and planner intelligence.
 * See develop_notes/MEAL_PLANNER_ROADMAP_2_0.md
 */

export type MealTagId =
  | 'weeknight'
  | '30_minutes'
  | 'crowd_favorite'
  | 'dinner_party'
  | 'church_potluck'
  | 'holiday'
  | 'leftovers_friendly'
  | 'freezer_friendly'
  | 'easy_night'
  | 'pantry_challenge'
  | 'pantry_stretch'
  | 'budget_friendly';

export const MEAL_TAGS: { id: MealTagId; label: string }[] = [
  { id: 'weeknight', label: 'Weeknight' },
  { id: '30_minutes', label: '30 Minutes' },
  { id: 'crowd_favorite', label: 'Crowd Favorite' },
  { id: 'dinner_party', label: 'Dinner Party' },
  { id: 'church_potluck', label: 'Church Potluck' },
  { id: 'holiday', label: 'Holiday' },
  { id: 'leftovers_friendly', label: 'Leftovers Friendly' },
  { id: 'freezer_friendly', label: 'Freezer Friendly' },
  { id: 'easy_night', label: 'Easy Night' },
  { id: 'pantry_challenge', label: 'Pantry Challenge' },
  { id: 'pantry_stretch', label: 'Pantry Stretch' },
  { id: 'budget_friendly', label: 'Budget Friendly' },
];

export function mealTagLabel(id: MealTagId): string {
  return MEAL_TAGS.find((t) => t.id === id)?.label ?? id;
}
