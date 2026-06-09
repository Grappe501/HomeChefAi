/**
 * Agent Suite v6 Phase 4 — compact dish search pack (served from static CDN in production).
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
let loadPromise: Promise<DishSearchDoc[]> | null = null;

function staticAssetBase(): string {
  return (
    process.env.CORPUS_STATIC_URL?.replace(/\/$/, '')
    || process.env.URL
    || process.env.DEPLOY_PRIME_URL
    || 'https://home-chef-ai.netlify.app'
  );
}

function packPath(): string {
  return join(resolveKnowledgeRoot(), 'search', 'dish-bm25-pack.json');
}

function loadFromDisk(): DishSearchDoc[] | null {
  const path = packPath();
  if (!existsSync(path)) return null;
  cachedPack = JSON.parse(readFileSync(path, 'utf8')) as SearchPack;
  return cachedPack.docs;
}

async function loadFromStatic(): Promise<DishSearchDoc[]> {
  const url = `${staticAssetBase()}/data/ai/search/dish-bm25-pack.json`;
  const res = await fetch(url);
  if (!res.ok) return [];
  cachedPack = (await res.json()) as SearchPack;
  return cachedPack.docs;
}

/** Load search pack once — local disk in dev, static CDN in production. */
export async function ensureSearchPack(): Promise<DishSearchDoc[]> {
  if (cachedPack?.docs.length) return cachedPack.docs;
  if (!loadPromise) {
    loadPromise = (async () => {
      const local = loadFromDisk();
      if (local?.length) return local;
      const remote = await loadFromStatic();
      return remote;
    })();
  }
  return loadPromise;
}

export function loadSearchPack(): DishSearchDoc[] {
  if (cachedPack) return cachedPack.docs;
  const local = loadFromDisk();
  return local ?? [];
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
  loadPromise = null;
}
