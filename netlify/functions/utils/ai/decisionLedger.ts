/**
 * AI Decision Ledger — every recommendation learns from outcomes.
 * SOUSCHEF-AI-FOUNDATION-1.0 · Phase 3
 */

import type { PlannedMeal } from '../../../src/types/index.js';
import { expertsForIntent } from './brainRegistry.js';

export type DecisionDomain =
  | 'meal_plan'
  | 'chat'
  | 'suggestion'
  | 'substitution'
  | 'hosting'
  | 'preference';

export type DecisionOutcome = 'accepted' | 'rejected' | 'replaced' | 'pending';

export interface DecisionLedgerEntry {
  id: string;
  household_id?: string;
  user_id: string;
  timestamp: string;
  domain: DecisionDomain;
  recommendation: string;
  why: string;
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
  meal?: PlannedMeal;
  why_requested?: boolean;
}

export function mealReviewSubjectKey(planId: string, mealKey: string): string {
  return `plan:${planId}:meal:${mealKey}`;
}

/** Build ledger entry from meal plan review with intelligence evidence */
export interface GenerationLedgerPayload {
  domain: DecisionDomain;
  recommendation: string;
  why: string;
  evidence: string[];
  confidence?: number;
  expert_ids?: string[];
  metadata?: Record<string, unknown>;
}

export function generationToLedgerEntry(
  userId: string,
  payload: GenerationLedgerPayload,
  householdId?: string,
): DecisionLedgerEntry {
  return {
    id: `dl_gen_${Date.now()}`,
    user_id: userId,
    household_id: householdId,
    timestamp: new Date().toISOString(),
    domain: payload.domain,
    recommendation: payload.recommendation,
    why: payload.why,
    evidence: payload.evidence,
    confidence: payload.confidence ?? 0.7,
    expert_ids: payload.expert_ids ?? [],
    outcome: 'pending',
    metadata: payload.metadata,
  };
}

export function mealReviewToLedgerEntry(
  userId: string,
  review: MealReviewPayload,
  householdId?: string,
): DecisionLedgerEntry {
  const intel = review.meal?.intelligence;
  const experts = expertsForIntent('meal_plan').map((e) => e.id);
  if (review.action === 'replace') {
    experts.push('flavor_architect');
  }

  const evidence: string[] = [
    `plan:${review.plan_id}`,
    `meal:${review.meal_key}`,
    `day:${review.day}`,
    `type:${review.meal_type}`,
  ];
  if (intel?.recommendation_type) evidence.push(`rec:${intel.recommendation_type}`);
  if (intel?.evidence?.length) evidence.push(...intel.evidence);

  const whyParts: string[] = [];
  if (intel?.why_chosen) whyParts.push(intel.why_chosen);
  if (intel?.likeability) whyParts.push(intel.likeability);
  if (review.action === 'keep') {
    whyParts.push('Chef kept this meal — reinforce similar choices.');
  } else {
    whyParts.push('Chef wants a replacement — avoid this pattern next plan.');
  }

  return {
    id: `dl_${review.plan_id}_${review.meal_key}`,
    user_id: userId,
    household_id: householdId,
    timestamp: new Date().toISOString(),
    domain: 'meal_plan',
    recommendation: review.meal_name,
    why: whyParts.join(' '),
    evidence: [...new Set(evidence)],
    confidence: intel?.confidence ?? 0.75,
    expert_ids: [...new Set(experts)],
    outcome: review.action === 'keep' ? 'accepted' : 'replaced',
    outcome_at: new Date().toISOString(),
    metadata: {
      meal_key: review.meal_key,
      plan_id: review.plan_id,
      day: review.day,
      meal_type: review.meal_type,
      action: review.action,
      recommendation_type: intel?.recommendation_type,
      recommendation_label: intel?.recommendation_label,
      complexity: intel?.complexity,
    },
  };
}
