/**
 * Inventory Steward Phase 1 — reconcile, audit, delta apply (deterministic core).
 */

import { v4 as uuidv4 } from 'uuid';
import type { InventoryItem } from '../../../../src/types/index.js';
import type {
  AuditFinding,
  DuplicateGroup,
  InventoryDelta,
  LowStockItem,
  MislocationSuggestion,
  StewardPreview,
} from '../../../../src/types/inventorySteward.js';
import { inferWizardItemLocation } from '../../../../src/types/index.js';
import { normalizeInventoryName, normalizeLocation } from '../inventoryNormalize.js';
import { useDevStore, loadStore, saveStore } from '../db.js';
import { getSupabaseUserClient } from '../supabase.js';
import { logGenerationToLedger } from '../ai/ledgerStore.js';

function normalizeKey(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function tokenOverlap(a: string, b: string): number {
  const ta = new Set(normalizeKey(a).split('_').filter((t) => t.length > 2));
  const tb = new Set(normalizeKey(b).split('_').filter((t) => t.length > 2));
  if (!ta.size || !tb.size) return 0;
  let shared = 0;
  for (const t of ta) if (tb.has(t)) shared++;
  return shared / Math.max(ta.size, tb.size);
}

export function findDuplicateGroups(items: InventoryItem[]): DuplicateGroup[] {
  const groups: DuplicateGroup[] = [];
  const byKid = new Map<string, InventoryItem[]>();
  const used = new Set<string>();

  for (const item of items) {
    if (item.knowledge_id) {
      const list = byKid.get(item.knowledge_id) ?? [];
      list.push(item);
      byKid.set(item.knowledge_id, list);
    }
  }

  for (const [kid, group] of byKid) {
    if (group.length < 2) continue;
    const ids = group.map((i) => i.id);
    if (ids.some((id) => used.has(id))) continue;
    ids.forEach((id) => used.add(id));
    const keep = group.sort((a, b) => Number(b.quantity) - Number(a.quantity))[0];
    groups.push({
      id: `dup_kid_${kid}`,
      item_ids: ids,
      names: group.map((i) => i.name),
      knowledge_id: kid,
      suggested_keep_id: keep.id,
      reason: `Same ingredient (${kid}) listed under different names.`,
    });
  }

  for (let i = 0; i < items.length; i++) {
    if (used.has(items[i].id)) continue;
    for (let j = i + 1; j < items.length; j++) {
      if (used.has(items[j].id)) continue;
      const overlap = tokenOverlap(items[i].name, items[j].name);
      if (overlap < 0.65) continue;
      if (items[i].unit !== items[j].unit && !areCompatibleUnits(items[i].unit, items[j].unit)) continue;
      used.add(items[i].id);
      used.add(items[j].id);
      const pair = [items[i], items[j]];
      const keep = pair.sort((a, b) => Number(b.quantity) - Number(a.quantity))[0];
      groups.push({
        id: `dup_name_${items[i].id}_${items[j].id}`,
        item_ids: pair.map((p) => p.id),
        names: pair.map((p) => p.name),
        suggested_keep_id: keep.id,
        reason: `Similar names — likely the same item (${Math.round(overlap * 100)}% match).`,
      });
    }
  }

  return groups.slice(0, 8);
}

function areCompatibleUnits(a: string, b: string): boolean {
  if (a === b) return true;
  const weight = new Set(['lb', 'oz', 'g', 'kg']);
  const vol = new Set(['cup', 'tbsp', 'tsp', 'gallon', 'ml', 'l']);
  if (weight.has(a) && weight.has(b)) return true;
  if (vol.has(a) && vol.has(b)) return true;
  return false;
}

export function findMislocated(items: InventoryItem[]): MislocationSuggestion[] {
  return items
    .map((item) => {
      const inferred = inferWizardItemLocation(item.name);
      const normalized = normalizeLocation(item.location, item.name, item.category);
      const suggested = inferred !== item.location ? inferred : normalized !== item.location ? normalized : null;
      if (!suggested || suggested === item.location) return null;
      return {
        item_id: item.id,
        name: item.name,
        current: item.location,
        suggested,
      };
    })
    .filter((x): x is MislocationSuggestion => !!x)
    .slice(0, 12);
}

export function findLowStock(items: InventoryItem[]): LowStockItem[] {
  return items
    .filter((i) => {
      const threshold = Number(i.low_stock_threshold ?? 0);
      if (threshold > 0) return Number(i.quantity) <= threshold;
      return Number(i.quantity) <= 1 && ['each', 'dozen', 'gallon', 'lb'].includes(i.unit);
    })
    .map((i) => ({
      item_id: i.id,
      name: i.name,
      quantity: Number(i.quantity),
      unit: i.unit,
      threshold: Number(i.low_stock_threshold ?? 1),
    }))
    .slice(0, 10);
}

export function buildStewardPreview(items: InventoryItem[]): StewardPreview {
  const now = Date.now();
  const expiring = items
    .filter((i) => i.expiration_date)
    .map((i) => {
      const days = (new Date(i.expiration_date!).getTime() - now) / 86400000;
      return { item: i, days };
    })
    .filter((e) => e.days >= 0 && e.days <= 7)
    .sort((a, b) => a.days - b.days)
    .map((e) => ({
      item_id: e.item.id,
      name: e.item.name,
      expiration_date: e.item.expiration_date!,
      days_left: Math.ceil(e.days),
    }));

  const duplicates = findDuplicateGroups(items);
  const mislocated = findMislocated(items);
  const low_stock = findLowStock(items);

  const findings: AuditFinding[] = [];

  if (expiring.length) {
    findings.push({
      id: 'expiring',
      severity: 'warn',
      title: `${expiring.length} item${expiring.length === 1 ? '' : 's'} expiring soon`,
      message: `Use soon: ${expiring.slice(0, 4).map((e) => e.name).join(', ')}.`,
      item_ids: expiring.map((e) => e.item_id),
      clara_prompt: `What can I cook to use ${expiring[0]?.name} before it expires?`,
    });
  }

  if (duplicates.length) {
    findings.push({
      id: 'duplicates',
      severity: 'action',
      title: `${duplicates.length} possible duplicate${duplicates.length === 1 ? '' : 's'}`,
      message: duplicates[0].reason,
      item_ids: duplicates.flatMap((d) => d.item_ids),
      clara_prompt: 'Help me merge duplicate pantry items.',
    });
  }

  if (mislocated.length) {
    findings.push({
      id: 'mislocated',
      severity: 'info',
      title: `${mislocated.length} item${mislocated.length === 1 ? '' : 's'} may be in the wrong place`,
      message: `${mislocated[0].name} might belong in the ${mislocated[0].suggested}.`,
      item_ids: mislocated.map((m) => m.item_id),
    });
  }

  if (low_stock.length) {
    findings.push({
      id: 'low_stock',
      severity: 'warn',
      title: `${low_stock.length} low-stock staple${low_stock.length === 1 ? '' : 's'}`,
      message: `Running low: ${low_stock.slice(0, 4).map((l) => l.name).join(', ')}.`,
      item_ids: low_stock.map((l) => l.item_id),
      clara_prompt: 'What staples am I low on and should I add to my supply list?',
    });
  }

  const stale = items.filter((i) => {
    if (!i.created_at || i.expiration_date) return false;
    const days = (now - new Date(i.created_at).getTime()) / 86400000;
    return days > 60;
  });
  if (stale.length >= 2) {
    findings.push({
      id: 'stale_no_expiry',
      severity: 'info',
      title: 'Items without expiration dates',
      message: `${stale.length} items have no expiry set — consider updating or using them.`,
      item_ids: stale.slice(0, 6).map((s) => s.id),
    });
  }

  return {
    duplicates,
    mislocated,
    low_stock,
    expiring,
    findings,
    generated_at: new Date().toISOString(),
  };
}

async function loadItems(userId: string, token?: string): Promise<InventoryItem[]> {
  if (useDevStore()) {
    return loadStore().inventory_items.filter((i) => i.user_id === userId);
  }
  if (!token) return [];
  const db = getSupabaseUserClient(token);
  const { data } = await db.from('inventory_items').select('*').eq('user_id', userId);
  return (data ?? []) as InventoryItem[];
}

function matchItem(items: InventoryItem[], delta: InventoryDelta): InventoryItem | undefined {
  if (delta.item_id) return items.find((i) => i.id === delta.item_id);
  const key = normalizeKey(delta.name);
  return items.find((i) => normalizeKey(i.name) === key || i.name.toLowerCase() === delta.name.toLowerCase());
}

export async function applyInventoryDeltas(
  userId: string,
  token: string | undefined,
  deltas: InventoryDelta[],
): Promise<{ applied: InventoryDelta[]; items: InventoryItem[]; errors: string[] }> {
  const errors: string[] = [];
  const applied: InventoryDelta[] = [];

  if (useDevStore()) {
    const store = loadStore();
    for (const delta of deltas) {
      const idx = store.inventory_items.findIndex(
        (i) => i.user_id === userId && (delta.item_id ? i.id === delta.item_id : normalizeKey(i.name) === normalizeKey(delta.name)),
      );
      if (delta.action === 'add') {
        if (idx >= 0) {
          store.inventory_items[idx].quantity = Number(store.inventory_items[idx].quantity) + (delta.quantity ?? 1);
          store.inventory_items[idx].updated_at = new Date().toISOString();
        } else {
          store.inventory_items.push({
            id: uuidv4(),
            user_id: userId,
            name: normalizeInventoryName(delta.name),
            category: 'other',
            quantity: delta.quantity ?? 1,
            unit: delta.unit ?? 'each',
            location: 'pantry',
            added_via: 'clara_delta',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
        applied.push(delta);
        continue;
      }
      if (idx < 0) {
        errors.push(`No match for ${delta.name}`);
        continue;
      }
      const item = store.inventory_items[idx];
      if (delta.action === 'subtract') {
        item.quantity = Math.max(0, Number(item.quantity) - (delta.quantity ?? 1));
      } else if (delta.action === 'set') {
        item.quantity = delta.quantity ?? 0;
      } else if (delta.action === 'remove') {
        store.inventory_items.splice(idx, 1);
      }
      item.updated_at = new Date().toISOString();
      applied.push(delta);
    }
    saveStore(store);
    await logGenerationToLedger(userId, token, `inv_delta:${Date.now()}`, {
      domain: 'inventory',
      recommendation: applied.map((d) => `${d.action}:${d.name}`).join('; '),
      why: 'Inventory steward delta applied.',
      evidence: applied.map((d) => `delta:${d.action}:${d.name}`),
      confidence: 0.95,
      metadata: { deltas: applied },
    });
    return { applied, items: store.inventory_items.filter((i) => i.user_id === userId), errors };
  }

  if (!token) throw new Error('Missing auth token');
  const db = getSupabaseUserClient(token);
  const items = await loadItems(userId, token);

  for (const delta of deltas) {
    const item = matchItem(items, delta);
    if (delta.action === 'add') {
      if (item) {
        await db.from('inventory_items').update({
          quantity: Number(item.quantity) + (delta.quantity ?? 1),
          updated_at: new Date().toISOString(),
        }).eq('id', item.id);
      } else {
        await db.from('inventory_items').insert({
          user_id: userId,
          name: normalizeInventoryName(delta.name),
          category: 'other',
          quantity: delta.quantity ?? 1,
          unit: delta.unit ?? 'each',
          location: 'pantry',
          added_via: 'clara_delta',
        });
      }
      applied.push(delta);
      continue;
    }
    if (!item) {
      errors.push(`No match for ${delta.name}`);
      continue;
    }
    if (delta.action === 'subtract') {
      await db.from('inventory_items').update({
        quantity: Math.max(0, Number(item.quantity) - (delta.quantity ?? 1)),
        updated_at: new Date().toISOString(),
      }).eq('id', item.id);
    } else if (delta.action === 'set') {
      await db.from('inventory_items').update({
        quantity: delta.quantity ?? 0,
        updated_at: new Date().toISOString(),
      }).eq('id', item.id);
    } else if (delta.action === 'remove') {
      await db.from('inventory_items').delete().eq('id', item.id);
    }
    applied.push(delta);
  }

  await logGenerationToLedger(userId, token, `inv_delta:${Date.now()}`, {
    domain: 'inventory',
    recommendation: applied.map((d) => `${d.action}:${d.name}`).join('; '),
    why: 'Inventory steward delta applied.',
    evidence: applied.map((d) => `delta:${d.action}:${d.name}`),
    confidence: 0.95,
    metadata: { deltas: applied },
  });

  return { applied, items: await loadItems(userId, token), errors };
}

export async function mergeDuplicateGroup(
  userId: string,
  token: string | undefined,
  keepId: string,
  mergeIds: string[],
): Promise<{ item: InventoryItem; removed: string[] }> {
  const removeSet = new Set(mergeIds.filter((id) => id !== keepId));

  if (useDevStore()) {
    const store = loadStore();
    const keep = store.inventory_items.find((i) => i.id === keepId && i.user_id === userId);
    if (!keep) throw new Error('Keep item not found');
    let addedQty = 0;
    for (const id of removeSet) {
      const other = store.inventory_items.find((i) => i.id === id && i.user_id === userId);
      if (other && other.unit === keep.unit) addedQty += Number(other.quantity);
    }
    keep.quantity = Number(keep.quantity) + addedQty;
    keep.updated_at = new Date().toISOString();
    store.inventory_items = store.inventory_items.filter((i) => !(i.user_id === userId && removeSet.has(i.id)));
    saveStore(store);
    return { item: keep, removed: [...removeSet] };
  }

  if (!token) throw new Error('Missing auth token');
  const db = getSupabaseUserClient(token);
  const { data: keep } = await db.from('inventory_items').select('*').eq('id', keepId).eq('user_id', userId).single();
  if (!keep) throw new Error('Keep item not found');

  const { data: others } = await db.from('inventory_items').select('*').eq('user_id', userId).in('id', [...removeSet]);
  let addedQty = 0;
  for (const other of others ?? []) {
    if (other.unit === keep.unit) addedQty += Number(other.quantity);
  }
  await db.from('inventory_items').update({
    quantity: Number(keep.quantity) + addedQty,
    updated_at: new Date().toISOString(),
  }).eq('id', keepId);
  if (removeSet.size) await db.from('inventory_items').delete().eq('user_id', userId).in('id', [...removeSet]);

  const { data: updated } = await db.from('inventory_items').select('*').eq('id', keepId).single();
  return { item: updated as InventoryItem, removed: [...removeSet] };
}

export async function buildStewardPreviewForUser(userId: string, token?: string): Promise<StewardPreview> {
  const items = await loadItems(userId, token);
  return buildStewardPreview(items);
}

export async function narrateAudit(findings: AuditFinding[], assistantName: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || !findings.length) {
    return findings.map((f) => `${f.title}: ${f.message}`).join('\n');
  }
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are ${assistantName}, a kitchen inventory steward. Summarize pantry audit findings in 3-5 short sentences. Be actionable, warm, never invent items not in the findings.`,
        },
        { role: 'user', content: JSON.stringify(findings) },
      ],
      max_tokens: 220,
    }),
  });
  if (!response.ok) return findings.map((f) => f.message).join(' ');
  const data = (await response.json()) as { choices: { message: { content: string } }[] };
  return data.choices[0]?.message?.content?.trim() ?? '';
}
