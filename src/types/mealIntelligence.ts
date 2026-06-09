/**
 * Meal intelligence — structured "Why this?" output for plan review.
 */

export type MealRecommendationType =
  | 'inventory_match'
  | 'pantry_challenge'
  | 'style_match'
  | 'leftover_chain'
  | 'easy_night'
  | 'variety'
  | 'nutrition_goal'
  | 'new_suggestion'
  | 'household_favorite';

export type MealComplexityLevel = 'simple' | 'moderate' | 'elaborate';

export type SpecialOccasionCategory =
  | 'date_night'
  | 'dinner_party'
  | 'celebration'
  | 'entertaining'
  | 'none';

export interface MealSubstitutionHint {
  missing: string;
  swap: string;
  note?: string;
  knowledge_id?: string;
  in_pantry?: boolean;
}

export interface MealComplexity {
  level: MealComplexityLevel;
  courses: 1 | 2 | 3;
  prep_time_minutes: number;
  wine_pairing_suggested: boolean;
  wine_note?: string;
}

export interface MealSpecialOccasion {
  expandable: boolean;
  category: SpecialOccasionCategory;
  label?: string;
  menu_prep_hints: string[];
  grocery_prep_hints: string[];
  inventory_prep_hints: string[];
}

export interface MealIntelligence {
  recommendation_type: MealRecommendationType;
  recommendation_label: string;
  headline: string;
  why_chosen: string;
  nutrition_fit: string;
  likeability: string;
  inventory_story: string;
  substitutions: MealSubstitutionHint[];
  complexity: MealComplexity;
  special_occasion: MealSpecialOccasion;
  evidence: string[];
  confidence: number;
}
