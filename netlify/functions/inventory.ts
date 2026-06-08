import { v4 as uuidv4 } from 'uuid';
import type { Handler } from '@netlify/functions';
import { withCors, jsonResponse, errorResponse, parseBody, getUserId } from './utils/response.js';
import { useDevStore, loadStore, saveStore, query, queryOne } from './utils/db.js';
import type { InventoryItem } from '../../src/types/index';

export const handler: Handler = withCors(async (event) => {
  const userId = getUserId(event);
  if (!userId) return errorResponse('Missing user ID', 401);

  if (event.httpMethod === 'GET') {
    const location = event.queryStringParameters?.location;
    if (useDevStore()) {
      const store = loadStore();
      let items = store.inventory_items.filter((i) => i.user_id === userId);
      if (location) items = items.filter((i) => i.location === location);
      return jsonResponse({ items });
    }
    const sql = location
      ? 'SELECT * FROM inventory_items WHERE user_id = $1 AND location = $2 ORDER BY name'
      : 'SELECT * FROM inventory_items WHERE user_id = $1 ORDER BY name';
    const params = location ? [userId, location] : [userId];
    const items = await query(sql, params);
    return jsonResponse({ items });
  }

  if (event.httpMethod === 'POST') {
    const body = parseBody<Partial<InventoryItem> | Partial<InventoryItem>[]>(event);
    if (!body) return errorResponse('Invalid body');

    const itemsToAdd = Array.isArray(body) ? body : [body];
    const created: InventoryItem[] = [];

    for (const item of itemsToAdd) {
      const newItem: InventoryItem = {
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
      created.push(newItem);
    }

    if (useDevStore()) {
      const store = loadStore();
      store.inventory_items.push(...created);
      saveStore(store);
      return jsonResponse({ items: created }, 201);
    }

    for (const item of created) {
      await query(
        `INSERT INTO inventory_items (id, user_id, name, category, quantity, unit, expiration_date, location, added_via, notes, low_stock_threshold)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [item.id, userId, item.name, item.category, item.quantity, item.unit,
         item.expiration_date || null, item.location, item.added_via, item.notes || null, item.low_stock_threshold]
      );
    }
    return jsonResponse({ items: created }, 201);
  }

  if (event.httpMethod === 'PUT') {
    const body = parseBody<Partial<InventoryItem> & { id: string }>(event);
    if (!body?.id) return errorResponse('Missing item id');

    if (useDevStore()) {
      const store = loadStore();
      const idx = store.inventory_items.findIndex((i) => i.id === body.id && i.user_id === userId);
      if (idx === -1) return errorResponse('Item not found', 404);
      store.inventory_items[idx] = {
        ...store.inventory_items[idx],
        ...body,
        updated_at: new Date().toISOString(),
      };
      saveStore(store);
      return jsonResponse({ item: store.inventory_items[idx] });
    }

    await query(
      `UPDATE inventory_items SET name = COALESCE($1, name), quantity = COALESCE($2, quantity), unit = COALESCE($3, unit),
       expiration_date = COALESCE($4, expiration_date), location = COALESCE($5, location), notes = COALESCE($6, notes),
       updated_at = NOW() WHERE id = $7 AND user_id = $8`,
      [body.name, body.quantity, body.unit, body.expiration_date, body.location, body.notes, body.id, userId]
    );
    const item = await queryOne('SELECT * FROM inventory_items WHERE id = $1', [body.id]);
    return jsonResponse({ item });
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

    await query('DELETE FROM inventory_items WHERE id = $1 AND user_id = $2', [id, userId]);
    return jsonResponse({ success: true });
  }

  return errorResponse('Method not allowed', 405);
});
