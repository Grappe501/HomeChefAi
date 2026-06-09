import type { ShoppingItem } from '@/types';

export type SupplyGroup = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'staple';

export const SUPPLY_GROUP_ORDER: { id: SupplyGroup; label: string }[] = [
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'dinner', label: 'Dinner' },
  { id: 'snack', label: 'Snacks' },
  { id: 'staple', label: 'Shared staples' },
];

/** Normalize groups: items used across meal types become shared staples. */
export function normalizeSupplyGroups(items: ShoppingItem[]): ShoppingItem[] {
  const groupsByName = new Map<string, Set<SupplyGroup>>();
  for (const item of items) {
    const g = (item.supply_group ?? 'staple') as SupplyGroup;
    const set = groupsByName.get(item.name.toLowerCase()) ?? new Set();
    set.add(g);
    groupsByName.set(item.name.toLowerCase(), set);
  }
  return items.map((item) => {
    const groups = groupsByName.get(item.name.toLowerCase());
    if (groups && groups.size > 1) return { ...item, supply_group: 'staple' as const };
    return { ...item, supply_group: (item.supply_group ?? 'staple') as SupplyGroup };
  });
}

export function groupSupplyList(items: ShoppingItem[]): Record<SupplyGroup, ShoppingItem[]> {
  const normalized = normalizeSupplyGroups(items);
  const grouped: Record<SupplyGroup, ShoppingItem[]> = {
    breakfast: [],
    lunch: [],
    dinner: [],
    snack: [],
    staple: [],
  };
  for (const item of normalized) {
    const g = (item.supply_group ?? 'staple') as SupplyGroup;
    grouped[g].push(item);
  }
  return grouped;
}

export function hasGroupedSupply(items: ShoppingItem[]): boolean {
  return items.some((i) => i.supply_group && i.supply_group !== 'staple');
}
