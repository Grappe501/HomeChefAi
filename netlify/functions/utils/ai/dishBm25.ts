/**
 * Agent Suite v6 Phase 2 — BM25 retrieval over dish corpus with pantry re-ranking.
 */

import type { InventoryItem, Profile } from '../../../../src/types/index.js';
import type { DishMatch } from '../../../../src/types/dish.js';
import { dishKeywordsFromNode } from '../../../../src/types/dish.js';
import { listAllDishes } from './dishCatalog.js';
import { getKnowledgeNode } from './knowledgeLoader.js';
import { matchDishesForPantry, scoreDishNode } from './dishMatcher.js';
import { listAvailableKnowledgeIds } from '../inventoryContext.js';

interface DishSearchDoc {
  id: string;
  title: string;
  cuisine_id: string;
  course: string;
  termSet: Set<string>;
  length: number;
}

let cachedDocs: DishSearchDoc[] | null = null;
let cachedDf: Map<string, number> | null = null;
let cachedAvgDl = 0;

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

function buildSearchDocs(): DishSearchDoc[] {
  if (cachedDocs) return cachedDocs;
  const docs: DishSearchDoc[] = [];
  for (const node of listAllDishes()) {
    const attrs = node.attributes ?? {};
    const keywords = dishKeywordsFromNode(attrs);
    const blob = [node.display_name, node.description ?? '', ...keywords, String(attrs.cuisine_id ?? '')].join(' ');
    const terms = tokenizeForSearch(blob);
    const termSet = new Set(terms);
    docs.push({
      id: node.id,
      title: node.display_name,
      cuisine_id: String(attrs.cuisine_id ?? ''),
      course: String(attrs.course ?? 'main'),
      termSet,
      length: terms.length || 1,
    });
  }
  cachedDocs = docs;
  cachedAvgDl = docs.reduce((s, d) => s + d.length, 0) / Math.max(docs.length, 1);
  const df = new Map<string, number>();
  for (const doc of docs) {
    for (const t of doc.termSet) {
      df.set(t, (df.get(t) ?? 0) + 1);
    }
  }
  cachedDf = df;
  return docs;
}

function bm25Score(queryTerms: string[], doc: DishSearchDoc, N: number, df: Map<string, number>, avgdl: number): number {
  const k1 = 1.5;
  const b = 0.75;
  let score = 0;
  const termCounts = new Map<string, number>();
  for (const t of doc.termSet) {
    termCounts.set(t, (termCounts.get(t) ?? 0) + 1);
  }
  for (const term of queryTerms) {
    if (!doc.termSet.has(term)) continue;
    const freq = termCounts.get(term) ?? 1;
    const docFreq = df.get(term) ?? 1;
    const idf = Math.log(1 + (N - docFreq + 0.5) / (docFreq + 0.5));
    const denom = freq + k1 * (1 - b + (b * doc.length) / avgdl);
    score += idf * ((freq * (k1 + 1)) / denom);
  }
  return score;
}

export function searchDishesBm25(
  query: string,
  inventory: InventoryItem[],
  profile: Profile,
  options: {
    limit?: number;
    meal_type?: string;
    course?: string;
    min_pantry_match?: number;
  } = {},
): DishMatch[] {
  const limit = options.limit ?? 12;
  const queryTerms = [...new Set(tokenizeForSearch(query))];
  if (!queryTerms.length) {
    return matchDishesForPantry(inventory, profile, { limit, meal_type: options.meal_type, course: options.course });
  }

  const docs = buildSearchDocs();
  const N = docs.length;
  const df = cachedDf ?? new Map<string, number>();
  const avgdl = cachedAvgDl || 1;

  const candidates = docs.filter((d) => queryTerms.some((t) => d.termSet.has(t)));
  const pool = candidates.length ? candidates : docs.slice(0, 8000);

  const bm25Ranked = pool
    .map((doc) => ({ doc, bm25: bm25Score(queryTerms, doc, N, df, avgdl) }))
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
  const idToNode = new Map(listAllDishes().map((d) => [d.id, d]));

  const scored: DishMatch[] = [];
  for (const { doc, bm25 } of bm25Ranked) {
    const node = idToNode.get(doc.id);
    if (!node) continue;
    const row = scoreDishNode(node, inventory, kidSet, prefs);
    if (!row) continue;
    if (options.meal_type && !row.meal_types.includes(options.meal_type)) continue;
    if (options.course && row.course !== options.course) continue;
    if (options.min_pantry_match != null && row.pantry_match < options.min_pantry_match) continue;
    const cuisine = getKnowledgeNode(row.cuisine_id);
    const combined = row.score + Math.min(bm25, 8) * 0.04;
    scored.push({
      ...row,
      cuisine_label: cuisine?.display_name ?? row.cuisine_id.replace(/^cuisine\./, ''),
      score: combined,
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

  return picked;
}

export function clearDishBm25Cache(): void {
  cachedDocs = null;
  cachedDf = null;
  cachedAvgDl = 0;
}
