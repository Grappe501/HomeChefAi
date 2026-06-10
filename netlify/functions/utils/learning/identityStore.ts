/**
 * KLE v7 Pillar 4 — identity profile persistence.
 */

import type { Profile } from '../../../../src/types/index.js';
import type { InventoryItem } from '../../../../src/types/index.js';
import type { IdentityProfile } from '../../../../src/types/identityLearning.js';
import { useDevStore, loadStore, saveStore } from '../db.js';
import { getSupabaseUserClient } from '../supabase.js';
import { getRecentLedger } from '../ai/ledgerStore.js';
import { buildHouseholdGraph } from '../ai/graphWriter.js';
import { detectHouseholdPatterns } from '../brain/patternDetectors.js';
import {
  inferIdentityProfile,
  formatIdentityProfileForPrompt,
  buildIdentityNudges,
  identityGraphPayload,
} from './identityProfileEngine.js';
import { getTasteProfileSummary } from './tasteStore.js';
import { getBehaviorProfileSummary } from './behaviorStore.js';
import { getSkillProfileSummary } from './skillStore.js';

async function loadProfile(userId: string, token?: string): Promise<Profile | null> {
  if (useDevStore()) {
    return loadStore().profiles.find((p) => p.user_id === userId) ?? null;
  }
  if (!token) return null;
  const db = getSupabaseUserClient(token);
  const { data } = await db.from('profiles').select('*').eq('user_id', userId).maybeSingle();
  return (data as Profile | null) ?? null;
}

async function loadInventory(userId: string, token?: string): Promise<InventoryItem[]> {
  if (useDevStore()) {
    return loadStore().inventory_items.filter((i) => i.user_id === userId);
  }
  if (!token) return [];
  const db = getSupabaseUserClient(token);
  const { data } = await db.from('inventory_items').select('*').eq('user_id', userId).limit(120);
  return (data ?? []) as InventoryItem[];
}

async function loadUsageLogs(userId: string, token?: string) {
  if (useDevStore()) {
    return loadStore()
      .usage_logs.filter((l) => l.user_id === userId)
      .map((l) => ({
        id: l.id,
        meal_name: l.meal_name,
        items_used: l.items_used,
        created_at: l.created_at ?? '',
      }));
  }
  if (!token) return [];
  const db = getSupabaseUserClient(token);
  const { data } = await db
    .from('usage_logs')
    .select('id, meal_name, items_used, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(60);
  return (data ?? []) as {
    id: string;
    meal_name?: string;
    items_used?: { name: string }[];
    created_at: string;
  }[];
}

async function loadReceipts(userId: string, token?: string) {
  if (useDevStore()) {
    return loadStore()
      .receipts.filter((r) => r.user_id === userId && r.verified !== false)
      .map((r) => ({
        id: r.id,
        items: (r.raw_parse as { items?: { name: string }[] })?.items ?? [],
        verified: r.verified,
      }));
  }
  if (!token) return [];
  const db = getSupabaseUserClient(token);
  const { data } = await db
    .from('receipts')
    .select('id, verified, raw_parse')
    .eq('user_id', userId)
    .eq('verified', true)
    .limit(40);
  return (data ?? []).map((r) => ({
    id: r.id as string,
    items: ((r.raw_parse as { items?: { name: string }[] })?.items ?? []),
    verified: r.verified as boolean,
  }));
}

async function persistIdentityProfile(
  userId: string,
  token: string | undefined,
  identityProfile: IdentityProfile,
  kitchenIdentity: Record<string, unknown>,
  inferredCookingStyle: Record<string, unknown>,
): Promise<void> {
  if (useDevStore()) {
    const store = loadStore();
    const idx = store.profiles.findIndex((p) => p.user_id === userId);
    if (idx >= 0) {
      store.profiles[idx] = {
        ...store.profiles[idx],
        identity_profile: identityProfile as never,
        kitchen_identity: kitchenIdentity as never,
        inferred_cooking_style: inferredCookingStyle as never,
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
    .update({
      identity_profile: identityProfile,
      kitchen_identity: kitchenIdentity,
      inferred_cooking_style: inferredCookingStyle,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);
}

export async function buildIdentityProfileForUser(userId: string, token?: string): Promise<IdentityProfile> {
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

  const [inventory, usageLogs, receipts, ledgerEntries, tasteProfile, behaviorProfile, skillProfile] =
    await Promise.all([
      loadInventory(userId, token),
      loadUsageLogs(userId, token),
      loadReceipts(userId, token),
      getRecentLedger(userId, token, undefined, 30),
      getTasteProfileSummary(userId, token),
      getBehaviorProfileSummary(userId, token),
      getSkillProfileSummary(userId, token),
    ]);

  const invLite = inventory.map((i) => ({
    name: i.name,
    quantity: Number(i.quantity),
    knowledge_id: i.knowledge_id,
    created_at: i.created_at,
  }));

  const graphEdges = buildHouseholdGraph({
    userId,
    householdId: profile.household_id,
    receipts,
    usageLogs,
    ledgerEntries,
    inventory: invLite,
    cuisinePreferences: profile.cuisine_preferences ?? [],
  });

  const patterns = detectHouseholdPatterns({
    userId,
    householdId: profile.household_id,
    receipts: [],
    usageLogs,
    wasteEvents: [],
    cuisinePreferences: profile.cuisine_preferences ?? [],
    graphEdges,
    ledgerEntries,
    inventory: invLite,
  });

  const source = {
    profile,
    graphEdges,
    patterns,
    ledgerEntries,
    tasteProfile,
    behaviorProfile,
    skillProfile,
  };

  const identityProfile = inferIdentityProfile(source);
  const graphIdentity = identityGraphPayload(identityProfile, source);

  await persistIdentityProfile(
    userId,
    token,
    identityProfile,
    graphIdentity.kitchen_identity as Record<string, unknown>,
    graphIdentity.inferred_cooking_style as Record<string, unknown>,
  );

  return identityProfile;
}

export async function getIdentityProfileSummary(userId: string, token?: string): Promise<IdentityProfile> {
  const profile = await loadProfile(userId, token);
  const stored = profile?.identity_profile as IdentityProfile | undefined;
  if (stored?.updated_at) {
    const age = Date.now() - new Date(stored.updated_at).getTime();
    if (age < 3600000) return stored;
  }
  return buildIdentityProfileForUser(userId, token);
}

export async function getIdentityBundle(userId: string, token?: string) {
  const identity_profile = await getIdentityProfileSummary(userId, token);
  return {
    identity_profile,
    summary: formatIdentityProfileForPrompt(identity_profile),
    nudges: buildIdentityNudges(identity_profile),
  };
}
