/**
 * KLE v7 Pillar 2 — behavior profile persistence.
 */

import type { Profile } from '../../../../src/types/index.js';
import type { BehaviorProfile, TimeBudget } from '../../../../src/types/behaviorLearning.js';
import type { MealOutcome } from '../../../../src/types/tasteLearning.js';
import { useDevStore, loadStore, saveStore } from '../db.js';
import { getSupabaseUserClient } from '../supabase.js';
import {
  inferBehaviorProfile,
  formatBehaviorProfileForPrompt,
  buildRhythmNudges,
} from './behaviorProfileEngine.js';
import { getRecentLedger } from '../ai/ledgerStore.js';

async function loadUsageLogs(userId: string, token?: string, limit = 60) {
  if (useDevStore()) {
    return loadStore()
      .usage_logs.filter((l) => l.user_id === userId)
      .sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))
      .slice(0, limit)
      .map((l) => ({ id: l.id, meal_name: l.meal_name, created_at: l.created_at ?? '' }));
  }
  if (!token) return [];
  const db = getSupabaseUserClient(token);
  const { data } = await db
    .from('usage_logs')
    .select('id, meal_name, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return (data ?? []) as { id: string; meal_name?: string; created_at: string }[];
}

async function loadReceipts(userId: string, token?: string, limit = 40) {
  if (useDevStore()) {
    return loadStore()
      .receipts.filter((r) => r.user_id === userId)
      .sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))
      .slice(0, limit)
      .map((r) => ({
        id: r.id,
        receipt_date: r.receipt_date,
        total_amount: r.total_amount,
        verified: r.verified,
        created_at: r.created_at ?? '',
      }));
  }
  if (!token) return [];
  const db = getSupabaseUserClient(token);
  const { data } = await db
    .from('receipts')
    .select('id, receipt_date, total_amount, verified, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return (data ?? []) as {
    id: string;
    receipt_date?: string;
    total_amount?: number;
    verified?: boolean;
    created_at: string;
  }[];
}

async function loadMealOutcomes(userId: string, token?: string): Promise<MealOutcome[]> {
  if (useDevStore()) {
    const store = loadStore() as { meal_outcomes?: MealOutcome[] };
    return (store.meal_outcomes ?? []).filter((o) => o.user_id === userId);
  }
  if (!token) return [];
  const db = getSupabaseUserClient(token);
  const { data } = await db.from('meal_outcomes').select('*').eq('user_id', userId).limit(30);
  return (data ?? []) as MealOutcome[];
}

async function loadProfile(userId: string, token?: string): Promise<Profile | null> {
  if (useDevStore()) {
    return loadStore().profiles.find((p) => p.user_id === userId) ?? null;
  }
  if (!token) return null;
  const db = getSupabaseUserClient(token);
  const { data } = await db.from('profiles').select('*').eq('user_id', userId).maybeSingle();
  return (data as Profile | null) ?? null;
}

async function persistBehaviorProfile(
  userId: string,
  token: string | undefined,
  behaviorProfile: BehaviorProfile,
): Promise<void> {
  if (useDevStore()) {
    const store = loadStore();
    const idx = store.profiles.findIndex((p) => p.user_id === userId);
    if (idx >= 0) {
      store.profiles[idx] = {
        ...store.profiles[idx],
        behavior_profile: behaviorProfile as never,
        updated_at: new Date().toISOString(),
      };
      saveStore(store);
    }
    return;
  }
  if (!token) return;
  const db = getSupabaseUserClient(token);
  await db
    .from('profiles')
    .update({ behavior_profile: behaviorProfile, updated_at: new Date().toISOString() })
    .eq('user_id', userId);
}

export async function buildBehaviorProfileForUser(userId: string, token?: string): Promise<BehaviorProfile> {
  const profile =
    (await loadProfile(userId, token)) ??
    ({
      user_id: userId,
      dietary_restrictions: [],
      cuisine_preferences: [],
      allergies: [],
      household_size: 2,
      preferred_store: 'Walmart',
      gamification_level: 1,
      gamification_xp: 0,
      onboarding_complete: false,
      assistant_name: 'Sous Chef',
      last_meal_memory: {},
    } as Profile);

  const usageLogs = await loadUsageLogs(userId, token);
  const receipts = await loadReceipts(userId, token);
  const mealOutcomes = await loadMealOutcomes(userId, token);
  const ledgerEntries = await getRecentLedger(userId, token, undefined, 25);

  const behaviorProfile = inferBehaviorProfile({
    profile,
    usageLogs,
    receipts,
    mealOutcomes,
    ledgerEntries,
  });

  await persistBehaviorProfile(userId, token, behaviorProfile);
  return behaviorProfile;
}

export async function getBehaviorProfileSummary(userId: string, token?: string): Promise<BehaviorProfile> {
  const profile = await loadProfile(userId, token);
  const stored = profile?.behavior_profile as BehaviorProfile | undefined;
  if (stored?.updated_at) {
    const age = Date.now() - new Date(stored.updated_at).getTime();
    if (age < 3600000) return stored;
  }
  return buildBehaviorProfileForUser(userId, token);
}

export async function updateTimeBudget(
  userId: string,
  token: string | undefined,
  time_budget: Partial<TimeBudget>,
): Promise<BehaviorProfile> {
  const current = await getBehaviorProfileSummary(userId, token);
  const merged: BehaviorProfile = {
    ...current,
    time_budget: { ...current.time_budget, ...time_budget },
    updated_at: new Date().toISOString(),
  };
  await persistBehaviorProfile(userId, token, merged);
  return merged;
}

export async function getRhythmBundle(userId: string, token?: string) {
  const behavior_profile = await getBehaviorProfileSummary(userId, token);
  return {
    behavior_profile,
    summary: formatBehaviorProfileForPrompt(behavior_profile),
    nudges: buildRhythmNudges(behavior_profile),
  };
}
