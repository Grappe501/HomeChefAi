export interface PlanMetrics {
  inventory_utilization_score: number;
  waste_prevention_score: number;
  estimated_grocery_cost: number;
  expiring_items_used: number;
  expiring_items_total: number;
  ingredients_from_inventory?: number;
  ingredients_total?: number;
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

export function formatMetricsSummary(metrics: PlanMetrics): {
  utilization: string;
  waste: string | null;
  grocery: string;
} {
  return {
    utilization: `${metrics.inventory_utilization_score}% inventory used`,
    waste:
      metrics.expiring_items_total > 0
        ? `${metrics.expiring_items_used} expiring item${metrics.expiring_items_used === 1 ? '' : 's'} covered`
        : null,
    grocery: `$${metrics.estimated_grocery_cost.toFixed(2)} est. grocery`,
  };
}
