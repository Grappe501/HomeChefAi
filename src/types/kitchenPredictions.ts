import type { MealDirection } from './mealDirections';

export type KitchenPredictionType =
  | 'likely_meals'
  | 'use_before_waste'
  | 'kitchen_identity'
  | 'ledger_avoid'
  | 'buy_never_use'
  | 'cook_night'
  | 'emerging_tradition';

export interface KitchenPrediction {
  id: string;
  type: KitchenPredictionType;
  title: string;
  message: string;
  priority: number;
  evidence: string[];
  /** Pre-filled Clara prompt when user taps the card */
  clara_prompt?: string;
  meals?: string[];
  directions?: MealDirection[];
}

export interface KitchenPredictionsResult {
  predictions: KitchenPrediction[];
  kitchen_identity?: string | null;
  generated_at: string;
}

export interface PantryScanItem {
  name: string;
  quantity: number;
  unit: string;
  category: string;
  location: 'pantry' | 'fridge' | 'freezer';
  knowledge_id?: string;
  confidence?: number;
  needs_expiration?: boolean;
  suggested_expiration?: string | null;
}

export interface PantryScanResult {
  items: PantryScanItem[];
  scene_summary?: string;
}

export interface CookInferResult {
  reply: string;
  suggested_items: { name: string; quantity: number; unit: string }[];
  confidence: number;
  source: 'template' | 'inventory' | 'graph';
  credit_cost: number;
}
