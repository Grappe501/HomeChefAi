/**
 * KLE v7 Pillar 1 — preference + meal outcome persistence.
 */

import { v4 as uuidv4 } from 'uuid';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Profile } from '../../../../src/types/index.js';
import type {
  MealOutcome,
  MealOutcomeRating,
  PendingPreference,
  PreferenceKind,
  TastePreferenceEntry,
  TasteProfile,
} from '../../../../src/types/tasteLearning.js';
import { useDevStore, loadStore, saveStore } from '../db.js';
import { getSupabaseUserClient } from '../supabase.js';
import type { DevStore } from '../types.js';
import { logGenerationToLedger } from '../ai/ledgerStore.js';
import { inferTasteProfile } from './tasteProfileEngine.js';
import { getRecentLedger } from '../ai/ledgerStore.js';

export interface MealOutcomeInput {
  meal_name: string;
  rating: MealOutcomeRating;
  usage_log_id?: string;
  notes?: string;
}

function normalizeSubject(subject: string): string {
  return subject.trim().replace(/\s+/g, ' ').slice(0, 120);
}

function preferenceSubjectKey(subject: string, kind: PreferenceKind): string {
  return `pref:${kind}:${subject.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
}

type DevStoreExt = DevStore & {
  meal_outcomes?: MealOutcome[];
};

function getDevPreferences(userId: string): TastePreferenceEntry[] {
  const store = loadStore() as DevStoreExt;
  const profile = store.profiles.find((p) => p.user_id === userId);
  return (profile?.taste_profile as TasteProfile | undefined)?.preferences ?? [];
}

function getDevMealOutcomes(userId: string): MealOutcome[] {
  const store = loadStore() as DevStoreExt;
  return (store.meal_outcomes ?? []).filter((o) => o.user_id === userId);
}

async function loadProfile(userId: string, token?: string): Promise<Profile | null> {
  if (useDevStore()) {
    const store = loadStore();
    return store.profiles.find((p) => p.user_id === userId) ?? null;
  }
  if (!token) return null;
  const db = getSupabaseUserClient(token);
  const { data } = await db.from('profiles').select('*').eq('user_id', userId).maybeSingle();
  return (data as Profile | null) ?? null;
}

async function loadMealOutcomes(userId: string, token?: string, limit = 40): Promise<MealOutcome[]> {
  if (useDevStore()) {
    return getDevMealOutcomes(userId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, limit);
  }
  if (!token) return [];
  const db = getSupabaseUserClient(token);
  const { data } = await db
    .from('meal_outcomes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return (data ?? []) as MealOutcome[];
}

async function loadRecentMeals(userId: string, token?: string): Promise<{ name: string; at: string }[]> {
  if (useDevStore()) {
    const store = loadStore();
    return store.usage_logs
      .filter((l) => l.user_id === userId && l.meal_name)
      .sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))
      .slice(0, 20)
      .map((l) => ({ name: l.meal_name!, at: l.created_at ?? '' }));
  }
  if (!token) return [];
  const db = getSupabaseUserClient(token);
  const { data } = await db
    .from('usage_logs')
    .select('meal_name, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);
  return ((data ?? []) as { meal_name?: string; created_at?: string }[])
    .filter((r) => r.meal_name)
    .map((r) => ({ name: r.meal_name!, at: r.created_at ?? '' }));
}

async function persistTasteProfile(
  userId: string,
  token: string | undefined,
  tasteProfile: TasteProfile,
): Promise<void> {
  if (useDevStore()) {
    const store = loadStore();
    const idx = store.profiles.findIndex((p) => p.user_id === userId);
    if (idx >= 0) {
      store.profiles[idx] = {
        ...store.profiles[idx],
        taste_profile: tasteProfile as never,
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
    .update({ taste_profile: tasteProfile, updated_at: new Date().toISOString() })
    .eq('user_id', userId);
}

export async function buildTasteProfileForUser(userId: string, token?: string): Promise<TasteProfile> {
  const profile = (await loadProfile(userId, token)) ?? ({
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

  const stored = profile.taste_profile as TasteProfile | undefined;
  const preferences = stored?.preferences ?? [];
  const mealOutcomes = await loadMealOutcomes(userId, token);
  const ledgerEntries = await getRecentLedger(userId, token, undefined, 30);
  const recentMeals = await loadRecentMeals(userId, token);

  const tasteProfile = inferTasteProfile({
    profile,
    preferences,
    mealOutcomes,
    ledgerEntries,
    recentMeals,
  });

  await persistTasteProfile(userId, token, tasteProfile);
  return tasteProfile;
}

export async function savePreference(
  userId: string,
  token: string | undefined,
  input: PendingPreference & { source?: TastePreferenceEntry['source'] },
  householdId?: string,
): Promise<{ preference: TastePreferenceEntry; taste_profile: TasteProfile }> {
  const subject = normalizeSubject(input.subject);
  if (!subject) throw new Error('subject required');

  const entry: TastePreferenceEntry = {
    id: uuidv4(),
    subject,
    kind: input.kind,
    reason: input.reason?.slice(0, 240),
    member_label: input.member_label?.slice(0, 60),
    source: input.source ?? 'chat',
    created_at: new Date().toISOString(),
  };

  const profile = await loadProfile(userId, token);
  const existing = ((profile?.taste_profile as TasteProfile | undefined)?.preferences ?? []).filter(
    (p) => !(p.subject.toLowerCase() === subject.toLowerCase() && p.kind === input.kind),
  );
  existing.unshift(entry);

  if (input.kind === 'allergy' && profile) {
    const allergies = new Set(profile.allergies ?? []);
    allergies.add(subject);
    if (useDevStore()) {
      const store = loadStore();
      const idx = store.profiles.findIndex((p) => p.user_id === userId);
      if (idx >= 0) store.profiles[idx].allergies = [...allergies];
      saveStore(store);
    } else if (token) {
      const db = getSupabaseUserClient(token);
      await db.from('profiles').update({ allergies: [...allergies] }).eq('user_id', userId);
    }
  }

  if (input.kind === 'avoid' && profile) {
    const dietary = new Set(profile.dietary_restrictions ?? []);
    if (!dietary.has(subject)) {
      dietary.add(`no ${subject.toLowerCase()}`);
      if (useDevStore()) {
        const store = loadStore();
        const idx = store.profiles.findIndex((p) => p.user_id === userId);
        if (idx >= 0) store.profiles[idx].dietary_restrictions = [...dietary];
        saveStore(store);
      } else if (token) {
        const db = getSupabaseUserClient(token);
        await db.from('profiles').update({ dietary_restrictions: [...dietary] }).eq('user_id', userId);
      }
    }
  }

  const partial: TasteProfile = {
    version: 1,
    taste_vector: (profile?.taste_profile as TasteProfile | undefined)?.taste_vector ?? {
      spicy: 0.5,
      rich: 0.5,
      acidic: 0.5,
      fresh_light: 0.5,
      adventurous: 0.5,
      kid_friendly: 0.5,
      comfort: 0.5,
      quick_weeknight: 0.5,
    },
    preferences: existing,
    updated_at: new Date().toISOString(),
  };
  await persistTasteProfile(userId, token, partial);

  await logGenerationToLedger(
    userId,
    token,
    preferenceSubjectKey(subject, input.kind),
    {
      domain: 'preference',
      recommendation: `${input.kind}: ${subject}`,
      why: input.reason ?? `Chef confirmed household ${input.kind} for ${subject}.`,
      evidence: [`pref:${entry.id}`, `source:${entry.source}`],
      confidence: 0.92,
      expert_ids: ['flavor_architect'],
      metadata: { kind: input.kind, subject, member_label: input.member_label },
    },
    householdId,
  );

  const taste_profile = await buildTasteProfileForUser(userId, token);
  return { preference: entry, taste_profile };
}

export async function saveMealOutcome(
  userId: string,
  token: string | undefined,
  input: MealOutcomeInput,
): Promise<{ outcome: MealOutcome; taste_profile: TasteProfile }> {
  const meal_name = normalizeSubject(input.meal_name);
  if (!meal_name) throw new Error('meal_name required');

  const outcome: MealOutcome = {
    id: uuidv4(),
    user_id: userId,
    usage_log_id: input.usage_log_id,
    meal_name,
    rating: input.rating,
    notes: input.notes?.slice(0, 240),
    created_at: new Date().toISOString(),
  };

  if (useDevStore()) {
    const store = loadStore() as DevStoreExt;
    if (!store.meal_outcomes) store.meal_outcomes = [];
    store.meal_outcomes.push(outcome);
    saveStore(store);
  } else if (token) {
    const db = getSupabaseUserClient(token);
    await db.from('meal_outcomes').insert({
      id: outcome.id,
      user_id: userId,
      usage_log_id: input.usage_log_id ?? null,
      meal_name,
      rating: input.rating,
      notes: input.notes ?? null,
    });
  }

  await logGenerationToLedger(userId, token, `outcome:${outcome.id}`, {
    domain: 'preference',
    recommendation: `${input.rating}: ${meal_name}`,
    why: `Post-cook rating for ${meal_name}.`,
    evidence: [`outcome:${outcome.rating}`, `meal:${meal_name}`],
    confidence: 0.88,
    expert_ids: ['flavor_architect'],
    metadata: { rating: input.rating, meal_name, usage_log_id: input.usage_log_id },
  });

  const taste_profile = await buildTasteProfileForUser(userId, token);
  return { outcome, taste_profile };
}

export async function getTasteProfileSummary(userId: string, token?: string): Promise<TasteProfile> {
  return buildTasteProfileForUser(userId, token);
}

export function listPreferencesDev(userId: string): TastePreferenceEntry[] {
  return getDevPreferences(userId);
}
