/**
 * Agent Suite v6 Phase 2/4 — BM25 retrieval via compact search pack + optional corpus hydrate.
 */

import type { InventoryItem, Profile } from '../../../../src/types/index.js';
import type { DishMatch } from '../../../../src/types/dish.js';
import { getKnowledgeNode } from './knowledgeLoader.js';
import { matchDishesForPantry, scoreDishNode, scoreDishFromDoc } from './dishMatcher.js';
import { loadSearchPack, buildPackIndex, type DishSearchDoc } from './dishSearchPack.js';
import { getDishFromCatalog, hydrateDishNodes } from './dishCatalog.js';
import { listAvailableKnowledgeIds } from '../inventoryContext.js';

const STOP = new Set([
  'the', 'and', 'for', 'with', 'from', 'your', 'what', 'can', 'make', 'cook', 'how', 'some', 'any',
]);

export function tokenizeForSearch(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP.has(t));
}

function bm25Score(
  queryTerms: string[],
  doc: DishSearchDoc,
  N: number,
  df: Map<string, number>,
  avgdl: number,
): number {
  const k1 = 1.5;
  const b = 0.75;
  let score = 0;
  const termSet = new Set(doc.terms);
  const termCounts = new Map<string, number>();
  for (const t of doc.terms) termCounts.set(t, (termCounts.get(t) ?? 0) + 1);
  const dl = doc.terms.length || 1;

  for (const term of queryTerms) {
    if (!termSet.has(term)) continue;
    const freq = termCounts.get(term) ?? 1;
    const docFreq = df.get(term) ?? 1;
    const idf = Math.log(1 + (N - docFreq + 0.5) / (docFreq + 0.5));
    const denom = freq + k1 * (1 - b + (b * dl) / avgdl);
    score += idf * ((freq * (k1 + 1)) / denom);
  }
  return score;
}

export async function searchDishesBm25(
  query: string,
  inventory: InventoryItem[],
  profile: Profile,
  options: {
    limit?: number;
    meal_type?: string;
    course?: string;
    min_pantry_match?: number;
  } = {},
): Promise<DishMatch[]> {
  const limit = options.limit ?? 12;
  const queryTerms = [...new Set(tokenizeForSearch(query))];
  if (!queryTerms.length) {
    return matchDishesForPantry(inventory, profile, { limit, meal_type: options.meal_type, course: options.course });
  }

  const docs = loadSearchPack();
  if (!docs.length) {
    return matchDishesForPantry(inventory, profile, { limit, meal_type: options.meal_type, course: options.course });
  }

  const { df, avgLen, N } = buildPackIndex();
  const candidates = docs.filter((d) => queryTerms.some((t) => d.terms.includes(t)));
  const pool = candidates.length ? candidates : docs.slice(0, 8000);

  const bm25Ranked = pool
    .map((doc) => ({ doc, bm25: bm25Score(queryTerms, doc, N, df, avgLen) }))
    .filter((r) => r.bm25 > 0)
    .sort((a, b) => b.bm25 - a.bm25)
    .slice(0, 120);

  if (!bm25Ranked.length) {
    return matchDishesForPantry(inventory, profile, { limit, meal_type: options.meal_type, course: options.course });
  }

  const kidSet = new Set(listAvailableKnowledgeIds(inventory));
  const prefs = new Set(
    (profile.cuisine_preferences ?? []).map((p) => `cuisine.${p.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`),
  );

  const scored: DishMatch[] = [];
  for (const { doc, bm25 } of bm25Ranked) {
    const node = getDishFromCatalog(doc.id);
    if (!node) continue;
    const row = scoreDishNode(node, inventory, kidSet, prefs) ?? scoreDishFromDoc(doc, inventory, kidSet, prefs);
    if (!row) continue;
    if (options.meal_type && !row.meal_types.includes(options.meal_type)) continue;
    if (options.course && row.course !== options.course) continue;
    if (options.min_pantry_match != null && row.pantry_match < options.min_pantry_match) continue;
    const cuisine = getKnowledgeNode(row.cuisine_id);
    scored.push({
      ...row,
      cuisine_label: cuisine?.display_name ?? row.cuisine_id.replace(/^cuisine\./, ''),
      score: row.score + Math.min(bm25, 8) * 0.04,
    });
  }

  scored.sort((a, b) => b.score - a.score);
  const picked: DishMatch[] = [];
  const seen = new Set<string>();
  for (const row of scored) {
    const key = row.title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    picked.push(row);
    if (picked.length >= limit) break;
  }

  if (picked.length < Math.min(3, limit)) {
    const pantryFallback = matchDishesForPantry(inventory, profile, { limit: limit - picked.length });
    for (const p of pantryFallback) {
      if (seen.has(p.title.toLowerCase())) continue;
      picked.push(p);
      if (picked.length >= limit) break;
    }
  }

  const hydrated = await hydrateDishNodes(picked.map((p) => p.id));
  return picked.map((p) => {
    const full = hydrated.get(p.id);
    if (!full) return p;
    const kidSet2 = new Set(listAvailableKnowledgeIds(inventory));
    const prefs2 = new Set(
      (profile.cuisine_preferences ?? []).map((c) => `cuisine.${c.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`),
    );
    return { ...(scoreDishNode(full, inventory, kidSet2, prefs2) ?? p), cuisine_label: p.cuisine_label, score: p.score };
  });
}

export function clearDishBm25Cache(): void {
  /* pack cache cleared via dishSearchPack */
}
