/**
 * Household graph writer — edges from receipts, usage, ledger, inventory.
 * Phase 5 · Brain 2.0
 */

import type { HouseholdGraphEdge, GraphEdgeType } from '../../../../src/types/householdGraph.js';
import type { DecisionLedgerEntry } from './decisionLedger.js';
import { normalizeKey } from '../brain/types.js';

export interface GraphWriterInput {
  userId: string;
  householdId?: string;
  receipts: { id: string; items: { name: string }[]; verified?: boolean }[];
  usageLogs: {
    id: string;
    meal_name?: string;
    items_used?: { name: string }[];
    created_at?: string;
  }[];
  ledgerEntries: DecisionLedgerEntry[];
  inventory: { name: string; knowledge_id?: string; created_at?: string }[];
  cuisinePreferences?: string[];
}

const HOUSEHOLD = 'household';

function bump(
  map: Map<string, HouseholdGraphEdge>,
  edgeType: GraphEdgeType,
  from: string,
  to: string,
  evidence: string,
  weight = 1,
): void {
  const key = `${edgeType}:${from}:${to}`;
  const existing = map.get(key);
  if (existing) {
    existing.weight += weight;
    if (!existing.evidence.includes(evidence)) existing.evidence.push(evidence);
    return;
  }
  map.set(key, { edge_type: edgeType, from_key: from, to_key: to, weight, evidence: [evidence] });
}

export function buildHouseholdGraph(input: GraphWriterInput): HouseholdGraphEdge[] {
  const map = new Map<string, HouseholdGraphEdge>();
  const purchased = new Set<string>();
  const usedInCook = new Set<string>();

  for (const receipt of input.receipts.filter((r) => r.verified !== false)) {
    for (const item of receipt.items) {
      const itemKey = normalizeKey(item.name);
      if (!itemKey) continue;
      purchased.add(itemKey);
      bump(map, 'PURCHASED', HOUSEHOLD, itemKey, `receipt:${receipt.id}`);
    }
  }

  for (const log of input.usageLogs) {
    if (log.meal_name?.trim()) {
      const mealKey = normalizeKey(log.meal_name);
      bump(map, 'COOKED', HOUSEHOLD, mealKey, `usage:${log.id}`);
    }
    for (const used of log.items_used ?? []) {
      const itemKey = normalizeKey(used.name);
      if (!itemKey) continue;
      usedInCook.add(itemKey);
      if (log.meal_name) {
        bump(map, 'USES', normalizeKey(log.meal_name), itemKey, `usage:${log.id}`, 0.5);
      }
    }
  }

  for (const entry of input.ledgerEntries) {
    const mealKey = normalizeKey(entry.recommendation);
    if (!mealKey) continue;
    const edgeType: GraphEdgeType =
      entry.outcome === 'accepted' ? 'KEPT' : entry.outcome === 'replaced' ? 'REPLACED' : 'KEPT';
    if (entry.outcome === 'accepted' || entry.outcome === 'replaced') {
      bump(map, edgeType, HOUSEHOLD, mealKey, `ledger:${entry.id}`, entry.confidence);
    }
    const recType = entry.metadata?.recommendation_type as string | undefined;
    if (recType && entry.outcome === 'accepted') {
      bump(map, 'PREFERS', HOUSEHOLD, normalizeKey(recType), `ledger:${entry.id}`, entry.confidence);
    }
    if (entry.outcome === 'replaced') {
      bump(map, 'AVOIDS', HOUSEHOLD, mealKey, `ledger:${entry.id}`, entry.confidence);
    }
  }

  for (const item of input.inventory) {
    const itemKey = normalizeKey(item.name);
    if (!itemKey) continue;
    if (purchased.has(itemKey) || (item.created_at && Date.now() - new Date(item.created_at).getTime() > 7 * 86400000)) {
      bump(map, 'STAPLE', HOUSEHOLD, itemKey, `inventory:${itemKey}`, 0.8);
    }
  }

  for (const pref of input.cuisinePreferences ?? []) {
    const tag = normalizeKey(pref);
    if (tag) bump(map, 'PREFERS', HOUSEHOLD, tag, `profile:cuisine:${tag}`, 1.2);
  }

  for (const itemKey of purchased) {
    if (!usedInCook.has(itemKey)) {
      bump(map, 'AVOIDS', HOUSEHOLD, itemKey, `pattern:buy_never_use:${itemKey}`, 0.4);
    }
  }

  return [...map.values()].sort((a, b) => b.weight - a.weight);
}

export function graphEdgesForSubject(edges: HouseholdGraphEdge[], subjectKey: string): HouseholdGraphEdge[] {
  return edges.filter((e) => e.to_key === subjectKey || e.from_key === subjectKey);
}
