/**
 * Build history, origins, and teaching moments for meals from deep catalog + graph.
 */

import type { InventoryItem, PlannedMeal } from '../../../../src/types/index.js';
import type { DishContext, IngredientDeepDive } from '../../../../src/types/knowledgeDeep.js';
import { resolveIngredientKnowledgeId } from '../inventoryContext.js';
import { getKnowledgeNode } from './knowledgeLoader.js';
import type { DeepKnowledgeEntry } from '../../../../src/types/knowledgeDeep.js';
import { getDeepByKnowledgeId, getDeepEntry, matchDishDeep } from './deepLoader.js';

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function deepToIngredientDive(name: string, entry: DeepKnowledgeEntry, knowledgeId?: string): IngredientDeepDive {
  return {
    ingredient_name: name,
    knowledge_id: knowledgeId ?? entry.knowledge_id,
    title: entry.title,
    origins: entry.origins,
    history: entry.history,
    first_known: entry.first_known,
    teaching: entry.teaching,
    fun_fact: entry.fun_fact,
    timeline: entry.timeline,
  };
}

function teachingFromNode(knowledgeId: string, name: string): string[] {
  const node = getKnowledgeNode(knowledgeId);
  if (!node) return [];
  const tips: string[] = [];
  const micro = node.attributes?.micro_lesson as string | undefined;
  if (micro) tips.push(micro);
  const storage = node.attributes?.storage_tip as string | undefined;
  if (storage) tips.push(storage);
  const prep = node.attributes?.prep_note as string | undefined;
  if (prep) tips.push(prep);
  if (!tips.length) tips.push(`${name}: check pantry freshness before cook day.`);
  return tips.slice(0, 3);
}

function buildDishContext(meal: PlannedMeal): DishContext | undefined {
  const dish = matchDishDeep(meal.name);
  if (!dish) return undefined;

  return {
    title: dish.title,
    style: dish.kind === 'style' ? dish.title : undefined,
    origins_summary: dish.origins,
    approximate_age: dish.first_known,
    history: dish.history,
    teaching: dish.teaching,
    timeline: dish.timeline,
  };
}

export function buildIngredientDeepDives(meal: PlannedMeal, inventory: InventoryItem[], max = 3): IngredientDeepDive[] {
  const seen = new Set<string>();
  const dives: IngredientDeepDive[] = [];

  const sorted = [...meal.ingredients].sort((a, b) => {
    const aId = resolveIngredientKnowledgeId(a.name, inventory);
    const bId = resolveIngredientKnowledgeId(b.name, inventory);
    const aDeep = aId ? getDeepByKnowledgeId(aId) : undefined;
    const bDeep = bId ? getDeepByKnowledgeId(bId) : undefined;
    if (aDeep && !bDeep) return -1;
    if (!aDeep && bDeep) return 1;
    return 0;
  });

  for (const ing of sorted) {
    if (dives.length >= max) break;
    const knowledgeId = resolveIngredientKnowledgeId(ing.name, inventory);
    const key = knowledgeId ?? ing.name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    const deep = knowledgeId ? getDeepByKnowledgeId(knowledgeId) : undefined;
    if (deep) {
      dives.push(deepToIngredientDive(ing.name, deep, knowledgeId));
      continue;
    }

    const node = knowledgeId ? getKnowledgeNode(knowledgeId) : null;
    if (node) {
      const teaching = teachingFromNode(knowledgeId!, ing.name);
      const regional = node.attributes?.regional_uses as string[] | undefined;
      dives.push({
        ingredient_name: ing.name,
        knowledge_id: knowledgeId,
        title: node.display_name || ing.name,
        origins: regional?.[0] ? `Classic in ${regional[0]} home cooking.` : undefined,
        teaching,
      });
    }
  }

  return dives;
}

export function buildTeachingMoments(
  meal: PlannedMeal,
  inventory: InventoryItem[],
  dives: IngredientDeepDive[],
  dishContext?: DishContext,
): string[] {
  const moments: string[] = [];

  if (dishContext?.teaching?.length) {
    moments.push(...dishContext.teaching.slice(0, 2));
  }

  for (const dive of dives) {
    if (dive.teaching?.[0]) moments.push(`${dive.title}: ${dive.teaching[0]}`);
  }

  const name = meal.name.toLowerCase();
  if (name.includes('leftover') && !moments.length) {
    moments.push('Repurpose within 3 days — flavor holds, safety window matters.');
  }
  if (name.includes('bowl') && moments.length < 3) {
    moments.push('Build bowls warm-first: grain, protein, sauce, crunch on top.');
  }

  return [...new Set(moments)].slice(0, 4);
}

export function buildMealDeepContext(meal: PlannedMeal, inventory: InventoryItem[]) {
  const deep_dives = buildIngredientDeepDives(meal, inventory);
  const dish_context = buildDishContext(meal);
  const teaching_moments = buildTeachingMoments(meal, inventory, deep_dives, dish_context);

  const dish = matchDishDeep(meal.name);
  let ingredient_trivia = dish?.fun_fact;
  if (!ingredient_trivia && deep_dives.length) {
    const pick = deep_dives[hashString(meal.name) % deep_dives.length];
    ingredient_trivia = pick.fun_fact ?? pick.history?.slice(0, 120);
  }

  return { deep_dives, dish_context, teaching_moments, ingredient_trivia };
}

export function getDeepEntryForClient(id: string) {
  return getDeepEntry(id);
}
