/**
 * AI Impact Suite v5 — unified household intelligence for every AI surface.
 * Connects brain memories, ledger learning, patterns, and proactive signals.
 */

import type { InventoryItem, Profile } from '../../../../src/types/index.js';
import { useDevStore, loadStore } from '../db.js';
import { getSupabaseUserClient } from '../supabase.js';
import type { StoredMemory } from '../brain/types.js';
import type { DevStore } from '../types.js';
import { getRecentLedger } from './ledgerStore.js';
import { processLedgerOutcomes, formatRejectHistoryForAssistant } from './outcomeProcessor.js';
import { detectHouseholdPatterns } from '../brain/patternDetectors.js';
import { buildHouseholdGraph } from './graphWriter.js';
import type { DecisionLedgerEntry } from './decisionLedger.js';

export interface KitchenBrainContext {
  memory_lines: string[];
  ledger_lines: string[];
  pattern_lines: string[];
  prefers_tags: string[];
  avoids_tags: string[];
  evidence: string[];
}

async function loadSurfacedMemories(userId: string, token?: string): Promise<StoredMemory[]> {
  if (useDevStore()) {
    const store = loadStore() as DevStore & { household_memories?: StoredMemory[] };
    return (store.household_memories ?? [])
      .filter((m) => m.user_id === userId && m.surfaced)
      .sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0))
      .slice(0, 6);
  }
  if (!token) return [];
  const db = getSupabaseUserClient(token);
  const { data } = await db
    .from('household_memories')
    .select('*')
    .eq('user_id', userId)
    .eq('surfaced', true)
    .order('confidence', { ascending: false })
    .limit(6);
  return (data ?? []) as StoredMemory[];
}

async function loadPatternHighlights(
  userId: string,
  profile: Profile | null,
  inventory: InventoryItem[],
  ledgerEntries: DecisionLedgerEntry[],
): Promise<string[]> {
  const invLite = inventory.map((i) => ({
    name: i.name,
    quantity: Number(i.quantity),
    knowledge_id: i.knowledge_id,
  }));

  const ctx = {
    userId,
    householdId: profile?.household_id,
    receipts: [],
    usageLogs: useDevStore()
      ? loadStore().usage_logs
          .filter((l) => l.user_id === userId)
          .map((l) => ({
            id: l.id,
            meal_name: l.meal_name,
            items_used: l.items_used,
            created_at: l.created_at ?? '',
          }))
      : [],
    wasteEvents: [],
    cuisinePreferences: profile?.cuisine_preferences ?? [],
    graphEdges: buildHouseholdGraph({
      userId,
      householdId: profile?.household_id,
      receipts: [],
      usageLogs: [],
      ledgerEntries,
      inventory: invLite,
      cuisinePreferences: profile?.cuisine_preferences ?? [],
    }),
    ledgerEntries,
    inventory: invLite,
  };

  const patterns = detectHouseholdPatterns(ctx);
  return patterns.slice(0, 4).map((p) => `${p.headline}: ${p.insight}`);
}

export async function buildKitchenBrainContext(
  userId: string,
  token: string | undefined,
  inventory: InventoryItem[],
  profile: Profile | null,
): Promise<KitchenBrainContext> {
  const memories = await loadSurfacedMemories(userId, token);
  const ledgerEntries = await getRecentLedger(userId, token, 'meal_plan', 20);
  const outcomes = processLedgerOutcomes(ledgerEntries, 'meal_plan');

  const memory_lines = memories.map(
    (m) => `Memory (${m.memory_type}): ${m.headline ?? m.content?.slice(0, 120) ?? m.id}`,
  );

  if (profile?.inferred_cooking_style?.primary_label) {
    memory_lines.unshift(`Kitchen identity: ${profile.inferred_cooking_style.primary_label}.`);
  }

  const ledger_lines: string[] = [];
  const rejectHint = formatRejectHistoryForAssistant(outcomes);
  if (rejectHint) ledger_lines.push(rejectHint);
  if (outcomes.kept_meals.length) {
    ledger_lines.push(`Chef kept these meals: ${outcomes.kept_meals.slice(0, 4).join('; ')}.`);
  }
  if (outcomes.prefers_tags.length) {
    ledger_lines.push(`Prefer meal styles: ${outcomes.prefers_tags.join(', ')}.`);
  }
  if (outcomes.avoids_tags.length) {
    ledger_lines.push(`Avoid meal styles: ${outcomes.avoids_tags.join(', ')}.`);
  }

  const pattern_lines = await loadPatternHighlights(userId, profile, inventory, ledgerEntries);

  const evidence = [
    ...memories.slice(0, 3).map((m) => `memory:${m.id}`),
    ...outcomes.ledger_evidence.slice(0, 4),
  ];

  return {
    memory_lines,
    ledger_lines,
    pattern_lines,
    prefers_tags: outcomes.prefers_tags,
    avoids_tags: outcomes.avoids_tags,
    evidence,
  };
}

export function formatKitchenBrainContextForPrompt(ctx: KitchenBrainContext): string {
  const lines = [
    ...ctx.memory_lines,
    ...ctx.ledger_lines,
    ...ctx.pattern_lines,
  ].filter(Boolean);
  if (!lines.length) return '';
  return ['Household intelligence (use this — do not ignore):', ...lines].join('\n');
}

export function formatPlannerTagDirectives(ctx: KitchenBrainContext): string {
  const parts: string[] = [];
  if (ctx.prefers_tags.length) {
    parts.push(`Favor tags/types: ${ctx.prefers_tags.join(', ')}.`);
  }
  if (ctx.avoids_tags.length) {
    parts.push(`Avoid repeating these styles/meals Chef replaced: ${ctx.avoids_tags.join(', ')}.`);
  }
  if (ctx.memory_lines.length) {
    parts.push(ctx.memory_lines.slice(0, 3).join(' '));
  }
  return parts.join('\n');
}

export async function buildPlannerIntelligenceFeedback(
  userId: string,
  token: string | undefined,
  inventory: InventoryItem[],
  profile: Profile | null,
  ledgerEntries: DecisionLedgerEntry[],
): Promise<string> {
  const { formatLedgerSummaryForPlanner } = await import('./ledgerStore.js');
  const brain = await buildKitchenBrainContext(userId, token, inventory, profile);
  return [
    formatLedgerSummaryForPlanner(ledgerEntries),
    formatPlannerTagDirectives(brain),
    formatKitchenBrainContextForPrompt(brain),
  ]
    .filter(Boolean)
    .join('\n\n');
}
