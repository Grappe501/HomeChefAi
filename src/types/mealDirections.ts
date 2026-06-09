/**
 * Culinary reasoning — 3-direction flow (Phase 4)
 */

export interface MealDirection {
  id: string;
  title: string;
  tagline: string;
  cuisine_id: string;
  cuisine_label: string;
  staples_in_inventory: string[];
  missing_staples: string[];
  technique_hint?: string;
  flavor_profile?: string;
  evidence: string[];
  confidence: number;
}

export interface MealDirectionsResult {
  directions: MealDirection[];
  inventory_summary: string;
  reasoning_note: string;
}
