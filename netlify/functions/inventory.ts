import { v4 as uuidv4 } from 'uuid';
import type { Handler } from '@netlify/functions';
import { withCors, jsonResponse, errorResponse, parseBody, requireAuth } from './utils/response.js';
import { useDevStore, loadStore, saveStore } from './utils/db.js';
import { getSupabaseUserClient } from './utils/supabase.js';
import { awardXpDevStore, awardXpSupabase, XP_AWARDS } from './utils/gamification.js';
import {
  recordWasteEventDevStore,
  recordWasteEventSupabase,
  runBrainSyncDevStore,
  runBrainSyncSupabase,
  getBrainScopeDevStore,
  getBrainScopeSupabase,
} from './utils/brain/runBrainSync.js';
import type { InventoryItem } from '../../src/types/index';
import { normalizeScanItem } from './utils/inventoryNormalize.js';

export const handler: Handler = withCors(async (event) => {
  const user = await requireAuth(event);
  if (!user) return errorResponse('Unauthorized', 401);
  const userId = user.id;

  if (event.httpMethod === 'GET') {
    const location = event.queryStringParameters?.location;
    if (useDevStore()) {
      const store = loadStore();
      let items = store.inventory_items.filter((i) => i.user_id === userId);
      if (location) items = items.filter((i) => i.location === location);
      return jsonResponse({ items, total_value: estimateValue(items) });
    }
    if (!user.token) return errorResponse('Missing token', 401);
    const db = getSupabaseUserClient(user.token);
    let q = db.from('inventory_items').select('*').eq('user_id', userId).order('name');
    if (location) q = q.eq('location', location);
    const { data: items, error } = await q;
    if (error) return errorResponse(error.message, 500);
    return jsonResponse({ items: items ?? [], total_value: estimateValue(items ?? []) });
  }

  if (event.httpMethod === 'POST') {
    const body = parseBody<Partial<InventoryItem> | Partial<InventoryItem>[]>(event);
    if (!body) return errorResponse('Invalid body');
    const itemsToAdd = Array.isArray(body) ? body : [body];

    if (useDevStore()) {
      const created = itemsToAdd.map((item) => buildItem(userId, item));
      const store = loadStore();
      store.inventory_items.push(...created);
      if (itemsToAdd.some((i) => i.added_via === 'wizard')) {
        awardXpDevStore(store, userId, XP_AWARDS.pantry_wizard);
      }
      saveStore(store);
      return jsonResponse({ items: created }, 201);
    }

    if (!user.token) return errorResponse('Missing token', 401);
    const db = getSupabaseUserClient(user.token);
    const rows = itemsToAdd.map((item) => {
      const normalized = normalizeScanItem(item, item.added_via || 'manual');
      return {
        user_id: userId,
        name: normalized.name,
        category: normalized.category,
        quantity: normalized.quantity,
        unit: normalized.unit,
        expiration_date: normalized.expiration_date,
        location: normalized.location,
        added_via: normalized.added_via,
        notes: item.notes || null,
        knowledge_id: normalized.knowledge_id ?? null,
        taxonomy_id: item.taxonomy_id || null,
        low_stock_threshold: item.low_stock_threshold || 0,
        estimated_unit_price: (item as { estimated_unit_price?: number }).estimated_unit_price || 0,
      };
    });
    const { data, error } = await db.from('inventory_items').insert(rows).select();
    if (error) return errorResponse(error.message, 500);
    let xp_gained: number | undefined;
    if (itemsToAdd.some((i) => i.added_via === 'wizard')) {
      const xp = await awardXpSupabase(db, userId, XP_AWARDS.pantry_wizard);
      xp_gained = xp.gained;
    }
    return jsonResponse({ items: data, xp_gained }, 201);
  }

  if (event.httpMethod === 'PUT') {
    const body = parseBody<Partial<InventoryItem> & { id: string }>(event);
    if (!body?.id) return errorResponse('Missing item id');

    if (useDevStore()) {
      const store = loadStore();
      const idx = store.inventory_items.findIndex((i) => i.id === body.id && i.user_id === userId);
      if (idx === -1) return errorResponse('Item not found', 404);
      store.inventory_items[idx] = { ...store.inventory_items[idx], ...body, updated_at: new Date().toISOString() };
      saveStore(store);
      return jsonResponse({ item: store.inventory_items[idx] });
    }

    if (!user.token) return errorResponse('Missing token', 401);
    const db = getSupabaseUserClient(user.token);
    const { data, error } = await db.from('inventory_items').update({
      name: body.name,
      quantity: body.quantity,
      unit: body.unit,
      expiration_date: body.expiration_date,
      location: body.location,
      notes: body.notes,
      knowledge_id: body.knowledge_id,
      taxonomy_id: body.taxonomy_id,
      updated_at: new Date().toISOString(),
    }).eq('id', body.id).eq('user_id', userId).select().single();
    if (error) return errorResponse(error.message, 500);
    return jsonResponse({ item: data });
  }

  if (event.httpMethod === 'DELETE') {
    const id = event.queryStringParameters?.id;
    if (!id) return errorResponse('Missing item id');

    if (useDevStore()) {
      const store = loadStore();
      const item = store.inventory_items.find((i) => i.id === id && i.user_id === userId);
      if (!item) return errorResponse('Item not found', 404);
      if (Number(item.quantity) > 0) {
        const scope = getBrainScopeDevStore(store, userId);
        recordWasteEventDevStore(store, scope, { id: item.id, name: item.name });
        runBrainSyncDevStore(store, scope);
      }
      store.inventory_items = store.inventory_items.filter((i) => !(i.id === id && i.user_id === userId));
      saveStore(store);
      return jsonResponse({ success: true });
    }

    if (!user.token) return errorResponse('Missing token', 401);
    const db = getSupabaseUserClient(user.token);
    const { data: item } = await db.from('inventory_items').select('id, name, quantity').eq('id', id).eq('user_id', userId).single();
    if (!item) return errorResponse('Item not found', 404);
    const { error } = await db.from('inventory_items').delete().eq('id', id).eq('user_id', userId);
    if (error) return errorResponse(error.message, 500);
    if (Number(item.quantity) > 0) {
      const scope = await getBrainScopeSupabase(db, userId);
      await recordWasteEventSupabase(db, scope, { id: item.id, name: item.name, quantity: Number(item.quantity) });
      await runBrainSyncSupabase(db, scope);
    }
    return jsonResponse({ success: true });
  }

  return errorResponse('Method not allowed', 405);
});

function buildItem(userId: string, item: Partial<InventoryItem>): InventoryItem {
  const normalized = normalizeScanItem(item, item.added_via || 'manual');
  return {
    id: uuidv4(),
    user_id: userId,
    name: normalized.name,
    category: normalized.category,
    quantity: normalized.quantity,
    unit: normalized.unit,
    expiration_date: normalized.expiration_date ?? undefined,
    location: normalized.location,
    added_via: normalized.added_via,
    notes: item.notes,
    knowledge_id: normalized.knowledge_id,
    taxonomy_id: item.taxonomy_id,
    low_stock_threshold: item.low_stock_threshold || 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function estimateValue(items: { quantity?: number; estimated_unit_price?: number }[]) {
  return items.reduce((sum, i) => sum + Number(i.quantity || 0) * Number(i.estimated_unit_price || 0), 0);
}
