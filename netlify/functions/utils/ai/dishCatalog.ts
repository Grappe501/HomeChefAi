/**
 * Partitioned dish corpus — search pack in bundle; full corpus via static CDN or local disk.
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import type { KnowledgeNode } from '../../../../src/types/knowledge.js';
import { resolveKnowledgeRoot, getKnowledgeNode, listKnowledgeNodes } from './knowledgeLoader.js';
import { getDocById, loadSearchPack, type DishSearchDoc } from './dishSearchPack.js';

export interface DishCatalogEntry extends KnowledgeNode {
  attributes: KnowledgeNode['attributes'] & {
    course?: string;
    occasions?: string[];
    meal_types?: string[];
  };
}

export interface DishManifest {
  version: number;
  total: number;
  by_cuisine: Record<string, number>;
  by_course?: Record<string, number>;
  generated_at?: string;
}

let cachedDishes: DishCatalogEntry[] | null = null;
let cachedManifest: DishManifest | null = null;
let cachedById: Map<string, DishCatalogEntry> | null = null;
const cuisineFileCache = new Map<string, DishCatalogEntry[]>();

function corpusDir(root: string): string {
  return join(root, 'dishes', 'corpus');
}

function staticCorpusBase(): string {
  return (
    process.env.CORPUS_STATIC_URL?.replace(/\/$/, '')
    || process.env.URL
    || process.env.DEPLOY_PRIME_URL
    || 'https://home-chef-ai.netlify.app'
  );
}

function loadManifest(root: string): DishManifest {
  if (cachedManifest) return cachedManifest;
  const path = join(root, 'dish-manifest.json');
  if (!existsSync(path)) {
    cachedManifest = { version: 2, total: loadSearchPack().length, by_cuisine: {} };
    return cachedManifest;
  }
  cachedManifest = JSON.parse(readFileSync(path, 'utf8')) as DishManifest;
  return cachedManifest;
}

function loadCuisineFileLocal(cuisineKey: string): DishCatalogEntry[] {
  if (cuisineFileCache.has(cuisineKey)) return cuisineFileCache.get(cuisineKey)!;
  const root = resolveKnowledgeRoot();
  const path = join(corpusDir(root), `${cuisineKey}.json`);
  if (!existsSync(path)) return [];
  const raw = JSON.parse(readFileSync(path, 'utf8')) as { dishes?: DishCatalogEntry[] };
  const dishes = raw.dishes ?? [];
  cuisineFileCache.set(cuisineKey, dishes);
  return dishes;
}

async function loadCuisineFileRemote(cuisineKey: string): Promise<DishCatalogEntry[]> {
  if (cuisineFileCache.has(cuisineKey)) return cuisineFileCache.get(cuisineKey)!;
  const url = `${staticCorpusBase()}/data/ai/dishes/corpus/${cuisineKey}.json`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const raw = (await res.json()) as { dishes?: DishCatalogEntry[] };
  const dishes = raw.dishes ?? [];
  cuisineFileCache.set(cuisineKey, dishes);
  return dishes;
}

async function loadCuisineDishes(cuisineKey: string): Promise<DishCatalogEntry[]> {
  const local = loadCuisineFileLocal(cuisineKey);
  if (local.length) return local;
  return loadCuisineFileRemote(cuisineKey);
}

export function loadDishCatalog(force = false): DishCatalogEntry[] {
  if (!force && cachedDishes) return cachedDishes;

  const root = resolveKnowledgeRoot();
  const dir = corpusDir(root);
  const dishes: DishCatalogEntry[] = [];

  if (existsSync(dir)) {
    for (const file of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
      dishes.push(...loadCuisineFileLocal(file.replace('.json', '')));
    }
  }

  if (dishes.length === 0) {
    cachedDishes = [];
  } else {
    cachedDishes = dishes;
  }

  cachedById = new Map((cachedDishes ?? []).map((d) => [d.id, d]));
  return cachedDishes ?? [];
}

export function listAllDishes(): DishCatalogEntry[] {
  const loaded = loadDishCatalog();
  if (loaded.length) return loaded;
  return [];
}

export function searchDocToNode(doc: DishSearchDoc): DishCatalogEntry {
  return {
    id: doc.id,
    type: 'dish',
    display_name: doc.title,
    description: doc.description,
    attributes: {
      cuisine_id: doc.cuisine_id,
      course: doc.course,
      meal_types: doc.meal_types,
      prep_time_minutes: doc.prep_time_minutes,
      tags: doc.tags,
      ingredients: doc.ingredient_names.map((name) => ({ name, quantity: 1, unit: '' })),
      required_staples: doc.required_staples,
      steps: [],
    },
  };
}

export async function getDishFromCatalogAsync(id: string): Promise<DishCatalogEntry | null> {
  if (!cachedById) loadDishCatalog();
  const hit = cachedById?.get(id);
  if (hit) return hit;

  const doc = getDocById(id);
  if (!doc) {
    const node = getKnowledgeNode(id);
    return node?.type === 'dish' ? (node as DishCatalogEntry) : null;
  }

  const cuisineDishes = await loadCuisineDishes(doc.cuisine_key);
  const full = cuisineDishes.find((d) => d.id === id);
  if (full) {
    if (!cachedById) cachedById = new Map();
    cachedById.set(id, full);
    return full;
  }

  return searchDocToNode(doc);
}

export function getDishFromCatalog(id: string): DishCatalogEntry | null {
  if (!cachedById) loadDishCatalog();
  const hit = cachedById?.get(id);
  if (hit) return hit;

  const doc = getDocById(id);
  if (doc) return searchDocToNode(doc);

  const node = getKnowledgeNode(id);
  return node?.type === 'dish' ? (node as DishCatalogEntry) : null;
}

export function getDishManifest(): DishManifest {
  const manifest = loadManifest(resolveKnowledgeRoot());
  if (manifest.total > 0) return manifest;
  return { version: 3, total: loadSearchPack().length, by_cuisine: manifest.by_cuisine };
}

export function getDishCorpusStats(): {
  total: number;
  by_course: Record<string, number>;
  by_cuisine: Record<string, number>;
} {
  const manifest = getDishManifest();
  if (manifest.total > 0) {
    return { total: manifest.total, by_course: manifest.by_course ?? {}, by_cuisine: manifest.by_cuisine };
  }
  const docs = loadSearchPack();
  const by_course: Record<string, number> = {};
  for (const d of docs) {
    by_course[d.course] = (by_course[d.course] ?? 0) + 1;
  }
  return { total: docs.length, by_course, by_cuisine: manifest.by_cuisine };
}

export async function hydrateDishNodes(ids: string[]): Promise<Map<string, DishCatalogEntry>> {
  const out = new Map<string, DishCatalogEntry>();
  const byCuisine = new Map<string, string[]>();

  for (const id of ids) {
    const existing = getDishFromCatalog(id);
    if (existing?.attributes?.steps?.length) {
      out.set(id, existing);
      continue;
    }
    const doc = getDocById(id);
    const key = doc?.cuisine_key ?? 'american';
    const list = byCuisine.get(key) ?? [];
    list.push(id);
    byCuisine.set(key, list);
  }

  await Promise.all(
    [...byCuisine.entries()].map(async ([cuisine, cuisineIds]) => {
      const dishes = await loadCuisineDishes(cuisine);
      for (const id of cuisineIds) {
        const full = dishes.find((d) => d.id === id);
        if (full) out.set(id, full);
        else {
          const doc = getDocById(id);
          if (doc) out.set(id, searchDocToNode(doc));
        }
      }
    }),
  );

  return out;
}

export function clearDishCatalogCache(): void {
  cachedDishes = null;
  cachedManifest = null;
  cachedById = null;
  cuisineFileCache.clear();
}
