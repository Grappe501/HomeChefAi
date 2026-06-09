/**
 * Learning Engine — process ledger outcomes into preference signals (Phase 6).
 */

import type { DecisionLedgerEntry } from './decisionLedger.js';

export interface ProcessedOutcomes {
  kept_meals: string[];
  replaced_meals: string[];
  prefers_tags: string[];
  avoids_tags: string[];
  ledger_evidence: string[];
  confidence_boost: number;
}

export function processLedgerOutcomes(entries: DecisionLedgerEntry[], domain = 'meal_plan'): ProcessedOutcomes {
  const mealEntries = entries.filter((e) => e.domain === domain);
  const kept = mealEntries.filter((e) => e.outcome === 'accepted');
  const replaced = mealEntries.filter((e) => e.outcome === 'replaced');

  const prefers_tags = new Set<string>();
  const avoids_tags = new Set<string>();

  for (const e of kept) {
    const recType = e.metadata?.recommendation_type as string | undefined;
    if (recType) prefers_tags.add(recType);
    for (const ev of e.evidence) {
      if (ev.startsWith('rec:')) prefers_tags.add(ev.replace('rec:', ''));
    }
  }

  for (const e of replaced) {
    const recType = e.metadata?.recommendation_type as string | undefined;
    if (recType) avoids_tags.add(recType);
  }

  const confidence_boost = Math.min(0.15, kept.length * 0.02 - replaced.length * 0.01);

  return {
    kept_meals: kept.map((e) => e.recommendation),
    replaced_meals: replaced.map((e) => e.recommendation),
    prefers_tags: [...prefers_tags],
    avoids_tags: [...avoids_tags],
    ledger_evidence: mealEntries.slice(0, 8).map((e) => `ledger:${e.id}`),
    confidence_boost,
  };
}

export function ledgerContextForMeal(
  mealName: string,
  outcomes: ProcessedOutcomes,
): { note?: string; was_replaced_before: boolean; similar_kept: boolean } {
  const lower = mealName.toLowerCase();
  const was_replaced_before = outcomes.replaced_meals.some(
    (m) => m.toLowerCase().includes(lower) || lower.includes(m.toLowerCase()),
  );
  const similar_kept = outcomes.kept_meals.some(
    (m) => m.toLowerCase().includes(lower) || lower.includes(m.toLowerCase()),
  );

  let note: string | undefined;
  if (was_replaced_before) {
    note = `Last time you replaced something like "${mealName}" — Clara adjusted this pick.`;
  } else if (similar_kept) {
    note = `You've kept similar meals before — this fits your household pattern.`;
  }

  return { note, was_replaced_before, similar_kept };
}

export function formatRejectHistoryForAssistant(outcomes: ProcessedOutcomes): string {
  if (!outcomes.replaced_meals.length) return '';
  const recent = outcomes.replaced_meals.slice(0, 3);
  return `Recent meal plan feedback: Chef replaced ${recent.join(', ')}. Avoid similar patterns unless asked.`;
}
