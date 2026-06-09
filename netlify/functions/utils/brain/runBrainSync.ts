import type { SupabaseClient } from '@supabase/supabase-js';
import { generateMemories } from './memoryGenerator.js';
import type { BrainContext, BrainReceipt, BrainWasteEvent, StoredMemory } from './types.js';
import { normalizeKey } from './types.js';
import type { DevStore } from '../types.js';

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

export async function runBrainSyncSupabase(db: SupabaseClient, scope: BrainScope): Promise<number> {
  const ctx = await loadBrainContextSupabase(db, scope);
  const generated = generateMemories(ctx);
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
      { onConflict: 'user_id,memory_type,subject_key' }
    );
  }
  await syncConsumptionCyclesSupabase(db, scope, ctx);
  return generated.filter((m) => m.surfaced).length;
}

export function runBrainSyncDevStore(
  store: DevStore & {
    household_memories?: StoredMemory[];
    waste_events?: BrainWasteEvent[];
  },
  scope: BrainScope
): number {
  const ctx = loadBrainContextDevStore(store, scope);
  const generated = generateMemories(ctx);
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
  return generated.filter((m) => m.surfaced).length;
}

async function loadBrainContextSupabase(db: SupabaseClient, scope: BrainScope): Promise<BrainContext> {
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
    .select('id, meal_name, created_at')
    .eq('user_id', scope.userId)
    .order('created_at', { ascending: true });

  const { data: waste } = await db
    .from('waste_events')
    .select('id, item_name, item_key, created_at')
    .eq('user_id', scope.userId)
    .order('created_at', { ascending: true });

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
    userId: scope.userId,
    householdId,
    receipts: brainReceipts,
    usageLogs: logs ?? [],
    wasteEvents: waste ?? [],
    cuisinePreferences: (profile?.cuisine_preferences as string[]) ?? [],
  };
}

function loadBrainContextDevStore(
  store: DevStore & { waste_events?: BrainWasteEvent[] },
  scope: BrainScope
): BrainContext {
  const profile = store.profiles.find((p) => p.user_id === scope.userId);
  const receipts: BrainReceipt[] = store.receipts
    .filter((r) => r.user_id === scope.userId && r.verified)
    .map((r) => ({
      id: r.id,
      store_name: r.store_name,
      receipt_date: r.receipt_date,
      verified: r.verified,
      created_at: r.created_at,
      items: (r.raw_parse as { items?: { name: string; quantity?: number }[] })?.items ?? [],
    }));

  return {
    userId: scope.userId,
    householdId: scope.householdId || profile?.household_id,
    receipts,
    usageLogs: store.usage_logs.filter((l) => l.user_id === scope.userId),
    wasteEvents: store.waste_events ?? [],
    cuisinePreferences: profile?.cuisine_preferences ?? [],
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
