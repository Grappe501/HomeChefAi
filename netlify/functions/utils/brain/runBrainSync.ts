import type { SupabaseClient } from '@supabase/supabase-js';
import { generateMemories } from './memoryGenerator.js';
import { detectHouseholdPatterns, patternsToMemories } from './patternDetectors.js';
import { inferHouseholdIdentity } from './householdIdentity.js';
import type { BrainContext, BrainReceipt, BrainWasteEvent, StoredMemory } from './types.js';
import { normalizeKey } from './types.js';
import type { DevStore, HouseholdGraphEdgeRow } from '../types.js';
import { buildHouseholdGraph } from '../ai/graphWriter.js';
import { getRecentLedgerDevStore, getRecentLedgerSupabase } from '../ai/ledgerStore.js';
import type { DecisionLedgerEntry } from '../ai/decisionLedger.js';

export interface BrainScope {
  userId: string;
  householdId?: string;
}

export async function recordWasteEventSupabase(
  db: SupabaseClient,
  scope: BrainScope,
  item: { id?: string; name: string; quantity?: number }
): Promise<void> {
  await db.from('waste_events').insert({
    user_id: scope.userId,
    household_id: scope.householdId || null,
    item_name: item.name,
    item_key: normalizeKey(item.name),
    quantity: item.quantity ?? 1,
    reason: 'discarded',
    inventory_item_id: item.id || null,
  });
}

export function recordWasteEventDevStore(
  store: DevStore & { waste_events?: BrainWasteEvent[] },
  scope: BrainScope,
  item: { id?: string; name: string }
): void {
  if (!store.waste_events) store.waste_events = [];
  store.waste_events.push({
    id: crypto.randomUUID(),
    item_name: item.name,
    item_key: normalizeKey(item.name),
    created_at: new Date().toISOString(),
  });
}

function dedupeMemories(memories: ReturnType<typeof generateMemories>): ReturnType<typeof generateMemories> {
  const seen = new Set<string>();
  return memories.filter((m) => {
    const key = `${m.memory_type}:${m.subject_key}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function persistGraphEdgesSupabase(
  db: SupabaseClient,
  scope: BrainScope,
  edges: ReturnType<typeof buildHouseholdGraph>,
): Promise<void> {
  for (const edge of edges.slice(0, 120)) {
    await db.from('household_graph_edges').upsert(
      {
        user_id: scope.userId,
        household_id: scope.householdId || null,
        edge_type: edge.edge_type,
        from_key: edge.from_key,
        to_key: edge.to_key,
        weight: edge.weight,
        evidence: edge.evidence,
        metadata: edge.metadata ?? {},
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,edge_type,from_key,to_key' },
    );
  }
}

function persistGraphEdgesDevStore(
  store: DevStore & { household_graph_edges?: HouseholdGraphEdgeRow[] },
  scope: BrainScope,
  edges: ReturnType<typeof buildHouseholdGraph>,
): void {
  if (!store.household_graph_edges) store.household_graph_edges = [];
  for (const edge of edges.slice(0, 120)) {
    const idx = store.household_graph_edges.findIndex(
      (e) =>
        e.user_id === scope.userId &&
        e.edge_type === edge.edge_type &&
        e.from_key === edge.from_key &&
        e.to_key === edge.to_key,
    );
    const row: HouseholdGraphEdgeRow = {
      id: idx >= 0 ? store.household_graph_edges[idx].id : crypto.randomUUID(),
      user_id: scope.userId,
      household_id: scope.householdId,
      edge_type: edge.edge_type,
      from_key: edge.from_key,
      to_key: edge.to_key,
      weight: edge.weight,
      evidence: edge.evidence,
      metadata: edge.metadata,
      updated_at: new Date().toISOString(),
    };
    if (idx >= 0) store.household_graph_edges[idx] = row;
    else store.household_graph_edges.push(row);
  }
}

async function updateProfileIdentitySupabase(
  db: SupabaseClient,
  userId: string,
  kitchen_identity: Record<string, unknown>,
  inferred_cooking_style: Record<string, unknown>,
): Promise<void> {
  await db
    .from('profiles')
    .update({ kitchen_identity, inferred_cooking_style, updated_at: new Date().toISOString() })
    .eq('user_id', userId);
}

function updateProfileIdentityDevStore(
  store: DevStore,
  userId: string,
  kitchen_identity: Record<string, unknown>,
  inferred_cooking_style: Record<string, unknown>,
): void {
  const idx = store.profiles.findIndex((p) => p.user_id === userId);
  if (idx < 0) return;
  store.profiles[idx] = {
    ...store.profiles[idx],
    kitchen_identity: kitchen_identity as never,
    inferred_cooking_style: inferred_cooking_style as never,
  };
}

export async function runBrainSyncSupabase(db: SupabaseClient, scope: BrainScope): Promise<number> {
  const { ctx, ledgerEntries, inventory } = await loadBrainContextSupabase(db, scope);
  const graphEdges = buildHouseholdGraph({
    userId: scope.userId,
    householdId: scope.householdId,
    receipts: ctx.receipts,
    usageLogs: ctx.usageLogs,
    ledgerEntries,
    inventory,
    cuisinePreferences: ctx.cuisinePreferences,
  });

  const patterns = detectHouseholdPatterns({ ...ctx, graphEdges, ledgerEntries, inventory });
  const generated = dedupeMemories([
    ...generateMemories(ctx),
    ...patternsToMemories(patterns),
  ]);

  for (const mem of generated) {
    await db.from('household_memories').upsert(
      {
        user_id: scope.userId,
        household_id: scope.householdId || null,
        memory_type: mem.memory_type,
        subject_key: mem.subject_key,
        headline: mem.headline,
        insight: mem.insight,
        action_prompt: mem.action_prompt || null,
        confidence: mem.confidence,
        metadata: mem.metadata,
        surfaced: mem.surfaced,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,memory_type,subject_key' },
    );
  }

  await syncConsumptionCyclesSupabase(db, scope, ctx);
  await persistGraphEdgesSupabase(db, scope, graphEdges);

  const identity = inferHouseholdIdentity({
    cuisinePreferences: ctx.cuisinePreferences,
    graphEdges,
    patterns,
    ledgerKeptCount: ledgerEntries.filter((e) => e.outcome === 'accepted').length,
  });
  await updateProfileIdentitySupabase(db, scope.userId, identity.kitchen_identity, identity.inferred_cooking_style);

  return generated.filter((m) => m.surfaced).length;
}

export function runBrainSyncDevStore(
  store: DevStore & {
    household_memories?: StoredMemory[];
    waste_events?: BrainWasteEvent[];
    household_graph_edges?: HouseholdGraphEdgeRow[];
    decision_ledger?: import('../types.js').DecisionLedgerRow[];
  },
  scope: BrainScope
): number {
  const { ctx, ledgerEntries, inventory } = loadBrainContextDevStore(store, scope);
  const graphEdges = buildHouseholdGraph({
    userId: scope.userId,
    householdId: scope.householdId,
    receipts: ctx.receipts,
    usageLogs: ctx.usageLogs,
    ledgerEntries,
    inventory,
    cuisinePreferences: ctx.cuisinePreferences,
  });

  const patterns = detectHouseholdPatterns({ ...ctx, graphEdges, ledgerEntries, inventory });
  const generated = dedupeMemories([
    ...generateMemories(ctx),
    ...patternsToMemories(patterns),
  ]);

  if (!store.household_memories) store.household_memories = [];

  for (const mem of generated) {
    const idx = store.household_memories.findIndex(
      (m) => m.memory_type === mem.memory_type && m.subject_key === mem.subject_key
    );
    const row: StoredMemory = {
      ...mem,
      id: idx >= 0 ? store.household_memories[idx].id : crypto.randomUUID(),
      user_id: scope.userId,
      household_id: scope.householdId,
      created_at: idx >= 0 ? store.household_memories[idx].created_at : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    if (idx >= 0) store.household_memories[idx] = row;
    else store.household_memories.push(row);
  }

  persistGraphEdgesDevStore(store, scope, graphEdges);

  const identity = inferHouseholdIdentity({
    cuisinePreferences: ctx.cuisinePreferences,
    graphEdges,
    patterns,
    ledgerKeptCount: ledgerEntries.filter((e) => e.outcome === 'accepted').length,
  });
  updateProfileIdentityDevStore(store, scope.userId, identity.kitchen_identity, identity.inferred_cooking_style);

  return generated.filter((m) => m.surfaced).length;
}

async function loadBrainContextSupabase(
  db: SupabaseClient,
  scope: BrainScope,
): Promise<{ ctx: BrainContext; ledgerEntries: DecisionLedgerEntry[]; inventory: { name: string; knowledge_id?: string; created_at?: string }[] }> {
  const { data: profile } = await db.from('profiles').select('cuisine_preferences, household_id').eq('user_id', scope.userId).single();
  const householdId = scope.householdId || profile?.household_id || undefined;

  const { data: receipts } = await db
    .from('receipts')
    .select('id, store_name, receipt_date, verified, created_at, raw_parse')
    .eq('user_id', scope.userId)
    .eq('verified', true)
    .order('created_at', { ascending: true });

  const { data: logs } = await db
    .from('usage_logs')
    .select('id, meal_name, items_used, created_at')
    .eq('user_id', scope.userId)
    .order('created_at', { ascending: true });

  const { data: waste } = await db
    .from('waste_events')
    .select('id, item_name, item_key, created_at')
    .eq('user_id', scope.userId)
    .order('created_at', { ascending: true });

  const { data: items } = await db
    .from('inventory_items')
    .select('name, knowledge_id, created_at')
    .eq('user_id', scope.userId);

  const ledgerEntries = await getRecentLedgerSupabase(db, scope.userId, undefined, 40);

  const brainReceipts: BrainReceipt[] = (receipts ?? []).map((r) => {
    const parsed = r.raw_parse as { items?: { name: string; quantity?: number }[] } | null;
    return {
      id: r.id,
      store_name: r.store_name,
      receipt_date: r.receipt_date,
      verified: r.verified,
      created_at: r.created_at,
      items: parsed?.items ?? [],
    };
  });

  return {
    ctx: {
      userId: scope.userId,
      householdId,
      receipts: brainReceipts,
      usageLogs: logs ?? [],
      wasteEvents: waste ?? [],
      cuisinePreferences: (profile?.cuisine_preferences as string[]) ?? [],
    },
    ledgerEntries,
    inventory: (items ?? []).map((i) => ({
      name: i.name,
      knowledge_id: i.knowledge_id ?? undefined,
      created_at: i.created_at ?? undefined,
    })),
  };
}

function loadBrainContextDevStore(
  store: DevStore & { waste_events?: BrainWasteEvent[]; decision_ledger?: import('../types.js').DecisionLedgerRow[] },
  scope: BrainScope,
): { ctx: BrainContext; ledgerEntries: DecisionLedgerEntry[]; inventory: { name: string; knowledge_id?: string; created_at?: string }[] } {
  const profile = store.profiles.find((p) => p.user_id === scope.userId);
  const receipts: BrainReceipt[] = store.receipts
    .filter((r) => r.user_id === scope.userId && r.verified)
    .map((r) => ({
      id: r.id,
      store_name: r.store_name,
      receipt_date: r.receipt_date,
      verified: r.verified,
      created_at: r.created_at ?? new Date().toISOString(),
      items: (r.raw_parse as { items?: { name: string; quantity?: number }[] })?.items ?? [],
    }));

  const ledgerRows = getRecentLedgerDevStore(store as never, scope.userId, undefined, 40);

  return {
    ctx: {
      userId: scope.userId,
      householdId: scope.householdId || profile?.household_id,
      receipts,
      usageLogs: store.usage_logs
        .filter((l) => l.user_id === scope.userId)
        .map((l) => ({
          id: l.id,
          meal_name: l.meal_name,
          items_used: l.items_used,
          created_at: l.created_at ?? new Date().toISOString(),
        })),
      wasteEvents: store.waste_events ?? [],
      cuisinePreferences: profile?.cuisine_preferences ?? [],
    },
    ledgerEntries: ledgerRows,
    inventory: store.inventory_items
      .filter((i) => i.user_id === scope.userId)
      .map((i) => ({ name: i.name, knowledge_id: i.knowledge_id, created_at: i.created_at })),
  };
}

async function syncConsumptionCyclesSupabase(db: SupabaseClient, scope: BrainScope, ctx: BrainContext): Promise<void> {
  const itemPurchases = new Map<string, { name: string; dates: Date[]; receiptIds: string[] }>();
  for (const receipt of ctx.receipts) {
    const d = new Date(receipt.receipt_date || receipt.created_at);
    for (const item of receipt.items) {
      const key = normalizeKey(item.name);
      const entry = itemPurchases.get(key) || { name: item.name, dates: [], receiptIds: [] };
      entry.dates.push(d);
      entry.receiptIds.push(receipt.id);
      itemPurchases.set(key, entry);
    }
  }

  for (const [key, data] of itemPurchases) {
    if (data.dates.length < 2) continue;
    data.dates.sort((a, b) => a.getTime() - b.getTime());
    let avg: number | null = null;
    if (data.dates.length >= 2) {
      const gaps = [];
      for (let i = 1; i < data.dates.length; i++) {
        gaps.push((data.dates[i].getTime() - data.dates[i - 1].getTime()) / 86400000);
      }
      avg = gaps.reduce((s, g) => s + g, 0) / gaps.length;
    }
    await db.from('consumption_cycles').upsert(
      {
        user_id: scope.userId,
        household_id: scope.householdId || null,
        item_name: data.name,
        item_key: key,
        purchase_count: data.dates.length,
        avg_cycle_days: avg,
        last_purchase_at: data.dates[data.dates.length - 1].toISOString(),
        first_purchase_at: data.dates[0].toISOString(),
        source_receipt_ids: data.receiptIds,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,item_key' }
    );
  }
}

export async function getBrainScopeSupabase(db: SupabaseClient, userId: string): Promise<BrainScope> {
  const { data: profile } = await db.from('profiles').select('household_id').eq('user_id', userId).single();
  return { userId, householdId: profile?.household_id || undefined };
}

export function getBrainScopeDevStore(store: DevStore, userId: string): BrainScope {
  const profile = store.profiles.find((p) => p.user_id === userId);
  return { userId, householdId: profile?.household_id };
}
