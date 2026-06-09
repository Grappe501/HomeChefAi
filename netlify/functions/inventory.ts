import { v4 as uuidv4 } from 'uuid';
import type { Handler } from '@netlify/functions';
import { withCors, jsonResponse, errorResponse, parseBody, requireAuth } from './utils/response.js';
import { useDevStore, loadStore, saveStore } from './utils/db.js';
import { getSupabaseUserClient } from './utils/supabase.js';
import type { InventoryItem } from '../../src/types/index';

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
      saveStore(store);
      return jsonResponse({ items: created }, 201);
    }

    if (!user.token) return errorResponse('Missing token', 401);
    const db = getSupabaseUserClient(user.token);
    const rows = itemsToAdd.map((item) => ({
      user_id: userId,
      name: item.name || 'Unknown',
      category: item.category || 'other',
      quantity: Number(item.quantity) || 1,
      unit: item.unit || 'each',
      expiration_date: item.expiration_date || null,
      location: item.location || 'pantry',
      added_via: item.added_via || 'manual',
      notes: item.notes || null,
      low_stock_threshold: item.low_stock_threshold || 0,
      estimated_unit_price: (item as { estimated_unit_price?: number }).estimated_unit_price || 0,
    }));
    const { data, error } = await db.from('inventory_items').insert(rows).select();
    if (error) return errorResponse(error.message, 500);
    return jsonResponse({ items: data }, 201);
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
      store.inventory_items = store.inventory_items.filter((i) => !(i.id === id && i.user_id === userId));
      saveStore(store);
      return jsonResponse({ success: true });
    }

    if (!user.token) return errorResponse('Missing token', 401);
    const db = getSupabaseUserClient(user.token);
    const { error } = await db.from('inventory_items').delete().eq('id', id).eq('user_id', userId);
    if (error) return errorResponse(error.message, 500);
    return jsonResponse({ success: true });
  }

  return errorResponse('Method not allowed', 405);
});

function buildItem(userId: string, item: Partial<InventoryItem>): InventoryItem {
  return {
    id: uuidv4(),
    user_id: userId,
    name: item.name || 'Unknown',
    category: item.category || 'other',
    quantity: Number(item.quantity) || 1,
    unit: item.unit || 'each',
    expiration_date: item.expiration_date,
    location: (item.location as InventoryItem['location']) || 'pantry',
    added_via: item.added_via || 'manual',
    notes: item.notes,
    low_stock_threshold: item.low_stock_threshold || 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function estimateValue(items: { quantity?: number; estimated_unit_price?: number }[]) {
  return items.reduce((sum, i) => sum + Number(i.quantity || 0) * Number(i.estimated_unit_price || 0), 0);
}
