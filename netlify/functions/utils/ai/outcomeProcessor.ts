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
  const domainEntries = entries.filter((e) => e.domain === domain);

  if (domain === 'preference') {
    const prefers_tags = new Set<string>();
    const avoids_tags = new Set<string>();
    for (const e of domainEntries) {
      const kind = e.metadata?.kind as string | undefined;
      const subject =
        (e.metadata?.subject as string | undefined) ??
        e.recommendation.replace(/^(avoid|prefer|allergy|household):\s*/i, '');
      if (kind === 'prefer') prefers_tags.add(subject);
      if (kind === 'avoid' || kind === 'allergy') avoids_tags.add(subject);
    }
    return {
      kept_meals: [],
      replaced_meals: [],
      prefers_tags: [...prefers_tags],
      avoids_tags: [...avoids_tags],
      ledger_evidence: domainEntries.slice(0, 8).map((e) => `ledger:${e.id}`),
      confidence_boost: Math.min(0.1, domainEntries.length * 0.02),
    };
  }

  const mealEntries = domainEntries;
  /** Only explicit user Keep/Replace actions — never pending generation rows */
  const reviewed = mealEntries.filter(
    (e) => e.outcome_at && (e.metadata?.action === 'keep' || e.metadata?.action === 'replace'),
  );
  const kept = reviewed.filter((e) => e.outcome === 'accepted');
  const replaced = reviewed.filter((e) => e.outcome === 'replaced');

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

function normalizeMealName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

function exactMealMatch(a: string, b: string): boolean {
  return normalizeMealName(a) === normalizeMealName(b);
}

export function ledgerContextForMeal(
  mealName: string,
  outcomes: ProcessedOutcomes,
): { note?: string; was_replaced_before: boolean; exact_kept_before: boolean; exact_kept_name?: string } {
  const exactReplaced = outcomes.replaced_meals.find((m) => exactMealMatch(m, mealName));
  const exactKept = outcomes.kept_meals.find((m) => exactMealMatch(m, mealName));

  let note: string | undefined;
  if (exactReplaced) {
    note = `You replaced "${exactReplaced}" on a previous plan — this is a different pick.`;
  } else if (exactKept) {
    note = `You kept "${exactKept}" before — same meal, same call.`;
  }

  return {
    note,
    was_replaced_before: !!exactReplaced,
    exact_kept_before: !!exactKept,
    exact_kept_name: exactKept,
  };
}

export function formatRejectHistoryForAssistant(outcomes: ProcessedOutcomes): string {
  if (!outcomes.replaced_meals.length) return '';
  const recent = outcomes.replaced_meals.slice(0, 3);
  return `Recent meal plan feedback: Chef replaced ${recent.join(', ')}. Avoid similar patterns unless asked.`;
}
