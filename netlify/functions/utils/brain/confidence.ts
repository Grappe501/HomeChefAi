export const THRESHOLDS = {
  consumption: { minObs: 3, minConfidence: 0.7 },
  habit_meal: { minObs: 3, minConfidence: 0.75 },
  waste: { minObs: 2, minConfidence: 0.8 },
  preference: { minObs: 3, minConfidence: 0.65 },
  habit_day: { minObs: 5, minConfidence: 0.7 },
  shopping: { minObs: 3, minConfidence: 0.7 },
} as const;

export function computeCycleConfidence(purchaseCount: number, historyDays: number, cycleStdDevRatio: number): number {
  let c = 0.45 + purchaseCount * 0.08 + Math.min(historyDays / 120, 1) * 0.25;
  if (cycleStdDevRatio > 0.45) c -= 0.12;
  if (purchaseCount >= 6) c += 0.05;
  return Math.min(0.98, Math.max(0, Math.round(c * 100) / 100));
}

export function computeCountConfidence(count: number, minObs: number, historyDays: number): number {
  const base = 0.4 + (count / Math.max(minObs, 1)) * 0.35;
  const historyBoost = Math.min(historyDays / 90, 1) * 0.2;
  return Math.min(0.98, Math.round((base + historyBoost) * 100) / 100);
}

export function meetsThreshold(type: keyof typeof THRESHOLDS, count: number, confidence: number): boolean {
  const t = THRESHOLDS[type];
  return count >= t.minObs && confidence >= t.minConfidence;
}

export function formatConfidence(confidence: number): string {
  return `${Math.round(confidence * 100)}%`;
}
