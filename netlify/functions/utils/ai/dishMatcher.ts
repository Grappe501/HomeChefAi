/**
 * Match pantry inventory to structured dish corpus (data/ai/dishes/).
 */

import type { InventoryItem, Profile } from '../../../../src/types/index.js';
import type { KnowledgeNode } from '../../../../src/types/knowledge.js';
import type { DishIngredient, DishMatch } from '../../../../src/types/dish.js';
import {
  dishIngredientsFromNode,
  dishKeywordsFromNode,
  dishStepsFromNode,
} from '../../../../src/types/dish.js';
import { listAvailableKnowledgeIds } from '../inventoryContext.js';
import { getKnowledgeNode, listKnowledgeNodes } from './knowledgeLoader.js';
import { listAllDishes, getDishCorpusStats, searchDocToNode } from './dishCatalog.js';
import { loadSearchPack, type DishSearchDoc } from './dishSearchPack.js';

function inventoryNameSet(inventory: InventoryItem[]): Set<string> {
  return new Set(inventory.map((i) => i.name.toLowerCase()));
}

function inventoryMatchesName(inventory: InventoryItem[], name: string): boolean {
  const lower = name.toLowerCase();
  if (lower.length < 2) return false;
  return inventory.some((i) => {
    const n = i.name.toLowerCase();
    return n === lower || n.includes(lower) || lower.includes(n);
  });
}

function kidSetFromInventory(inventory: InventoryItem[]): Set<string> {
  return new Set(listAvailableKnowledgeIds(inventory));
}

export function scoreDishNode(
  node: KnowledgeNode,
  inventory: InventoryItem[],
  kidSet: Set<string>,
  preferenceCuisines: Set<string>,
): Omit<DishMatch, 'cuisine_label'> | null {
  const attrs = node.attributes ?? {};
  const ingredients = dishIngredientsFromNode(attrs);
  if (!ingredients.length) return null;

  const inPantry: string[] = [];
  const missing: string[] = [];
  for (const ing of ingredients) {
    if (inventoryMatchesName(inventory, ing.name)) inPantry.push(ing.name);
    else missing.push(ing.name);
  }

  const ingRatio = inPantry.length / ingredients.length;
  const required = (attrs.required_staples as string[] | undefined) ?? [];
  let stapleHits = 0;
  for (const sid of required) {
    if (kidSet.has(sid) || [...kidSet].some((k) => k.startsWith(`${sid}.`))) stapleHits++;
  }
  const stapleRatio = required.length ? stapleHits / required.length : 0.55;

  const cuisineId = String(attrs.cuisine_id ?? '');
  const prefBoost = preferenceCuisines.has(cuisineId) ? 0.12 : 0;
  const score = ingRatio * 0.65 + stapleRatio * 0.25 + prefBoost + (inPantry.length >= 2 ? 0.08 : 0);

  if (inPantry.length === 0 && stapleHits === 0) return null;

  return {
    id: node.id,
    title: node.display_name,
    description: node.description,
    cuisine_id: cuisineId,
    course: String(attrs.course ?? 'main'),
    occasions: (attrs.occasions as string[] | undefined) ?? [],
    meal_types: (attrs.meal_types as string[] | undefined) ?? ['dinner'],
    prep_time_minutes: Number(attrs.prep_time_minutes ?? 30),
    tags: (attrs.tags as string[] | undefined) ?? [],
    ingredients,
    steps: dishStepsFromNode(attrs),
    ingredients_in_pantry: inPantry,
    ingredients_missing: missing,
    pantry_match: Math.round(ingRatio * 100),
    score,
  };
}

export function scoreDishFromDoc(
  doc: DishSearchDoc,
  inventory: InventoryItem[],
  kidSet: Set<string>,
  preferenceCuisines: Set<string>,
): Omit<DishMatch, 'cuisine_label'> | null {
  return scoreDishNode(searchDocToNode(doc), inventory, kidSet, preferenceCuisines);
}

function preferenceCuisineIds(profile: Profile, cookingStyle?: string): Set<string> {
  const ids = new Set<string>();
  const styleMap: Record<string, string> = {
    comfort: 'cuisine.comfort',
    southern: 'cuisine.southern',
    cajun: 'cuisine.cajun',
    italian: 'cuisine.italian',
    mexican: 'cuisine.mexican',
    asian: 'cuisine.asian',
    bbq_smoked: 'cuisine.bbq',
    homestead: 'cuisine.comfort',
    meal_prep: 'cuisine.comfort',
    entertaining: 'cuisine.comfort',
  };
  if (cookingStyle && cookingStyle !== 'profile_default') {
    const cid = styleMap[cookingStyle];
    if (cid) ids.add(cid);
  }
  for (const pref of profile.cuisine_preferences ?? []) {
    const tag = pref.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    ids.add(`cuisine.${tag}`);
    for (const c of listKnowledgeNodes('cuisine')) {
      const tags = (c.attributes?.cuisine_tags as string[] | undefined) ?? [];
      if (tags.some((t) => t.includes(tag) || tag.includes(t))) ids.add(c.id);
    }
  }
  return ids;
}

export function matchDishesForPantry(
  inventory: InventoryItem[],
  profile: Profile,
  options: {
    limit?: number;
    meal_type?: string;
    course?: string;
    occasion?: string;
    cooking_style?: string;
    min_score?: number;
  } = {},
): DishMatch[] {
  const limit = options.limit ?? 20;
  const minScore = options.min_score ?? 0.25;
  const prefs = preferenceCuisineIds(profile, options.cooking_style);
  const kidSet = kidSetFromInventory(inventory);
  const corpus = listAllDishes();
  let packDocs = corpus.length ? null : loadSearchPack();
  if (packDocs && prefs.size) {
    packDocs = packDocs.filter((d) => prefs.has(d.cuisine_id));
    if (packDocs.length < 100) packDocs = loadSearchPack();
  }
  if (packDocs && packDocs.length > 12000) {
    const step = Math.ceil(packDocs.length / 12000);
    packDocs = packDocs.filter((_, i) => i % step === 0);
  }
  const source = corpus.length
    ? corpus.map((n) => ({ kind: 'node' as const, node: n }))
    : (packDocs ?? []).map((doc) => ({ kind: 'doc' as const, doc }));

  const scored = source
    .map((item) => {
      const row =
        item.kind === 'node'
          ? scoreDishNode(item.node, inventory, kidSet, prefs)
          : scoreDishFromDoc(item.doc, inventory, kidSet, prefs);
      if (!row) return null;
      if (options.meal_type && !row.meal_types.includes(options.meal_type)) return null;
      if (options.course && row.course !== options.course) return null;
      if (options.occasion && !row.occasions.includes(options.occasion)) return null;
      const cuisine = getKnowledgeNode(row.cuisine_id);
      return { ...row, cuisine_label: cuisine?.display_name ?? row.cuisine_id.replace(/^cuisine\./, ''), score: row.score };
    })
    .filter((r): r is DishMatch => !!r && r.score >= minScore)
    .sort((a, b) => b.score - a.score);

  const picked: DishMatch[] = [];
  const seenTitles = new Set<string>();
  for (const row of scored) {
    const key = row.title.toLowerCase();
    if (seenTitles.has(key)) continue;
    seenTitles.add(key);
    picked.push(row);
    if (picked.length >= limit) break;
  }
  return picked;
}

export function matchDishByDescription(
  description: string,
  inventory: InventoryItem[],
): { dish: DishMatch; confidence: number } | null {
  const lower = description.toLowerCase().trim();
  if (!lower) return null;

  const kidSet = kidSetFromInventory(inventory);
  const prefs = new Set<string>();
  let best: { dish: DishMatch; confidence: number } | null = null;

  const corpus = listAllDishes();
  const iter = corpus.length
    ? corpus.map((node) => ({ node, doc: null as DishSearchDoc | null }))
    : loadSearchPack().map((doc) => ({ node: searchDocToNode(doc), doc }));

  for (const { node } of iter) {
    const keywords = dishKeywordsFromNode(node.attributes);
    const title = node.display_name.toLowerCase();
    let keywordHit = keywords.some((k) => lower.includes(k) || k.includes(lower));
    if (!keywordHit && (lower.includes(title) || title.includes(lower))) keywordHit = true;
    if (!keywordHit) continue;

    const row = scoreDishNode(node, inventory, kidSet, prefs);
    if (!row) continue;
    const cuisine = getKnowledgeNode(row.cuisine_id);
    const dish: DishMatch = {
      ...row,
      cuisine_label: cuisine?.display_name ?? row.cuisine_id.replace(/^cuisine\./, ''),
    };
    const overlap = row.ingredients_in_pantry.length / Math.max(row.ingredients.length, 1);
    const confidence = 0.5 + overlap * 0.45;
    if (!best || confidence > best.confidence) best = { dish, confidence };
  }

  return best;
}

export function getDishLibraryStats() {
  return getDishCorpusStats();
}

export function formatDishesForPlannerPrompt(
  inventory: InventoryItem[],
  profile: Profile,
  limit = 20,
  cookingStyle?: string,
): string {
  const matches = matchDishesForPantry(inventory, profile, { limit, cooking_style: cookingStyle });
  if (!matches.length) return '';

  const lines = [
    'Curated recipe templates from the SousChef dish library (prefer these names and structures when they fit the pantry):',
  ];
  for (const d of matches.slice(0, limit)) {
    const ings = d.ingredients.map((i) => i.name).join(', ');
    lines.push(
      `- ${d.title} (${d.cuisine_label}, ~${d.prep_time_minutes} min, ${d.pantry_match}% pantry match): ${ings}`,
    );
  }
  return lines.join('\n');
}

export function formatDishAsDirection(d: DishMatch, idx: number): {
  id: string;
  title: string;
  tagline: string;
  cuisine_id: string;
  cuisine_label: string;
  staples_in_inventory: string[];
  missing_staples: string[];
  technique_hint?: string;
  flavor_profile?: string;
  evidence: string[];
  confidence: number;
  dish_id?: string;
  description?: string;
  prep_time_minutes?: number;
  ingredients_preview?: string[];
  steps?: string[];
} {
  return {
    id: `dish_${idx + 1}_${d.id.replace(/\./g, '_')}`,
    dish_id: d.id,
    title: d.title,
    tagline: d.description ?? `${d.cuisine_label} — ${d.pantry_match}% pantry match (${d.ingredients_in_pantry.slice(0, 4).join(', ')})`,
    description: d.description,
    cuisine_id: d.cuisine_id,
    cuisine_label: d.cuisine_label,
    staples_in_inventory: d.ingredients_in_pantry,
    missing_staples: d.ingredients_missing.slice(0, 6),
    flavor_profile: d.tags[0],
    evidence: [d.id, d.cuisine_id, ...d.ingredients_in_pantry.slice(0, 3)],
    confidence: Math.min(0.97, 0.4 + d.score * 0.55),
    prep_time_minutes: d.prep_time_minutes,
    ingredients_preview: d.ingredients.map((i) => i.name),
    steps: d.steps,
  };
}
