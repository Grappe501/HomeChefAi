/**
 * AI Decision Ledger — every recommendation learns from outcomes.
 * SOUSCHEF-AI-FOUNDATION-1.0 · S4 target
 *
 * Seed: meal plan Keep / Replace / Why (MealPlanner.tsx)
 */

export type DecisionDomain =
  | 'meal_plan'
  | 'chat'
  | 'suggestion'
  | 'substitution'
  | 'hosting';

export type DecisionOutcome = 'accepted' | 'rejected' | 'replaced' | 'pending';

export interface DecisionLedgerEntry {
  id: string;
  household_id?: string;
  user_id: string;
  timestamp: string;
  domain: DecisionDomain;
  /** What Clara recommended */
  recommendation: string;
  /** Plain-language rationale */
  why: string;
  /** graph node ids, memory ids, inventory refs */
  evidence: string[];
  confidence: number;
  expert_ids: string[];
  outcome: DecisionOutcome;
  outcome_at?: string;
  outcome_note?: string;
  metadata?: Record<string, unknown>;
}

export interface MealReviewPayload {
  plan_id: string;
  meal_key: string;
  meal_name: string;
  day: number;
  meal_type: string;
  action: 'keep' | 'replace';
  why_requested?: boolean;
}

/** Build ledger entry from meal plan review (MVP). */
export function mealReviewToLedgerEntry(
  userId: string,
  review: MealReviewPayload,
): DecisionLedgerEntry {
  return {
    id: `dl_${review.plan_id}_${review.meal_key}`,
    user_id: userId,
    timestamp: new Date().toISOString(),
    domain: 'meal_plan',
    recommendation: review.meal_name,
    why: review.why_requested
      ? 'Chef asked why this meal was suggested.'
      : 'Meal plan generation',
    evidence: [`plan:${review.plan_id}`, `meal:${review.meal_key}`, `day:${review.day}`, `type:${review.meal_type}`],
    confidence: 0.7,
    expert_ids: ['executive_chef', 'budget_analyst'],
    outcome: review.action === 'keep' ? 'accepted' : 'replaced',
    outcome_at: new Date().toISOString(),
    metadata: { meal_key: review.meal_key },
  };
}
