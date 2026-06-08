import { v4 as uuidv4 } from 'uuid';
import type { Handler } from '@netlify/functions';
import { withCors, jsonResponse, errorResponse, parseBody, getUserId } from './utils/response.js';
import { useDevStore, loadStore, saveStore, query } from './utils/db.js';

export const handler: Handler = withCors(async (event) => {
  const userId = getUserId(event);
  if (!userId) return errorResponse('Missing user ID', 401);

  if (event.httpMethod === 'POST') {
    const body = parseBody<{
      description?: string;
      meal_name?: string;
      items_used: { item_id?: string; name: string; quantity: number; unit: string }[];
      confirm?: boolean;
    }>(event);
    if (!body?.items_used) return errorResponse('Missing items_used');

    const logId = uuidv4();
    const log = {
      id: logId,
      user_id: userId,
      description: body.description,
      meal_name: body.meal_name,
      items_used: body.items_used,
      created_at: new Date().toISOString(),
    };

    if (useDevStore()) {
      const store = loadStore();
      store.usage_logs.push(log);

      for (const used of body.items_used) {
        const idx = store.inventory_items.findIndex(
          (i) => i.user_id === userId && (used.item_id ? i.id === used.item_id : i.name.toLowerCase() === used.name.toLowerCase())
        );
        if (idx >= 0) {
          store.inventory_items[idx].quantity = Math.max(0, Number(store.inventory_items[idx].quantity) - used.quantity);
          store.inventory_items[idx].updated_at = new Date().toISOString();
        }
      }

      const pIdx = store.profiles.findIndex((p) => p.user_id === userId);
      if (pIdx >= 0) {
        store.profiles[pIdx].gamification_xp += 25;
        store.profiles[pIdx].last_meal_memory = {
          meal: body.meal_name,
          date: new Date().toISOString(),
          items: body.items_used.map((i) => i.name),
        };
      }

      saveStore(store);
      return jsonResponse({ log, inventory_updated: true }, 201);
    }

    await query(
      'INSERT INTO usage_logs (id, user_id, description, meal_name, items_used) VALUES ($1, $2, $3, $4, $5)',
      [logId, userId, body.description, body.meal_name, JSON.stringify(body.items_used)]
    );
    return jsonResponse({ log }, 201);
  }

  if (event.httpMethod === 'GET') {
    if (useDevStore()) {
      const store = loadStore();
      const logs = store.usage_logs.filter((l) => l.user_id === userId);
      return jsonResponse({ logs });
    }
    const logs = await query('SELECT * FROM usage_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50', [userId]);
    return jsonResponse({ logs });
  }

  return errorResponse('Method not allowed', 405);
});
