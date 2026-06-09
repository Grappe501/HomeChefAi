import { v4 as uuidv4 } from 'uuid';
import type { InventoryItem, MealPlan, PlannedMeal, ShoppingItem } from '@/types';
import type { RunningSupplyList, SupplyListItem } from '@/types/supplyList';
import { normalizeSupplyGroups, type SupplyGroup } from '@/lib/supplyPlan';

function itemKey(name: string, unit: string): string {
  return `${name.trim().toLowerCase()}|${unit.trim().toLowerCase()}`;
}

export function deriveShoppingFromMeals(
  meals: PlannedMeal[],
  inventory: InventoryItem[] = [],
): ShoppingItem[] {
  const invNames = new Set(inventory.map((i) => i.name.toLowerCase()));
  const map = new Map<string, ShoppingItem>();

  for (const meal of meals) {
    const group = (meal.meal_type === 'snack' ? 'snack' : meal.meal_type) as SupplyGroup;
    for (const ing of meal.ingredients ?? []) {
      if (ing.in_inventory === true || invNames.has(ing.name.toLowerCase())) continue;
      const key = itemKey(ing.name, ing.unit);
      const existing = map.get(key);
      if (existing) {
        existing.quantity += ing.quantity;
      } else {
        map.set(key, {
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit,
          supply_group: group,
        });
      }
    }
  }

  return [...map.values()];
}

export function shoppingToSupplyItems(
  items: ShoppingItem[],
  planId?: string,
  source: SupplyListItem['source'] = 'meal_plan',
): SupplyListItem[] {
  return normalizeSupplyGroups(items).map((item) => ({
    id: uuidv4(),
    name: item.name,
    quantity: item.quantity,
    unit: item.unit,
    estimated_price: item.estimated_price,
    supply_group: (item.supply_group ?? 'staple') as SupplyGroup,
    checked: false,
    source,
    plan_id: planId,
  }));
}

export function buildSupplyFromPlan(plan: MealPlan, inventory: InventoryItem[] = []): SupplyListItem[] {
  let shopping = plan.plan_data?.shopping_list ?? [];
  if (!shopping.length && plan.plan_data?.meals?.length) {
    shopping = deriveShoppingFromMeals(plan.plan_data.meals, inventory);
  }
  return shoppingToSupplyItems(shopping, plan.id, 'meal_plan');
}

/** Merge plan items into running list — keeps manual items, replaces meal_plan items. */
export function mergePlanIntoSupply(
  current: RunningSupplyList,
  planItems: SupplyListItem[],
  plan: MealPlan,
): RunningSupplyList {
  const manual = current.items.filter((i) => i.source === 'manual' || i.source === 'pantry_low');
  const manualKeys = new Set(manual.map((i) => itemKey(i.name, i.unit)));

  const mergedPlan = planItems.filter((i) => !manualKeys.has(itemKey(i.name, i.unit)));
  const dedupedManual = manual.filter((m) => !mergedPlan.some((p) => itemKey(p.name, p.unit) === itemKey(m.name, m.unit)));

  const items = [...mergedPlan, ...dedupedManual];
  const estimated_cost =
    plan.plan_data?.estimated_cost ??
    (items.reduce((sum, i) => sum + (i.estimated_price ?? 0), 0) || undefined);

  return {
    ...current,
    plan_id: plan.id,
    plan_title: plan.title,
    items,
    estimated_cost,
    updated_at: new Date().toISOString(),
  };
}

export function supplyProgress(items: SupplyListItem[]): { checked: number; total: number } {
  const total = items.length;
  const checked = items.filter((i) => i.checked).length;
  return { checked, total };
}

export function formatSupplyLine(item: SupplyListItem): string {
  return `${item.name} — ${item.quantity} ${item.unit}`;
}

export function groupSupplyListItems(items: SupplyListItem[]): Record<SupplyGroup, SupplyListItem[]> {
  const grouped: Record<SupplyGroup, SupplyListItem[]> = {
    breakfast: [],
    lunch: [],
    dinner: [],
    snack: [],
    staple: [],
  };
  const normalized = normalizeSupplyGroups(items);
  for (let i = 0; i < normalized.length; i++) {
    const n = normalized[i];
    const full = items[i];
    const g = (n.supply_group ?? 'staple') as SupplyGroup;
    grouped[g].push({ ...full, supply_group: g });
  }
  return grouped;
}

export function copySupplyListText(
  grouped: Record<SupplyGroup, SupplyListItem[]>,
  labels: { id: SupplyGroup; label: string }[],
): string {
  const lines: string[] = ['Kitchen Supply List'];
  for (const { id, label } of labels) {
    const group = grouped[id];
    if (!group.length) continue;
    lines.push('', label);
    for (const item of group) {
      const mark = item.checked ? '✓ ' : '- ';
      lines.push(`${mark}${formatSupplyLine(item)}`);
    }
  }
  return lines.join('\n');
}
