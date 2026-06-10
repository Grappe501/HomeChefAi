/** Kitchen Learning Engine v7 — Pillar 4: Household Identity Learner */

export interface IdentityProfile {
  version: number;
  kitchen_name?: string;
  primary_style: string;
  secondary_style?: string;
  archetype_label: string;
  cuisine_tags: string[];
  identity_traits: string[];
  cooks_with: string[];
  food_priorities: string[];
  taste_signals: string[];
  rhythm_signals: string[];
  skill_level: string;
  confidence: number;
  identity_notes?: string[];
  updated_at: string;
}

export interface IdentityNudge {
  id: string;
  title: string;
  message: string;
  clara_prompt?: string;
}
