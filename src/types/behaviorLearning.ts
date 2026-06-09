/** Kitchen Learning Engine v7 — Pillar 2: Behavior & Rhythm Learner */

export type LeftoverStyle = 'batch_cooker' | 'cook_fresh' | 'mixed' | 'unknown';

export interface CookNightRhythm {
  day: number;
  day_name: string;
  share: number;
}

export interface ShopDayPattern {
  day: number;
  day_name: string;
  confidence: number;
  avg_days_between?: number;
}

export interface BudgetBand {
  weekly_low: number;
  weekly_high: number;
  weekly_avg: number;
}

export interface TimeBudget {
  weeknight_max_minutes: number;
  weekend_project_ok: boolean;
}

export interface BehaviorProfile {
  version: number;
  cook_nights: CookNightRhythm[];
  shop_day?: ShopDayPattern;
  leftover_style: LeftoverStyle;
  leftover_share?: number;
  budget_band?: BudgetBand;
  time_budget: TimeBudget;
  rhythm_notes?: string[];
  updated_at: string;
}

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

export const DEFAULT_TIME_BUDGET: TimeBudget = {
  weeknight_max_minutes: 45,
  weekend_project_ok: true,
};

export interface KitchenRhythmNudge {
  id: string;
  title: string;
  message: string;
  clara_prompt?: string;
}
