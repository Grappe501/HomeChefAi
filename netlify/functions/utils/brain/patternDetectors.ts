/**
 * Brain 2.0 pattern detectors — buy-never-use, staples, leftovers, cook rhythm, traditions.
 */

import type { DetectedPattern, HouseholdGraphEdge } from '../../../../src/types/householdGraph.js';
import type { BrainContext } from './types.js';
import { DAY_NAMES, daysBetween, normalizeKey } from './types.js';
import type { DecisionLedgerEntry } from '../ai/decisionLedger.js';

export interface PatternDetectorContext extends BrainContext {
  graphEdges: HouseholdGraphEdge[];
  ledgerEntries: DecisionLedgerEntry[];
  inventory: { name: string; quantity?: number; knowledge_id?: string }[];
}

export function detectHouseholdPatterns(ctx: PatternDetectorContext): DetectedPattern[] {
  const patterns: DetectedPattern[] = [];
  patterns.push(...detectBuyNeverUse(ctx));
  patterns.push(...detectStapleIdentity(ctx));
  patterns.push(...detectLeftoverFrequency(ctx));
  patterns.push(...detectCookNightRhythm(ctx));
  patterns.push(...detectEmergingTraditions(ctx));
  patterns.push(...detectLedgerPreferences(ctx));
  return patterns.sort((a, b) => b.confidence - a.confidence);
}

function detectBuyNeverUse(ctx: PatternDetectorContext): DetectedPattern[] {
  const purchased = new Map<string, { name: string; count: number; receiptIds: string[] }>();
  const used = new Set<string>();

  for (const receipt of ctx.receipts.filter((r) => r.verified)) {
    for (const item of receipt.items) {
      const key = normalizeKey(item.name);
      const entry = purchased.get(key) || { name: item.name, count: 0, receiptIds: [] };
      entry.count++;
      entry.receiptIds.push(receipt.id);
      purchased.set(key, entry);
    }
  }

  for (const log of ctx.usageLogs) {
    for (const u of (log as { items_used?: { name: string }[] }).items_used ?? []) {
      used.add(normalizeKey(u.name));
    }
  }

  const results: DetectedPattern[] = [];
  for (const [key, data] of purchased) {
    if (data.count < 2 || used.has(key)) continue;
    const confidence = Math.min(0.9, 0.45 + data.count * 0.12);
    results.push({
      id: `buy_never_use_${key}`,
      type: 'buy_never_use',
      headline: `${data.name} — bought but rarely used`,
      insight: `Chef, you buy ${data.name.toLowerCase()} but it rarely shows up in your cooking logs.`,
      action_prompt: `Want me to prioritize meals that use ${data.name.toLowerCase()} this week?`,
      confidence,
      evidence: data.receiptIds.map((id) => `receipt:${id}`),
      metadata: { item_key: key, purchase_count: data.count },
    });
  }
  return results.slice(0, 3);
}

function detectStapleIdentity(ctx: PatternDetectorContext): DetectedPattern[] {
  const staples = ctx.graphEdges.filter((e) => e.edge_type === 'STAPLE' && e.from_key === 'household');
  const results: DetectedPattern[] = [];

  for (const edge of staples.slice(0, 5)) {
    const inv = ctx.inventory.find((i) => normalizeKey(i.name) === edge.to_key);
    const name = inv?.name ?? edge.to_key.replace(/_/g, ' ');
    const purchaseEdge = ctx.graphEdges.find((e) => e.edge_type === 'PURCHASED' && e.to_key === edge.to_key);
    const purchaseCount = purchaseEdge?.weight ?? 0;
    if (purchaseCount < 2 && !inv) continue;

    results.push({
      id: `staple_${edge.to_key}`,
      type: 'staple_identity',
      headline: `${name} — kitchen staple`,
      insight: `Chef, ${name.toLowerCase()} is part of this kitchen's identity — it's always on hand or repurchased often.`,
      confidence: Math.min(0.92, 0.5 + edge.weight * 0.2 + purchaseCount * 0.05),
      evidence: edge.evidence,
      metadata: { item_key: edge.to_key, knowledge_id: inv?.knowledge_id },
    });
  }
  return results.slice(0, 4);
}

function detectLeftoverFrequency(ctx: PatternDetectorContext): DetectedPattern[] {
  const leftoverLogs = ctx.usageLogs.filter((l) => l.meal_name?.toLowerCase().includes('leftover'));
  if (leftoverLogs.length < 2) return [];

  const share = leftoverLogs.length / Math.max(ctx.usageLogs.length, 1);
  if (share < 0.15) return [];

  return [{
    id: 'leftover_frequency',
    type: 'leftover_frequency',
    headline: 'Leftover-friendly kitchen',
    insight: `Chef, about ${Math.round(share * 100)}% of your logged meals are leftovers — this kitchen plans ahead.`,
    action_prompt: 'I can lean into batch-cook dinners and leftover lunches in your next plan.',
    confidence: Math.min(0.88, 0.5 + share),
    evidence: leftoverLogs.slice(0, 5).map((l) => `usage:${l.id}`),
    metadata: { leftover_count: leftoverLogs.length, share },
  }];
}

function detectCookNightRhythm(ctx: PatternDetectorContext): DetectedPattern[] {
  if (ctx.usageLogs.length < 4) return [];

  const dayCounts = new Array(7).fill(0) as number[];
  const logIdsByDay = new Map<number, string[]>();

  for (const log of ctx.usageLogs) {
    const d = new Date(log.created_at).getDay();
    dayCounts[d]++;
    const ids = logIdsByDay.get(d) || [];
    ids.push(log.id);
    logIdsByDay.set(d, ids);
  }

  const total = dayCounts.reduce((s, c) => s + c, 0);
  const results: DetectedPattern[] = [];

  for (let i = 0; i < 7; i++) {
    if (dayCounts[i] < 2) continue;
    const share = dayCounts[i] / total;
    if (share < 0.22) continue;
    const dayName = DAY_NAMES[i];
    results.push({
      id: `cook_night_${dayName.toLowerCase()}`,
      type: 'cook_night_rhythm',
      headline: `${dayName}s — cook night rhythm`,
      insight: `Chef, ${dayName} is one of your most active cooking days (${Math.round(share * 100)}% of logs).`,
      confidence: Math.min(0.9, 0.55 + share),
      evidence: (logIdsByDay.get(i) ?? []).map((id) => `usage:${id}`),
      metadata: { day: dayName, share },
    });
  }
  return results.slice(0, 2);
}

function detectEmergingTraditions(ctx: PatternDetectorContext): DetectedPattern[] {
  const mealCounts = new Map<string, { label: string; count: number; logIds: string[] }>();

  for (const log of ctx.usageLogs) {
    if (!log.meal_name?.trim()) continue;
    const key = normalizeKey(log.meal_name);
    const entry = mealCounts.get(key) || { label: log.meal_name, count: 0, logIds: [] };
    entry.count++;
    entry.logIds.push(log.id);
    mealCounts.set(key, entry);
  }

  for (const entry of ctx.ledgerEntries.filter((e) => e.outcome === 'accepted')) {
    const key = normalizeKey(entry.recommendation);
    const existing = mealCounts.get(key) || { label: entry.recommendation, count: 0, logIds: [] };
    existing.count += 1;
    existing.logIds.push(`ledger:${entry.id}`);
    mealCounts.set(key, existing);
  }

  const results: DetectedPattern[] = [];
  for (const [key, data] of mealCounts) {
    if (data.count < 3) continue;
    results.push({
      id: `tradition_${key}`,
      type: 'emerging_tradition',
      headline: `${data.label} — emerging tradition`,
      insight: `Chef, ${data.label.toLowerCase()} keeps coming back — it may be becoming a household tradition.`,
      confidence: Math.min(0.93, 0.5 + data.count * 0.1),
      evidence: data.logIds.slice(0, 6),
      metadata: { meal_key: key, occurrences: data.count },
    });
  }
  return results.slice(0, 2);
}

function detectLedgerPreferences(ctx: PatternDetectorContext): DetectedPattern[] {
  const replaced = ctx.ledgerEntries.filter((e) => e.outcome === 'replaced').slice(0, 5);
  const kept = ctx.ledgerEntries.filter((e) => e.outcome === 'accepted').slice(0, 5);
  const results: DetectedPattern[] = [];

  if (kept.length >= 2) {
    results.push({
      id: 'ledger_kept_patterns',
      type: 'ledger_preference',
      headline: 'Meals you keep coming back to',
      insight: `Chef, you've kept ${kept.length} recent plan meals — I'll reinforce similar choices.`,
      confidence: 0.78,
      evidence: kept.map((e) => `ledger:${e.id}`),
      metadata: { kept_meals: kept.map((e) => e.recommendation) },
    });
  }

  if (replaced.length >= 2) {
    results.push({
      id: 'ledger_avoid_patterns',
      type: 'ledger_preference',
      headline: 'Patterns to skip next time',
      insight: `Chef, you replaced ${replaced.length} meals recently — I'll avoid those patterns.`,
      action_prompt: `Replace noted: ${replaced.map((e) => e.recommendation).slice(0, 3).join(', ')}`,
      confidence: 0.82,
      evidence: replaced.map((e) => `ledger:${e.id}`),
      metadata: { replaced_meals: replaced.map((e) => e.recommendation) },
    });
  }
  return results;
}

export function patternsToMemories(patterns: DetectedPattern[]): import('./types.js').GeneratedMemory[] {
  return patterns.map((p) => ({
    memory_type: patternMemoryType(p.type),
    subject_key: p.id,
    headline: p.headline,
    insight: p.insight,
    action_prompt: p.action_prompt,
    confidence: p.confidence,
    surfaced: p.confidence >= 0.65,
    metadata: {
      source_events: p.evidence,
      observation_count: p.evidence.length,
      history_days: 30,
      confidence: p.confidence,
      formula: `brain2_pattern_${p.type}`,
      evidence_lines: [
        ...p.evidence.slice(0, 4).map((e) => (e.startsWith('ledger:') ? `Decision ledger: ${e}` : e)),
        `Pattern: ${p.type.replace(/_/g, ' ')}`,
        `Confidence: ${Math.round(p.confidence * 100)}%`,
      ],
      pattern_type: p.type,
      ...p.metadata,
    },
  }));
}

function patternMemoryType(type: DetectedPattern['type']): import('../../../../src/types/platform.js').MemoryType {
  switch (type) {
    case 'buy_never_use':
    case 'staple_identity':
      return 'consumption';
    case 'leftover_frequency':
    case 'cook_night_rhythm':
      return 'habit';
    case 'emerging_tradition':
      return 'tradition';
    case 'ledger_preference':
      return 'preference';
    default:
      return 'habit';
  }
}
