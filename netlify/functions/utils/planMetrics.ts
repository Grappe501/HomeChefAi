import type { InventoryItem, MealPlanData } from '../../../src/types/index';

export interface PlanMetrics {
  inventory_utilization_score: number;
  waste_prevention_score: number;
  estimated_grocery_cost: number;
  expiring_items_used: number;
  expiring_items_total: number;
  ingredients_from_inventory: number;
  ingredients_total: number;
}

function daysUntil(dateStr: string): number {
  const exp = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  exp.setHours(0, 0, 0, 0);
  return Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function inventoryNameSet(inventory: InventoryItem[]): Set<string> {
  return new Set(inventory.map((i) => i.name.toLowerCase().trim()));
}

function namesMatch(a: string, b: string): boolean {
  const x = a.toLowerCase().trim();
  const y = b.toLowerCase().trim();
  return x === y || x.includes(y) || y.includes(x);
}

function ingredientFromInventory(name: string, invNames: Set<string>, flagged?: boolean): boolean {
  if (flagged) return true;
  const lower = name.toLowerCase().trim();
  for (const inv of invNames) {
    if (namesMatch(lower, inv)) return true;
  }
  return false;
}

function itemUsedInPlan(itemName: string, planData: MealPlanData): boolean {
  for (const used of planData.uses_inventory ?? []) {
    if (namesMatch(itemName, used)) return true;
  }
  for (const meal of planData.meals ?? []) {
    for (const ing of meal.ingredients ?? []) {
      if (namesMatch(itemName, ing.name)) return true;
    }
  }
  return false;
}

/** Rough deterministic scores — good enough for Clara to speak in percentages. */
export function computePlanMetrics(planData: MealPlanData, inventory: InventoryItem[]): PlanMetrics {
  const invNames = inventoryNameSet(inventory);
  let ingredientsFromInventory = 0;
  let ingredientsTotal = 0;

  for (const meal of planData.meals ?? []) {
    for (const ing of meal.ingredients ?? []) {
      ingredientsTotal++;
      if (ingredientFromInventory(ing.name, invNames, ing.in_inventory)) {
        ingredientsFromInventory++;
      }
    }
  }

  const inventoryUtilization =
    ingredientsTotal > 0
      ? Math.round((ingredientsFromInventory / ingredientsTotal) * 100)
      : 0;

  const expiringSoon = inventory.filter((i) => {
    if (!i.expiration_date) return false;
    const d = daysUntil(i.expiration_date);
    return d >= 0 && d <= 7;
  });

  const expiringUsed = expiringSoon.filter((i) => itemUsedInPlan(i.name, planData)).length;
  const wastePrevention =
    expiringSoon.length > 0 ? Math.round((expiringUsed / expiringSoon.length) * 100) : 0;

  const estimatedGrocery =
    planData.estimated_cost ??
    (planData.shopping_list ?? []).reduce((s, i) => s + Number(i.estimated_price ?? 0), 0);

  return {
    inventory_utilization_score: Math.min(100, Math.max(0, inventoryUtilization)),
    waste_prevention_score: Math.min(100, Math.max(0, wastePrevention)),
    estimated_grocery_cost: Math.round(estimatedGrocery * 100) / 100,
    expiring_items_used: expiringUsed,
    expiring_items_total: expiringSoon.length,
    ingredients_from_inventory: ingredientsFromInventory,
    ingredients_total: ingredientsTotal,
  };
}

export function claraMetricsLines(metrics: PlanMetrics): string[] {
  const lines = [
    `This plan uses ${metrics.inventory_utilization_score}% of your current inventory.`,
  ];
  if (metrics.expiring_items_total > 0) {
    lines.push(
      `This plan should prevent ${metrics.expiring_items_used} of ${metrics.expiring_items_total} expiring item(s).`,
    );
  }
  lines.push(`Estimated grocery spend: $${metrics.estimated_grocery_cost.toFixed(2)}`);
  return lines;
}
