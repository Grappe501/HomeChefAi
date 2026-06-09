import type { MemoryType } from '../../../../src/types/platform';

export interface MemoryMetadata {
  source_events: string[];
  observation_count: number;
  history_days: number;
  computed_value?: number;
  computed_label?: string;
  confidence: number;
  formula: string;
  evidence_lines: string[];
  date_range_start?: string;
  date_range_end?: string;
}

export interface GeneratedMemory {
  memory_type: MemoryType;
  subject_key: string;
  headline: string;
  insight: string;
  action_prompt?: string;
  confidence: number;
  metadata: MemoryMetadata;
  surfaced: boolean;
}

export interface BrainContext {
  userId: string;
  householdId?: string;
  receipts: BrainReceipt[];
  usageLogs: BrainUsageLog[];
  wasteEvents: BrainWasteEvent[];
  cuisinePreferences: string[];
}

export interface BrainReceipt {
  id: string;
  store_name?: string;
  receipt_date?: string;
  verified: boolean;
  created_at: string;
  items: { name: string; quantity?: number }[];
}

export interface BrainUsageLog {
  id: string;
  meal_name?: string;
  items_used?: { name: string; quantity?: number; unit?: string }[];
  created_at: string;
}

export interface BrainWasteEvent {
  id: string;
  item_name: string;
  item_key: string;
  created_at: string;
}

export interface StoredMemory extends GeneratedMemory {
  id: string;
  user_id: string;
  household_id?: string;
  created_at: string;
  updated_at: string;
}

export function normalizeKey(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

export function itemMatchesStaple(name: string): boolean {
  const n = name.toLowerCase();
  return ['milk', 'egg', 'eggs', 'bread', 'butter'].some((s) => n.includes(s));
}

export function itemMatchesWasteTrack(name: string): boolean {
  const n = name.toLowerCase();
  return ['spinach', 'lettuce', 'banana', 'bananas', 'herb', 'herbs', 'berry', 'berries'].some((s) => n.includes(s));
}

export function daysBetween(a: Date, b: Date): number {
  return Math.abs(a.getTime() - b.getTime()) / 86400000;
}

export function formatDayName(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'long' });
}

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
