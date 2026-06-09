/**
 * Partitioned dish corpus loader — reads data/ai/dishes/corpus/*.json
 * Avoids loading 20k+ individual JSON files into the knowledge registry.
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import type { KnowledgeNode } from '../../../../src/types/knowledge.js';
import { resolveKnowledgeRoot, getKnowledgeNode, listKnowledgeNodes } from './knowledgeLoader.js';

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
  by_course: Record<string, number>;
  generated_at?: string;
}

let cachedDishes: DishCatalogEntry[] | null = null;
let cachedManifest: DishManifest | null = null;
let cachedById: Map<string, DishCatalogEntry> | null = null;

function corpusDir(root: string): string {
  return join(root, 'dishes', 'corpus');
}

function loadManifest(root: string): DishManifest {
  if (cachedManifest) return cachedManifest;
  const path = join(root, 'dish-manifest.json');
  if (!existsSync(path)) {
    cachedManifest = { version: 2, total: 0, by_cuisine: {}, by_course: {} };
    return cachedManifest;
  }
  cachedManifest = JSON.parse(readFileSync(path, 'utf8')) as DishManifest;
  return cachedManifest;
}

export function loadDishCatalog(force = false): DishCatalogEntry[] {
  if (!force && cachedDishes) return cachedDishes;

  const root = resolveKnowledgeRoot();
  const dir = corpusDir(root);
  const dishes: DishCatalogEntry[] = [];

  if (existsSync(dir)) {
    for (const file of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
      try {
        const raw = JSON.parse(readFileSync(join(dir, file), 'utf8')) as { dishes?: DishCatalogEntry[] };
        if (Array.isArray(raw.dishes)) dishes.push(...raw.dishes);
      } catch (err) {
        console.warn('Failed to load dish corpus file:', file, err);
      }
    }
  }

  if (dishes.length === 0) {
    cachedDishes = listKnowledgeNodes('dish') as DishCatalogEntry[];
  } else {
    cachedDishes = dishes;
  }

  cachedById = new Map(cachedDishes.map((d) => [d.id, d]));
  return cachedDishes;
}

export function getDishFromCatalog(id: string): DishCatalogEntry | null {
  if (!cachedById) loadDishCatalog();
  const hit = cachedById?.get(id);
  if (hit) return hit;
  const node = getKnowledgeNode(id);
  return node?.type === 'dish' ? (node as DishCatalogEntry) : null;
}

export function getDishManifest(): DishManifest {
  return loadManifest(resolveKnowledgeRoot());
}

export function getDishCorpusStats(): {
  total: number;
  by_course: Record<string, number>;
  by_cuisine: Record<string, number>;
} {
  const manifest = getDishManifest();
  if (manifest.total > 0) {
    return { total: manifest.total, by_course: manifest.by_course, by_cuisine: manifest.by_cuisine };
  }
  const dishes = loadDishCatalog();
  const by_course: Record<string, number> = {};
  for (const d of dishes) {
    const c = String(d.attributes?.course ?? 'main');
    by_course[c] = (by_course[c] ?? 0) + 1;
  }
  return { total: dishes.length, by_course, by_cuisine: manifest.by_cuisine };
}

export function clearDishCatalogCache(): void {
  cachedDishes = null;
  cachedManifest = null;
  cachedById = null;
}

export function listAllDishes(): DishCatalogEntry[] {
  return loadDishCatalog();
}
