/**
 * Culinary Reasoning Engine — build meal directions from inventory + knowledge graph.
 * Phase 4 · Layer 3
 */

import type { InventoryItem, Profile } from '../../../../src/types/index.js';
import type { MealDirection, MealDirectionsResult } from '../../../../src/types/mealDirections.js';
import { listAvailableKnowledgeIds } from '../inventoryContext.js';
import { getKnowledgeNode, listKnowledgeNodes } from './knowledgeLoader.js';
import { getCuisineStaples, getTechniquesForCuisine } from './graphQueries.js';
import { matchDishesForPantry, formatDishAsDirection } from './dishMatcher.js';

const COOKING_STYLE_TO_CUISINE: Record<string, string> = {
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

function normalizeCuisineTag(pref: string): string {
  return pref.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function resolveCuisineIdFromPreference(pref: string): string | undefined {
  const tag = normalizeCuisineTag(pref);
  const cuisines = listKnowledgeNodes('cuisine');
  const direct = cuisines.find((c) => c.id === `cuisine.${tag}` || c.id.endsWith(`.${tag}`));
  if (direct) return direct.id;
  return cuisines.find((c) => {
    const tags = (c.attributes?.cuisine_tags as string[] | undefined) ?? [];
    return tags.some((t) => t.toLowerCase().includes(tag) || tag.includes(t.toLowerCase()));
  })?.id;
}

function inventoryKnowledgeSet(inventory: InventoryItem[]): Set<string> {
  return new Set(listAvailableKnowledgeIds(inventory));
}

function stapleDisplayName(stapleId: string): string {
  return getKnowledgeNode(stapleId)?.display_name ?? stapleId.replace(/^ingredient\./, '').replace(/_/g, ' ');
}

function pickPrimaryProtein(inventory: InventoryItem[], kidSet: Set<string>): string | undefined {
  const proteinIds = ['ingredient.chicken', 'ingredient.ground_beef', 'ingredient.beef', 'ingredient.pork', 'ingredient.fish', 'ingredient.shrimp', 'ingredient.tofu', 'ingredient.eggs'];
  for (const pid of proteinIds) {
    if (kidSet.has(pid)) return stapleDisplayName(pid);
    for (const kid of kidSet) {
      if (kid.startsWith(pid + '.')) return stapleDisplayName(kid);
    }
  }
  const proteinNames = inventory.filter((i) => {
    const n = i.name.toLowerCase();
    return /chicken|beef|pork|fish|shrimp|tofu|egg|turkey|sausage/.test(n);
  });
  return proteinNames[0]?.name;
}

function pickPrimaryStarch(inventory: InventoryItem[], kidSet: Set<string>): string | undefined {
  const starchIds = ['ingredient.rice', 'ingredient.pasta', 'ingredient.potato', 'ingredient.bread', 'ingredient.flour'];
  for (const sid of starchIds) {
    if (kidSet.has(sid)) return stapleDisplayName(sid);
  }
  const starchNames = inventory.filter((i) => {
    const n = i.name.toLowerCase();
    return /rice|pasta|potato|bread|noodle|tortilla/.test(n);
  });
  return starchNames[0]?.name;
}

function buildDirectionTitle(
  cuisineLabel: string,
  regionalUses: string[],
  protein?: string,
  starch?: string,
): string {
  if (regionalUses.length) {
    const base = regionalUses[0];
    if (protein && !base.toLowerCase().includes(protein.toLowerCase())) {
      return `${base} with ${protein}`;
    }
    return base;
  }
  if (protein && starch) return `${cuisineLabel} ${protein} & ${starch}`;
  if (protein) return `${cuisineLabel} ${protein} skillet`;
  return `${cuisineLabel} pantry night`;
}

function scoreCuisine(
  cuisineId: string,
  kidSet: Set<string>,
  preferenceBoost: number,
): { score: number; inPantry: string[]; missing: string[] } {
  const staples = getCuisineStaples(cuisineId);
  const inPantry: string[] = [];
  const missing: string[] = [];
  for (const s of staples) {
    const has = kidSet.has(s.id) || [...kidSet].some((k) => k.startsWith(s.id + '.'));
    if (has) inPantry.push(s.display_name);
    else missing.push(s.display_name);
  }
  const ratio = staples.length ? inPantry.length / staples.length : 0;
  const score = ratio * 0.7 + preferenceBoost * 0.3 + (inPantry.length >= 2 ? 0.15 : 0);
  return { score, inPantry, missing };
}

function candidateCuisineIds(profile: Profile, cookingStyle?: string): string[] {
  const ids: string[] = [];
  const seen = new Set<string>();

  const add = (id: string | undefined, boost = false) => {
    if (!id || seen.has(id)) return;
    if (!getKnowledgeNode(id)) return;
    seen.add(id);
    ids.push(id);
  };

  if (cookingStyle && cookingStyle !== 'profile_default') {
    add(COOKING_STYLE_TO_CUISINE[cookingStyle] ?? resolveCuisineIdFromPreference(cookingStyle), true);
  }

  for (const pref of profile.cuisine_preferences ?? []) {
    add(resolveCuisineIdFromPreference(pref), true);
  }

  for (const c of listKnowledgeNodes('cuisine')) {
    add(c.id);
  }

  return ids;
}

export function buildMealDirections(
  inventory: InventoryItem[],
  profile: Profile,
  options: { count?: number; cooking_style?: string; meal_type?: string } = {},
): MealDirectionsResult {
  const count = options.count ?? 3;
  const kidSet = inventoryKnowledgeSet(inventory);
  const protein = pickPrimaryProtein(inventory, kidSet);
  const starch = pickPrimaryStarch(inventory, kidSet);

  // Prefer structured dish corpus when pantry matches
  const dishMatches = matchDishesForPantry(inventory, profile, {
    limit: Math.max(count * 4, 12),
    meal_type: options.meal_type,
    cooking_style: options.cooking_style,
  });

  if (dishMatches.length >= count) {
    const directions: MealDirection[] = dishMatches.slice(0, count).map((d, idx) => formatDishAsDirection(d, idx));
    const inventorySummary = inventory.length
      ? `${inventory.length} pantry items · ${dishMatches.length} recipes match your kitchen`
      : 'Empty pantry';
    return {
      directions,
      inventory_summary: inventorySummary,
      reasoning_note: `${directions.length} recipes from the SousChef library (${dishMatches.length}+ matches in your pantry).`,
    };
  }

  const candidates = candidateCuisineIds(profile, options.cooking_style);

  const preferenceIds = new Set<string>();
  if (options.cooking_style && options.cooking_style !== 'profile_default') {
    const cid = COOKING_STYLE_TO_CUISINE[options.cooking_style] ?? resolveCuisineIdFromPreference(options.cooking_style);
    if (cid) preferenceIds.add(cid);
  }
  for (const pref of profile.cuisine_preferences ?? []) {
    const cid = resolveCuisineIdFromPreference(pref);
    if (cid) preferenceIds.add(cid);
  }

  const scored = candidates
    .map((cuisineId) => {
      const boost = preferenceIds.has(cuisineId) ? 1 : 0;
      const { score, inPantry, missing } = scoreCuisine(cuisineId, kidSet, boost);
      return { cuisineId, score, inPantry, missing };
    })
    .filter((s) => s.inPantry.length >= 1)
    .sort((a, b) => b.score - a.score);

  const picked: typeof scored = [];
  for (const row of scored) {
    if (picked.length >= count) break;
    const tag = (getKnowledgeNode(row.cuisineId)?.attributes?.cuisine_tags as string[] | undefined)?.[0] ?? row.cuisineId;
    if (picked.some((p) => {
      const pTag = (getKnowledgeNode(p.cuisineId)?.attributes?.cuisine_tags as string[] | undefined)?.[0];
      return pTag === tag;
    })) continue;
    picked.push(row);
  }

  while (picked.length < count && picked.length < scored.length) {
    const next = scored.find((s) => !picked.includes(s));
    if (!next) break;
    picked.push(next);
  }

  // Blend cuisine directions with any extra dish matches
  const extraDishes = dishMatches.filter(
    (d) => !picked.some((p) => p.cuisineId === d.cuisine_id),
  );

  const directions: MealDirection[] = [];
  for (let idx = 0; idx < picked.length && directions.length < count; idx++) {
    const row = picked[idx];
    const cuisine = getKnowledgeNode(row.cuisineId)!;
    const regionalUses = (cuisine.attributes?.regional_uses as string[] | undefined) ?? [];
    const techniques = getTechniquesForCuisine(row.cuisineId);
    const technique = techniques[0];
    const stapleIds = getCuisineStaples(row.cuisineId).map((s) => s.id);
    const evidence = [row.cuisineId, ...stapleIds.filter((id) => kidSet.has(id) || [...kidSet].some((k) => k.startsWith(id + '.')))].slice(0, 6);
    const confidence = Math.min(0.95, 0.45 + row.score * 0.5);
    directions.push({
      id: `dir_${idx + 1}_${row.cuisineId.replace(/\./g, '_')}`,
      title: buildDirectionTitle(cuisine.display_name, regionalUses, protein, starch),
      tagline: `${cuisine.display_name} — uses ${row.inPantry.slice(0, 3).join(', ')}${row.missing.length ? ` (+${row.missing.length} pantry staples to shop)` : ''}`,
      cuisine_id: row.cuisineId,
      cuisine_label: cuisine.display_name,
      staples_in_inventory: row.inPantry,
      missing_staples: row.missing,
      technique_hint: technique?.display_name,
      flavor_profile: (cuisine.attributes?.cuisine_tags as string[] | undefined)?.[0],
      evidence,
      confidence: Math.round(confidence * 100) / 100,
    });
  }

  for (const d of extraDishes) {
    if (directions.length >= count) break;
    directions.push(formatDishAsDirection(d, directions.length));
  }

  const inventorySummary = inventory.length
    ? `${inventory.length} pantry items · ${dishMatches.length} recipe matches`
    : 'Empty pantry';

  return {
    directions: directions.slice(0, count),
    inventory_summary: inventorySummary,
    reasoning_note: directions.length
      ? `Recipe ideas from the SousChef library (${dishMatches.length}+ pantry matches).`
      : 'Add pantry items to unlock recipe ideas.',
  };
}

export function formatDirectionsForPrompt(direction: MealDirection): string {
  const lines = [
    `Direction: ${direction.title} (${direction.cuisine_label})`,
    direction.tagline,
  ];
  if (direction.technique_hint) lines.push(`Technique emphasis: ${direction.technique_hint}`);
  if (direction.staples_in_inventory.length) {
    lines.push(`Pantry staples to feature: ${direction.staples_in_inventory.join(', ')}`);
  }
  if (direction.missing_staples.length) {
    lines.push(`Optional shop items: ${direction.missing_staples.slice(0, 4).join(', ')}`);
  }
  if (direction.steps?.length) lines.push(`Steps: ${direction.steps.slice(0, 3).join(' → ')}`);
  lines.push(`Knowledge evidence: ${direction.evidence.join(', ')}`);
  return lines.join('\n');
}

export function findDirectionById(
  inventory: InventoryItem[],
  profile: Profile,
  directionId: string,
  cookingStyle?: string,
): MealDirection | undefined {
  const { directions } = buildMealDirections(inventory, profile, { cooking_style: cookingStyle });
  return directions.find((d) => d.id === directionId);
}
