import { v4 as uuidv4 } from 'uuid';
import type { InventoryItem, MealPlan } from '../../../src/types/index.js';
import type { RunningSupplyList, SupplyListItem } from '../../../src/types/supplyList.js';
import { buildSupplyFromPlan, mergePlanIntoSupply } from '../../../src/lib/supplyListOps.js';
import { useDevStore, loadStore, saveStore } from './devStore.js';
import { getSupabaseUserClient } from './supabase.js';

export interface SupplyListRow {
  user_id: string;
  plan_id?: string;
  plan_title?: string;
  items: SupplyListItem[];
  estimated_cost?: number;
  updated_at: string;
}

function emptyList(userId: string): RunningSupplyList {
  return { user_id: userId, items: [], updated_at: new Date().toISOString() };
}

export async function getRunningSupply(userId: string, token?: string): Promise<RunningSupplyList> {
  if (useDevStore()) {
    const store = loadStore();
    const row = (store as { running_supply_lists?: SupplyListRow[] }).running_supply_lists?.find(
      (r) => r.user_id === userId,
    );
    return row ?? emptyList(userId);
  }
  if (!token) return emptyList(userId);
  const db = getSupabaseUserClient(token);
  const { data } = await db.from('running_supply_lists').select('*').eq('user_id', userId).maybeSingle();
  if (!data) return emptyList(userId);
  return data as RunningSupplyList;
}

export async function saveRunningSupply(
  userId: string,
  list: RunningSupplyList,
  token?: string,
): Promise<RunningSupplyList> {
  const payload: SupplyListRow = {
    user_id: userId,
    plan_id: list.plan_id,
    plan_title: list.plan_title,
    items: list.items,
    estimated_cost: list.estimated_cost,
    updated_at: list.updated_at || new Date().toISOString(),
  };

  if (useDevStore()) {
    const store = loadStore() as { running_supply_lists?: SupplyListRow[] };
    if (!store.running_supply_lists) store.running_supply_lists = [];
    const idx = store.running_supply_lists.findIndex((r) => r.user_id === userId);
    if (idx >= 0) store.running_supply_lists[idx] = payload;
    else store.running_supply_lists.push(payload);
    saveStore(store);
    return payload;
  }

  if (!token) throw new Error('Missing auth token');
  const db = getSupabaseUserClient(token);
  const { error } = await db.from('running_supply_lists').upsert(payload);
  if (error) throw new Error(error.message);
  return payload;
}

export async function syncSupplyFromPlan(
  userId: string,
  plan: MealPlan,
  inventory: InventoryItem[],
  token?: string,
): Promise<RunningSupplyList> {
  const current = await getRunningSupply(userId, token);
  const planItems = buildSupplyFromPlan(plan, inventory);
  const merged = mergePlanIntoSupply(current, planItems, plan);
  return saveRunningSupply(userId, merged, token);
}

export async function syncFromLatestPlan(
  userId: string,
  token?: string,
): Promise<{ list: RunningSupplyList; synced: boolean; plan?: MealPlan }> {
  let plan: MealPlan | undefined;

  if (useDevStore()) {
    const store = loadStore();
    plan = [...store.meal_plans].filter((p) => p.user_id === userId).sort((a, b) =>
      (b.created_at ?? '').localeCompare(a.created_at ?? ''),
    )[0];
  } else if (token) {
    const db = getSupabaseUserClient(token);
    const { data } = await db
      .from('meal_plans')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    plan = (data as MealPlan | null) ?? undefined;
  }

  if (!plan) {
    const list = await getRunningSupply(userId, token);
    return { list, synced: false };
  }

  let inventory: InventoryItem[] = [];
  if (useDevStore()) {
    inventory = loadStore().inventory_items.filter((i) => i.user_id === userId);
  } else if (token) {
    const db = getSupabaseUserClient(token);
    const { data } = await db.from('inventory_items').select('*').eq('user_id', userId);
    inventory = (data ?? []) as InventoryItem[];
  }

  const list = await syncSupplyFromPlan(userId, plan, inventory, token);
  return { list, synced: true, plan };
}

export function newManualItem(name: string, quantity: number, unit: string): SupplyListItem {
  return {
    id: uuidv4(),
    name: name.trim(),
    quantity,
    unit: unit.trim() || 'each',
    supply_group: 'staple',
    checked: false,
    source: 'manual',
  };
}
