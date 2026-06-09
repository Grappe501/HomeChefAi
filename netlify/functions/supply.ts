import type { Handler } from '@netlify/functions';
import { withCors, jsonResponse, errorResponse, parseBody, requireAuth } from './utils/response.js';
import {
  getRunningSupply,
  saveRunningSupply,
  syncFromLatestPlan,
  syncSupplyFromPlan,
  newManualItem,
} from './utils/supplyStore.js';
import { useDevStore, loadStore } from './utils/db.js';
import { getSupabaseUserClient } from './utils/supabase.js';
import type { MealPlan, InventoryItem } from '../../src/types/index.js';
import type { RunningSupplyList, SupplyListItem } from '../../src/types/supplyList.js';

export const handler: Handler = withCors(async (event) => {
  if (event.httpMethod === 'OPTIONS') return jsonResponse({});

  const user = await requireAuth(event);
  if (!user) return errorResponse('Unauthorized', 401);

  if (event.httpMethod === 'GET') {
    const params = event.queryStringParameters ?? {};
    if (params.action === 'sync') {
      const result = await syncFromLatestPlan(user.id, user.token);
      return jsonResponse(result);
    }
    const list = await getRunningSupply(user.id, user.token);
    return jsonResponse({ list });
  }

  if (event.httpMethod === 'PUT') {
    const body = parseBody<{ list: RunningSupplyList }>(event);
    if (!body?.list?.items) return errorResponse('list with items required', 400);
    const saved = await saveRunningSupply(
      user.id,
      { ...body.list, user_id: user.id, updated_at: new Date().toISOString() },
      user.token,
    );
    return jsonResponse({ list: saved });
  }

  if (event.httpMethod === 'POST') {
    const body = parseBody<{
      action?: string;
      plan_id?: string;
      name?: string;
      quantity?: number;
      unit?: string;
      item_id?: string;
      checked?: boolean;
    }>(event);

    const action = body?.action ?? 'sync-plan';

    if (action === 'sync-plan') {
      if (body.plan_id) {
        let plan: MealPlan | undefined;
        let inventory: InventoryItem[] = [];
        if (useDevStore()) {
          const store = loadStore();
          plan = store.meal_plans.find((p) => p.id === body.plan_id && p.user_id === user.id);
          inventory = store.inventory_items.filter((i) => i.user_id === user.id);
        } else if (user.token) {
          const db = getSupabaseUserClient(user.token);
          const { data: p } = await db.from('meal_plans').select('*').eq('id', body.plan_id).eq('user_id', user.id).maybeSingle();
          plan = (p as MealPlan | null) ?? undefined;
          const { data: items } = await db.from('inventory_items').select('*').eq('user_id', user.id);
          inventory = (items ?? []) as InventoryItem[];
        }
        if (!plan) return errorResponse('Meal plan not found', 404);
        const list = await syncSupplyFromPlan(user.id, plan, inventory, user.token);
        return jsonResponse({ list, synced: true, plan });
      }
      const result = await syncFromLatestPlan(user.id, user.token);
      return jsonResponse(result);
    }

    if (action === 'add-item') {
      if (!body.name?.trim()) return errorResponse('name required', 400);
      const list = await getRunningSupply(user.id, user.token);
      const item = newManualItem(body.name, body.quantity ?? 1, body.unit ?? 'each');
      list.items.push(item);
      list.updated_at = new Date().toISOString();
      const saved = await saveRunningSupply(user.id, list, user.token);
      return jsonResponse({ list: saved, item });
    }

    if (action === 'toggle-item') {
      if (!body.item_id) return errorResponse('item_id required', 400);
      const list = await getRunningSupply(user.id, user.token);
      list.items = list.items.map((i) =>
        i.id === body.item_id ? { ...i, checked: body.checked ?? !i.checked } : i,
      );
      list.updated_at = new Date().toISOString();
      const saved = await saveRunningSupply(user.id, list, user.token);
      return jsonResponse({ list: saved });
    }

    if (action === 'remove-item') {
      if (!body.item_id) return errorResponse('item_id required', 400);
      const list = await getRunningSupply(user.id, user.token);
      list.items = list.items.filter((i) => i.id !== body.item_id);
      list.updated_at = new Date().toISOString();
      const saved = await saveRunningSupply(user.id, list, user.token);
      return jsonResponse({ list: saved });
    }

    if (action === 'clear-checked') {
      const list = await getRunningSupply(user.id, user.token);
      list.items = list.items.filter((i) => !i.checked);
      list.updated_at = new Date().toISOString();
      const saved = await saveRunningSupply(user.id, list, user.token);
      return jsonResponse({ list: saved });
    }

    return errorResponse('Unknown action', 400);
  }

  return errorResponse('Method not allowed', 405);
});
