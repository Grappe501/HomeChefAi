/** Kitchen Learning Engine v7 — Pillar 1: Taste & Preference Learner */

export type PreferenceKind = 'avoid' | 'prefer' | 'allergy' | 'household';

export type MealOutcomeRating = 'loved' | 'ok' | 'never_again' | 'too_hard' | 'too_long';

export interface TasteVector {
  spicy: number;
  rich: number;
  acidic: number;
  fresh_light: number;
  adventurous: number;
  kid_friendly: number;
  comfort: number;
  quick_weeknight: number;
}

export interface TastePreferenceEntry {
  id: string;
  subject: string;
  kind: PreferenceKind;
  reason?: string;
  member_label?: string;
  source: 'chat' | 'cook_log' | 'meal_plan' | 'onboarding' | 'manual';
  created_at: string;
}

export interface TasteProfile {
  version: number;
  taste_vector: TasteVector;
  preferences: TastePreferenceEntry[];
  drift_notes?: string[];
  updated_at: string;
}

export interface MealOutcome {
  id: string;
  user_id: string;
  usage_log_id?: string;
  meal_name: string;
  rating: MealOutcomeRating;
  notes?: string;
  created_at: string;
}

export const MEAL_OUTCOME_OPTIONS: { id: MealOutcomeRating; label: string; emoji: string }[] = [
  { id: 'loved', label: 'Loved it', emoji: '❤️' },
  { id: 'ok', label: 'It was OK', emoji: '👍' },
  { id: 'never_again', label: 'Never again', emoji: '👎' },
  { id: 'too_hard', label: 'Too hard', emoji: '😅' },
  { id: 'too_long', label: 'Took too long', emoji: '⏱️' },
];

export const DEFAULT_TASTE_VECTOR: TasteVector = {
  spicy: 0.5,
  rich: 0.5,
  acidic: 0.5,
  fresh_light: 0.5,
  adventurous: 0.5,
  kid_friendly: 0.5,
  comfort: 0.5,
  quick_weeknight: 0.5,
};

export interface PendingPreference {
  subject: string;
  kind: PreferenceKind;
  reason?: string;
  member_label?: string;
}
