/** Household knowledge graph edges — Brain 2.0 (Phase 5) */

export type GraphEdgeType =
  | 'PURCHASED'
  | 'COOKED'
  | 'KEPT'
  | 'REPLACED'
  | 'STAPLE'
  | 'PREFERS'
  | 'AVOIDS'
  | 'USES';

export interface HouseholdGraphEdge {
  edge_type: GraphEdgeType;
  from_key: string;
  to_key: string;
  weight: number;
  evidence: string[];
  metadata?: Record<string, unknown>;
}

export interface InferredCookingStyle {
  primary_label: string;
  secondary_label?: string;
  cuisine_tags: string[];
  confidence: number;
  evidence: string[];
  updated_at: string;
}

export type PatternType =
  | 'buy_never_use'
  | 'staple_identity'
  | 'leftover_frequency'
  | 'cook_night_rhythm'
  | 'emerging_tradition'
  | 'ledger_preference';

export interface DetectedPattern {
  id: string;
  type: PatternType;
  headline: string;
  insight: string;
  action_prompt?: string;
  confidence: number;
  evidence: string[];
  metadata?: Record<string, unknown>;
}
