/**
 * Agent Suite v6 Phase 4 — compact dish search pack (BM25 without full corpus in bundle).
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { resolveKnowledgeRoot } from './knowledgeLoader.js';

export interface DishSearchDoc {
  id: string;
  title: string;
  cuisine_key: string;
  cuisine_id: string;
  course: string;
  meal_types: string[];
  prep_time_minutes: number;
  tags: string[];
  terms: string[];
  ingredient_names: string[];
  required_staples: string[];
  description?: string;
}

interface SearchPack {
  version: number;
  total: number;
  docs: DishSearchDoc[];
}

let cachedPack: SearchPack | null = null;
let cachedDf: Map<string, number> | null = null;
let cachedAvgLen = 0;

function packPath(): string {
  return join(resolveKnowledgeRoot(), 'search', 'dish-bm25-pack.json');
}

export function loadSearchPack(): DishSearchDoc[] {
  if (cachedPack) return cachedPack.docs;
  const path = packPath();
  if (!existsSync(path)) return [];
  cachedPack = JSON.parse(readFileSync(path, 'utf8')) as SearchPack;
  return cachedPack.docs;
}

export function getSearchPackStats(): { total: number; loaded: number } {
  const docs = loadSearchPack();
  return { total: cachedPack?.total ?? docs.length, loaded: docs.length };
}

export function buildPackIndex(): { df: Map<string, number>; avgLen: number; N: number } {
  const docs = loadSearchPack();
  if (cachedDf && docs.length) return { df: cachedDf, avgLen: cachedAvgLen, N: docs.length };

  const df = new Map<string, number>();
  let lenSum = 0;
  for (const doc of docs) {
    lenSum += doc.terms.length || 1;
    for (const t of new Set(doc.terms)) {
      df.set(t, (df.get(t) ?? 0) + 1);
    }
  }
  cachedDf = df;
  cachedAvgLen = lenSum / Math.max(docs.length, 1);
  return { df, avgLen: cachedAvgLen, N: docs.length };
}

export function getDocById(id: string): DishSearchDoc | undefined {
  return loadSearchPack().find((d) => d.id === id);
}

export function clearSearchPackCache(): void {
  cachedPack = null;
  cachedDf = null;
  cachedAvgLen = 0;
}
