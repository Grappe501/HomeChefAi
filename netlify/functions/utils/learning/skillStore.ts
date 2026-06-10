/**
 * KLE v7 Pillar 3 — skill profile persistence.
 */

import type { Profile } from '../../../../src/types/index.js';
import type { SkillProfile } from '../../../../src/types/skillLearning.js';
import type { MealOutcome } from '../../../../src/types/tasteLearning.js';
import { useDevStore, loadStore, saveStore } from '../db.js';
import { getSupabaseUserClient } from '../supabase.js';
import type { SkillProgressRow } from '../ai/skillJourneyStore.js';
import {
  inferSkillProfile,
  formatSkillProfileForPrompt,
  buildSkillGrowthNudges,
} from './skillProfileEngine.js';

async function loadSkillProgress(userId: string, token?: string): Promise<SkillProgressRow[]> {
  if (useDevStore()) {
    const store = loadStore() as { skill_journey_progress?: SkillProgressRow[] };
    return (store.skill_journey_progress ?? []).filter((r) => r.user_id === userId);
  }
  if (!token) return [];
  const db = getSupabaseUserClient(token);
  const { data } = await db.from('skill_journey_progress').select('*').eq('user_id', userId).limit(80);
  return (data ?? []) as SkillProgressRow[];
}

async function loadUsageLogs(userId: string, token?: string, limit = 60) {
  if (useDevStore()) {
    return loadStore()
      .usage_logs.filter((l) => l.user_id === userId)
      .sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))
      .slice(0, limit)
      .map((l) => ({
        id: l.id,
        meal_name: l.meal_name,
        technique_ids: (l as { technique_ids?: string[] }).technique_ids,
        items_used: l.items_used,
        created_at: l.created_at ?? '',
      }));
  }
  if (!token) return [];
  const db = getSupabaseUserClient(token);
  const { data } = await db
    .from('usage_logs')
    .select('id, meal_name, technique_ids, items_used, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return (data ?? []) as {
    id: string;
    meal_name?: string;
    technique_ids?: string[];
    items_used?: { name: string }[];
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

async function persistSkillProfile(
  userId: string,
  token: string | undefined,
  skillProfile: SkillProfile,
): Promise<void> {
  if (useDevStore()) {
    const store = loadStore();
    const idx = store.profiles.findIndex((p) => p.user_id === userId);
    if (idx >= 0) {
      store.profiles[idx] = {
        ...store.profiles[idx],
        skill_profile: skillProfile as never,
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
    .update({ skill_profile: skillProfile, updated_at: new Date().toISOString() })
    .eq('user_id', userId);
}

export async function buildSkillProfileForUser(userId: string, token?: string): Promise<SkillProfile> {
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

  const progressRows = await loadSkillProgress(userId, token);
  const usageLogs = await loadUsageLogs(userId, token);
  const mealOutcomes = await loadMealOutcomes(userId, token);

  const skillProfile = inferSkillProfile({ profile, progressRows, usageLogs, mealOutcomes });
  await persistSkillProfile(userId, token, skillProfile);
  return skillProfile;
}

export async function getSkillProfileSummary(userId: string, token?: string): Promise<SkillProfile> {
  const profile = await loadProfile(userId, token);
  const stored = profile?.skill_profile as SkillProfile | undefined;
  if (stored?.updated_at) {
    const age = Date.now() - new Date(stored.updated_at).getTime();
    if (age < 3600000) return stored;
  }
  return buildSkillProfileForUser(userId, token);
}

export async function getSkillGrowthBundle(userId: string, token?: string) {
  const skill_profile = await getSkillProfileSummary(userId, token);
  return {
    skill_profile,
    summary: formatSkillProfileForPrompt(skill_profile),
    nudges: buildSkillGrowthNudges(skill_profile),
  };
}
