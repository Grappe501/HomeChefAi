/**
 * Brain 4.0 — Proactive Kitchen Intelligence (deterministic, zero GPT).
 */

import type { InventoryItem, Profile } from '../../../../src/types/index.js';
import type { KitchenPrediction, KitchenPredictionsResult } from '../../../../src/types/kitchenPredictions.js';
import { useDevStore, loadStore } from '../db.js';
import { getSupabaseUserClient } from '../supabase.js';
import { buildHouseholdGraph } from './graphWriter.js';
import { detectHouseholdPatterns } from '../brain/patternDetectors.js';
import { getRecentLedgerDevStore, getRecentLedgerSupabase } from './ledgerStore.js';
import { processLedgerOutcomes, formatRejectHistoryForAssistant } from './outcomeProcessor.js';
import { buildMealDirections } from './reasoning.js';
import type { BrainContext } from '../brain/types.js';
import type { DecisionLedgerEntry } from './decisionLedger.js';

function expiringSoon(inventory: InventoryItem[], withinDays = 7): InventoryItem[] {
  const now = Date.now();
  const cutoff = now + withinDays * 86400000;
  return inventory.filter((i) => {
    if (!i.expiration_date) return false;
    const t = new Date(i.expiration_date).getTime();
    return !Number.isNaN(t) && t <= cutoff && t >= now - 86400000;
  });
}

async function loadContext(userId: string, token?: string) {
  let inventory: InventoryItem[] = [];
  let profile: Profile | null = null;
  let ctx: BrainContext;
  let ledgerEntries: DecisionLedgerEntry[] = [];

  if (useDevStore()) {
    const store = loadStore();
    inventory = store.inventory_items.filter((i) => i.user_id === userId);
    profile = store.profiles.find((p) => p.user_id === userId) ?? null;
    ledgerEntries = getRecentLedgerDevStore(store as never, userId, undefined, 30);
    ctx = {
      userId,
      householdId: profile?.household_id,
      receipts: store.receipts
        .filter((r) => r.user_id === userId && r.verified)
        .map((r) => ({
          id: r.id,
          verified: r.verified,
          created_at: r.created_at ?? '',
          items: (r.raw_parse as { items?: { name: string }[] })?.items ?? [],
        })),
      usageLogs: store.usage_logs
        .filter((l) => l.user_id === userId)
        .map((l) => ({
          id: l.id,
          meal_name: l.meal_name,
          items_used: l.items_used,
          created_at: l.created_at ?? '',
        })),
      wasteEvents: store.waste_events ?? [],
      cuisinePreferences: profile?.cuisine_preferences ?? [],
    };
  } else {
    if (!token) throw new Error('Missing token');
    const db = getSupabaseUserClient(token);
    const { data: items } = await db.from('inventory_items').select('*').eq('user_id', userId);
    inventory = (items ?? []) as InventoryItem[];
    const { data: prof } = await db.from('profiles').select('*').eq('user_id', userId).single();
    profile = prof as Profile;
    const { data: receipts } = await db
      .from('receipts')
      .select('id, verified, created_at, raw_parse')
      .eq('user_id', userId)
      .eq('verified', true);
    const { data: logs } = await db
      .from('usage_logs')
      .select('id, meal_name, items_used, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(40);
    ledgerEntries = await getRecentLedgerSupabase(db, userId, undefined, 30);
    ctx = {
      userId,
      householdId: profile?.household_id,
      receipts: (receipts ?? []).map((r) => ({
        id: r.id,
        verified: r.verified,
        created_at: r.created_at,
        items: (r.raw_parse as { items?: { name: string }[] })?.items ?? [],
      })),
      usageLogs: logs ?? [],
      wasteEvents: [],
      cuisinePreferences: profile?.cuisine_preferences ?? [],
    };
  }

  const invLite = inventory.map((i) => ({
    name: i.name,
    quantity: Number(i.quantity),
    knowledge_id: i.knowledge_id,
  }));

  const graphEdges = buildHouseholdGraph({
    userId,
    householdId: ctx.householdId,
    receipts: ctx.receipts,
    usageLogs: ctx.usageLogs,
    ledgerEntries,
    inventory: invLite,
    cuisinePreferences: ctx.cuisinePreferences,
  });

  const patterns = detectHouseholdPatterns({
    ...ctx,
    graphEdges,
    ledgerEntries,
    inventory: invLite,
  });

  return { inventory, profile, patterns, ledgerEntries };
}

export async function buildKitchenPredictions(
  userId: string,
  token?: string,
): Promise<KitchenPredictionsResult> {
  const { inventory, profile, patterns, ledgerEntries } = await loadContext(userId, token);
  const predictions: KitchenPrediction[] = [];
  const kitchenLabel = profile?.inferred_cooking_style?.primary_label;

  if (kitchenLabel) {
    predictions.push({
      id: 'kitchen_identity',
      type: 'kitchen_identity',
      title: 'Your kitchen style',
      message: `Clara reads this kitchen as ${kitchenLabel}. Suggestions will lean that way.`,
      priority: 85,
      evidence: profile?.inferred_cooking_style?.evidence?.slice(0, 4) ?? [],
      clara_prompt: `Plan meals that fit my ${kitchenLabel} kitchen style using what's in my pantry.`,
    });
  }

  const expiring = expiringSoon(inventory);
  if (expiring.length > 0 && profile) {
    const names = expiring.slice(0, 5).map((i) => i.name).join(', ');
    const dirResult = buildMealDirections(inventory, profile, { count: 3 });
    predictions.push({
      id: 'use_before_waste',
      type: 'use_before_waste',
      title: 'Use before waste',
      message: `${expiring.length} item${expiring.length !== 1 ? 's' : ''} expiring soon: ${names}.`,
      priority: 95,
      evidence: expiring.slice(0, 4).map((i) => `expiring:${i.name}`),
      clara_prompt: `What can I cook tonight using ${names} before they go bad?`,
      directions: dirResult.directions,
      meals: dirResult.directions.map((d) => d.title),
    });
  }

  const buyNever = patterns.find((p) => p.type === 'buy_never_use');
  if (buyNever) {
    predictions.push({
      id: buyNever.id,
      type: 'buy_never_use',
      title: buyNever.headline,
      message: buyNever.action_prompt ?? buyNever.insight,
      priority: 88,
      evidence: buyNever.evidence,
      clara_prompt: buyNever.action_prompt ?? `Help me use ${buyNever.headline.split('—')[0].trim()} this week.`,
    });
  }

  const cookNight = patterns.find((p) => p.type === 'cook_night_rhythm');
  if (cookNight && profile) {
    const dirResult = buildMealDirections(inventory, profile, { count: 3 });
    predictions.push({
      id: cookNight.id,
      type: 'cook_night',
      title: cookNight.headline,
      message: `${cookNight.insight} Here are three directions for tonight.`,
      priority: 75,
      evidence: cookNight.evidence,
      clara_prompt: 'What should I cook tonight based on my pantry?',
      directions: dirResult.directions,
      meals: dirResult.directions.map((d) => d.title),
    });
  }

  const tradition = patterns.find((p) => p.type === 'emerging_tradition');
  if (tradition) {
    predictions.push({
      id: tradition.id,
      type: 'emerging_tradition',
      title: tradition.headline,
      message: tradition.insight,
      priority: 70,
      evidence: tradition.evidence,
      clara_prompt: `Plan something similar to ${tradition.headline.split('—')[0].trim()} this week.`,
      meals: [tradition.headline.split('—')[0].trim()],
    });
  }

  const ledgerProcessed = processLedgerOutcomes(ledgerEntries, 'meal_plan');
  const rejectHint = formatRejectHistoryForAssistant(ledgerProcessed);
  if (rejectHint) {
    predictions.push({
      id: 'ledger_avoid',
      type: 'ledger_avoid',
      title: 'Meal plan feedback',
      message: rejectHint,
      priority: 80,
      evidence: ledgerProcessed.ledger_evidence,
      clara_prompt: 'Plan my week avoiding the meals I recently replaced.',
    });
  }

  if (profile && inventory.length >= 3) {
    const likely = buildMealDirections(inventory, profile, { count: 3 });
    if (likely.directions.length) {
      predictions.push({
        id: 'likely_meals',
        type: 'likely_meals',
        title: 'Likely this week',
        message: `Three directions from your pantry: ${likely.directions.map((d) => d.title).join(' · ')}`,
        priority: 65,
        evidence: likely.directions.flatMap((d) => d.evidence).slice(0, 6),
        clara_prompt: 'Give me three cooking directions from my pantry for this week.',
        directions: likely.directions,
        meals: likely.directions.map((d) => d.title),
      });
    }
  }

  const seen = new Set<string>();
  const deduped = predictions
    .filter((p) => {
      if (seen.has(p.type)) return false;
      seen.add(p.type);
      return true;
    })
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 6);

  return {
    predictions: deduped,
    kitchen_identity: kitchenLabel ?? null,
    generated_at: new Date().toISOString(),
  };
}
