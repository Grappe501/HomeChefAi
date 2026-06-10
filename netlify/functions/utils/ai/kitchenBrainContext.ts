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
import { formatTasteProfileForPrompt } from '../learning/tasteProfileEngine.js';
import { getTasteProfileSummary } from '../learning/tasteStore.js';
import { getBehaviorProfileSummary } from '../learning/behaviorStore.js';
import { formatBehaviorProfileForPrompt } from '../learning/behaviorProfileEngine.js';
import { getSkillProfileSummary } from '../learning/skillStore.js';
import { formatSkillProfileForPrompt } from '../learning/skillProfileEngine.js';
import { getIdentityProfileSummary } from '../learning/identityStore.js';
import { formatIdentityProfileForPrompt } from '../learning/identityProfileEngine.js';

export interface KitchenBrainContext {
  memory_lines: string[];
  ledger_lines: string[];
  pattern_lines: string[];
  taste_lines: string[];
  rhythm_lines: string[];
  skill_lines: string[];
  identity_lines: string[];
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
  const prefLedger = await getRecentLedger(userId, token, 'preference', 15);
  const allLedger = [...ledgerEntries, ...prefLedger];
  const outcomes = processLedgerOutcomes(allLedger, 'meal_plan');
  const prefOutcomes = processLedgerOutcomes(prefLedger, 'preference');

  const tasteProfile = await getTasteProfileSummary(userId, token);
  const tasteBlock = formatTasteProfileForPrompt(tasteProfile);
  const taste_lines = tasteBlock ? [tasteBlock] : [];

  const behaviorProfile = await getBehaviorProfileSummary(userId, token);
  const rhythmBlock = formatBehaviorProfileForPrompt(behaviorProfile);
  const rhythm_lines = rhythmBlock ? [rhythmBlock] : [];

  const skillProfile = await getSkillProfileSummary(userId, token);
  const skillBlock = formatSkillProfileForPrompt(skillProfile);
  const skill_lines = skillBlock ? [skillBlock] : [];

  const identityProfile = await getIdentityProfileSummary(userId, token);
  const identityBlock = formatIdentityProfileForPrompt(identityProfile);
  const identity_lines = identityBlock ? [identityBlock] : [];

  const memory_lines = memories.map(
    (m) => `Memory (${m.memory_type}): ${m.headline ?? m.content?.slice(0, 120) ?? m.id}`,
  );

  if (profile?.household_display_name && !identity_lines.length) {
    memory_lines.unshift(`Kitchen: ${profile.household_display_name}.`);
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
  if (prefOutcomes.prefers_tags.length) {
    ledger_lines.push(`Household prefers: ${prefOutcomes.prefers_tags.slice(0, 6).join(', ')}.`);
  }
  if (prefOutcomes.avoids_tags.length) {
    ledger_lines.push(`Household avoids: ${prefOutcomes.avoids_tags.slice(0, 6).join(', ')}.`);
  }

  const pattern_lines = await loadPatternHighlights(userId, profile, inventory, allLedger);

  const evidence = [
    ...memories.slice(0, 3).map((m) => `memory:${m.id}`),
    ...outcomes.ledger_evidence.slice(0, 4),
    ...(taste_lines.length ? ['taste_profile:v7'] : []),
    ...(rhythm_lines.length ? ['behavior_profile:v7'] : []),
    ...(skill_lines.length ? ['skill_profile:v7'] : []),
    ...(identity_lines.length ? ['identity_profile:v7'] : []),
  ];

  return {
    memory_lines,
    ledger_lines,
    pattern_lines,
    taste_lines,
    rhythm_lines,
    skill_lines,
    identity_lines,
    prefers_tags: [...new Set([...outcomes.prefers_tags, ...prefOutcomes.prefers_tags])],
    avoids_tags: [...new Set([...outcomes.avoids_tags, ...prefOutcomes.avoids_tags])],
    evidence,
  };
}

export function formatKitchenBrainContextForPrompt(ctx: KitchenBrainContext): string {
  const lines = [
    ...ctx.memory_lines,
    ...ctx.taste_lines,
    ...ctx.rhythm_lines,
    ...ctx.skill_lines,
    ...ctx.identity_lines,
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
  if (ctx.rhythm_lines.length) {
    parts.push(ctx.rhythm_lines.join(' '));
  }
  if (ctx.skill_lines.length) {
    parts.push(ctx.skill_lines.join(' '));
  }
  if (ctx.identity_lines.length) {
    parts.push(ctx.identity_lines.join(' '));
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
