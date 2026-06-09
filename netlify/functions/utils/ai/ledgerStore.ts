/**
 * Decision Ledger persistence — Supabase + dev store (Phase 3).
 */

import { v4 as uuidv4 } from 'uuid';
import type { SupabaseClient } from '@supabase/supabase-js';
import { useDevStore, loadStore, saveStore } from '../db.js';
import type { DevStore } from '../types.js';
import type { MealPlan, PlannedMeal } from '../../../src/types/index.js';
import {
  mealReviewToLedgerEntry,
  generationToLedgerEntry,
  type DecisionLedgerEntry,
  type GenerationLedgerPayload,
  type MealReviewPayload,
} from './decisionLedger.js';
import { processLedgerOutcomes } from './outcomeProcessor.js';

export type StoredLedgerRow = DecisionLedgerEntry & {
  subject_key: string;
  created_at?: string;
  updated_at?: string;
};

function ledgerSubjectKey(planId: string, mealKey: string): string {
  return `plan:${planId}:meal:${mealKey}`;
}

function rowToEntry(row: StoredLedgerRow): DecisionLedgerEntry {
  return {
    id: row.id,
    household_id: row.household_id,
    user_id: row.user_id,
    timestamp: row.updated_at ?? row.created_at ?? row.timestamp,
    domain: row.domain,
    recommendation: row.recommendation,
    why: row.why,
    evidence: row.evidence ?? [],
    confidence: Number(row.confidence),
    expert_ids: row.expert_ids ?? [],
    outcome: row.outcome,
    outcome_at: row.outcome_at,
    outcome_note: row.outcome_note,
    metadata: row.metadata,
  };
}

function entryToRow(entry: DecisionLedgerEntry, subjectKey: string): StoredLedgerRow {
  const now = new Date().toISOString();
  return {
    ...entry,
    subject_key: subjectKey,
    created_at: now,
    updated_at: now,
  };
}

export function persistLedgerEntryDevStore(
  store: DevStore & { decision_ledger?: StoredLedgerRow[] },
  entry: DecisionLedgerEntry,
  subjectKey: string,
): StoredLedgerRow {
  if (!store.decision_ledger) store.decision_ledger = [];
  const row = entryToRow(entry, subjectKey);
  const idx = store.decision_ledger.findIndex(
    (r) => r.user_id === entry.user_id && r.subject_key === subjectKey,
  );
  if (idx >= 0) {
    row.id = store.decision_ledger[idx].id;
    row.created_at = store.decision_ledger[idx].created_at ?? row.created_at;
    store.decision_ledger[idx] = row;
  } else {
    row.id = row.id.startsWith('dl_') ? uuidv4() : row.id;
    store.decision_ledger.push(row);
  }
  return row;
}

export async function persistLedgerEntrySupabase(
  db: SupabaseClient,
  entry: DecisionLedgerEntry,
  subjectKey: string,
): Promise<StoredLedgerRow> {
  const payload = {
    user_id: entry.user_id,
    household_id: entry.household_id ?? null,
    subject_key: subjectKey,
    domain: entry.domain,
    recommendation: entry.recommendation,
    why: entry.why,
    evidence: entry.evidence,
    confidence: entry.confidence,
    expert_ids: entry.expert_ids,
    outcome: entry.outcome,
    outcome_at: entry.outcome_at ?? null,
    metadata: entry.metadata ?? {},
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await db
    .from('decision_ledger')
    .upsert(payload, { onConflict: 'user_id,subject_key' })
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return data as StoredLedgerRow;
}

export function getRecentLedgerDevStore(
  store: DevStore & { decision_ledger?: StoredLedgerRow[] },
  userId: string,
  domain?: string,
  limit = 20,
): DecisionLedgerEntry[] {
  let rows = (store.decision_ledger ?? []).filter((r) => r.user_id === userId);
  if (domain) rows = rows.filter((r) => r.domain === domain);
  return rows
    .sort((a, b) => (b.updated_at ?? '').localeCompare(a.updated_at ?? ''))
    .slice(0, limit)
    .map(rowToEntry);
}

export async function getRecentLedgerSupabase(
  db: SupabaseClient,
  userId: string,
  domain?: string,
  limit = 20,
): Promise<DecisionLedgerEntry[]> {
  let q = db.from('decision_ledger').select('*').eq('user_id', userId).order('updated_at', { ascending: false }).limit(limit);
  if (domain) q = q.eq('domain', domain);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return ((data ?? []) as StoredLedgerRow[]).map(rowToEntry);
}

export async function getRecentLedger(
  userId: string,
  token: string | undefined,
  domain?: string,
  limit = 20,
): Promise<DecisionLedgerEntry[]> {
  if (useDevStore()) {
    return getRecentLedgerDevStore(loadStore() as DevStore & { decision_ledger?: StoredLedgerRow[] }, userId, domain, limit);
  }
  if (!token) return [];
  const { getSupabaseUserClient } = await import('../supabase.js');
  const db = getSupabaseUserClient(token);
  return getRecentLedgerSupabase(db, userId, domain, limit);
}

/** Human-readable summary for meal planner prompts */
export function formatLedgerSummaryForPlanner(entries: DecisionLedgerEntry[]): string {
  const outcomes = processLedgerOutcomes(entries, 'meal_plan');
  if (!outcomes.kept_meals.length && !outcomes.replaced_meals.length && !outcomes.prefers_tags.length) {
    return '';
  }
  const lines: string[] = ['Recent meal plan feedback from this household:'];
  if (outcomes.kept_meals.length) {
    lines.push(`Kept: ${outcomes.kept_meals.slice(0, 5).join('; ')}`);
  }
  if (outcomes.replaced_meals.length) {
    lines.push(`Replace next time: ${outcomes.replaced_meals.slice(0, 5).join('; ')}`);
  }
  if (outcomes.prefers_tags.length) {
    lines.push(`Chef prefers these meal styles: ${outcomes.prefers_tags.join(', ')}.`);
  }
  if (outcomes.avoids_tags.length) {
    lines.push(`Chef rejected these styles — do not repeat: ${outcomes.avoids_tags.join(', ')}.`);
  }
  return lines.join('\n');
}

export interface MealReviewResult {
  plan: MealPlan;
  ledger_entry: DecisionLedgerEntry;
}

export async function logGenerationToLedger(
  userId: string,
  token: string | undefined,
  subjectKey: string,
  payload: GenerationLedgerPayload,
  householdId?: string,
): Promise<DecisionLedgerEntry> {
  const entry = generationToLedgerEntry(userId, payload, householdId);
  if (useDevStore()) {
    const store = loadStore() as DevStore & { decision_ledger?: StoredLedgerRow[] };
    const row = persistLedgerEntryDevStore(store, entry, subjectKey);
    saveStore(store);
    return { ...entry, id: row.id };
  }
  if (!token) return entry;
  const { getSupabaseUserClient } = await import('../supabase.js');
  const db = getSupabaseUserClient(token);
  const row = await persistLedgerEntrySupabase(db, entry, subjectKey);
  return rowToEntry(row);
}

export async function persistMealPlanReview(
  userId: string,
  token: string | undefined,
  payload: MealReviewPayload & { meal?: PlannedMeal },
  householdId?: string,
): Promise<MealReviewResult> {
  const subjectKey = ledgerSubjectKey(payload.plan_id, payload.meal_key);
  const entry = mealReviewToLedgerEntry(userId, payload, householdId);
  const reviewedAt = new Date().toISOString();

  if (useDevStore()) {
    const store = loadStore() as DevStore & { decision_ledger?: StoredLedgerRow[] };
    const planIdx = store.meal_plans.findIndex((p) => p.id === payload.plan_id && p.user_id === userId);
    if (planIdx < 0) throw new Error('Meal plan not found');
    const plan = store.meal_plans[planIdx];
    const row = persistLedgerEntryDevStore(store, entry, subjectKey);
    const reviews = {
      ...(plan.plan_data.reviews ?? {}),
      [payload.meal_key]: {
        action: payload.action,
        at: reviewedAt,
        ledger_id: row.id,
      },
    };
    plan.plan_data = { ...plan.plan_data, reviews };
    store.meal_plans[planIdx] = plan;
    saveStore(store);
    return { plan, ledger_entry: { ...entry, id: row.id } };
  }

  if (!token) throw new Error('Missing auth token');
  const { getSupabaseUserClient } = await import('../supabase.js');
  const db = getSupabaseUserClient(token);

  const { data: planRow, error: planErr } = await db
    .from('meal_plans')
    .select('*')
    .eq('id', payload.plan_id)
    .eq('user_id', userId)
    .single();
  if (planErr || !planRow) throw new Error('Meal plan not found');

  const plan = planRow as MealPlan;
  const row = await persistLedgerEntrySupabase(db, entry, subjectKey);
  const reviews = {
    ...(plan.plan_data?.reviews ?? {}),
    [payload.meal_key]: {
      action: payload.action,
      at: reviewedAt,
      ledger_id: row.id,
    },
  };
  const updatedPlanData = { ...plan.plan_data, reviews };

  const { error: updateErr } = await db
    .from('meal_plans')
    .update({ plan_data: updatedPlanData })
    .eq('id', payload.plan_id)
    .eq('user_id', userId);
  if (updateErr) throw new Error(updateErr.message);

  return {
    plan: { ...plan, plan_data: updatedPlanData },
    ledger_entry: rowToEntry(row),
  };
}
