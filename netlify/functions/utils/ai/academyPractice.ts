/**
 * Kitchen Academy — practice recipe suggestions for track modules.
 */

import type { InventoryItem, Profile } from '../../../../src/types/index.js';
import type { DishMatch } from '../../../../src/types/dish.js';
import type { AcademyModule } from '../../../../src/types/knowledgeDeep.js';
import { getDeepEntry } from './deepLoader.js';
import { searchDishes } from './dishSearch.js';
import { getKnowledgeNode } from './knowledgeLoader.js';
import { ensureSearchPack } from './dishSearchPack.js';
import { tokenizeForSearch } from './dishBm25.js';
import { scoreDishFromDoc } from './dishMatcher.js';
import { listAvailableKnowledgeIds } from '../inventoryContext.js';

export interface AcademyModulePractice {
  track_id: string;
  track_title: string;
  level_id: string;
  level_title: string;
  module_id: string;
  module_title: string;
  practice_query: string;
  clara_prompt: string;
  dishes: DishMatch[];
  learn_links: { id: string; label: string; kind: string }[];
  teaching: string[];
  time_limit_minutes?: number;
  judge_criteria?: string[];
  show_refs?: string[];
}

function virtualInventoryForModule(
  profile: Profile,
  mod: AcademyModule,
  inventory: InventoryItem[],
): InventoryItem[] {
  const base = [...inventory];
  const now = new Date().toISOString();
  for (const id of mod.ingredients ?? []) {
    base.push({
      id: `academy-ing-${id}`,
      user_id: profile.user_id,
      name: labelForKnowledgeId(id),
      category: 'other',
      quantity: 1,
      unit: '',
      location: 'pantry',
      added_via: 'academy',
      knowledge_id: id.startsWith('ingredient.') ? id : undefined,
      created_at: now,
      updated_at: now,
    });
  }
  for (const spice of mod.spices ?? []) {
    base.push({
      id: `academy-spice-${spice}`,
      user_id: profile.user_id,
      name: spice,
      category: 'spice',
      quantity: 1,
      unit: '',
      location: 'pantry',
      added_via: 'academy',
      created_at: now,
      updated_at: now,
    });
  }
  return base;
}

async function fallbackPracticeDishes(
  query: string,
  mod: AcademyModule,
  inventory: InventoryItem[],
  profile: Profile,
  limit: number,
): Promise<DishMatch[]> {
  const docs = await ensureSearchPack();
  if (!docs.length) return [];

  const queryTerms = [
    ...new Set(
      tokenizeForSearch(
        [query, mod.title, mod.summary ?? '', ...(mod.techniques ?? []).map(labelForKnowledgeId)].join(' '),
      ),
    ),
  ];
  if (!queryTerms.length) return [];

  const kidSet = new Set(listAvailableKnowledgeIds(inventory));
  const prefs = new Set(
    (profile.cuisine_preferences ?? []).map((p) => `cuisine.${p.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`),
  );

  const ranked = docs
    .map((doc) => {
      const termHits = queryTerms.filter((t) => doc.terms.includes(t)).length;
      const titleHits = queryTerms.filter((t) => doc.title.toLowerCase().includes(t)).length;
      return { doc, hits: termHits + titleHits * 2 };
    })
    .filter((r) => r.hits > 0)
    .sort((a, b) => b.hits - a.hits)
    .slice(0, limit * 4);

  const dishes: DishMatch[] = [];
  for (const { doc } of ranked) {
    const row = scoreDishFromDoc(doc, inventory, kidSet, prefs);
    const cuisine = getKnowledgeNode(doc.cuisine_id);
    if (row) {
      dishes.push({
        ...row,
        cuisine_label: cuisine?.display_name ?? doc.cuisine_id.replace(/^cuisine\./, ''),
        score: row.score + 0.05,
      });
    } else {
      dishes.push({
        id: doc.id,
        title: doc.title,
        cuisine_id: doc.cuisine_id,
        cuisine_label: cuisine?.display_name ?? doc.cuisine_id.replace(/^cuisine\./, ''),
        course: doc.course,
        meal_types: doc.meal_types,
        prep_time_minutes: doc.prep_time_minutes,
        ingredients: doc.ingredient_names.map((name) => ({ name, quantity: 1, unit: '' })),
        ingredients_in_pantry: [],
        missing_ingredients: doc.ingredient_names,
        pantry_match: 0,
        score: 0.4,
      });
    }
    if (dishes.length >= limit) break;
  }
  return dishes;
}

async function searchPracticeDishes(
  query: string,
  mod: AcademyModule,
  inventory: InventoryItem[],
  profile: Profile,
  limit: number,
): Promise<DishMatch[]> {
  const boostedInventory = virtualInventoryForModule(profile, mod, inventory);
  const { matches } = await searchDishes(query, boostedInventory, profile, {
    limit,
    min_pantry_match: 0,
  });
  if (matches.length) return matches;
  return fallbackPracticeDishes(query, mod, boostedInventory, profile, limit);
}

function labelForKnowledgeId(id: string): string {
  const node = getKnowledgeNode(id);
  if (node) return node.display_name;
  if (id.startsWith('flavor_profile.')) return id.replace('flavor_profile.', '').replace(/_/g, ' ');
  if (id.startsWith('technique.')) return id.replace('technique.', '').replace(/_/g, ' ');
  if (id.startsWith('culture.')) return id.replace('culture.', '').replace(/_/g, ' ');
  return id.replace(/^ingredient\./, '').replace(/_/g, ' ');
}

export function findAcademyModule(
  trackId: string,
  levelId: string,
  moduleId: string,
): {
  track: NonNullable<ReturnType<typeof getDeepEntry>>;
  level: import('../../../../src/types/knowledgeDeep.js').AcademyLevel;
  module: import('../../../../src/types/knowledgeDeep.js').AcademyModule;
} | null {
  const track = getDeepEntry(trackId);
  if (!track?.levels?.length) return null;
  const level = track.levels.find((l) => l.id === levelId);
  if (!level) return null;
  const mod = level.modules.find((m) => m.id === moduleId);
  if (!mod) return null;
  return { track, level, module: mod };
}

export async function suggestAcademyPractice(
  trackId: string,
  levelId: string,
  moduleId: string,
  inventory: InventoryItem[],
  profile: Profile,
): Promise<AcademyModulePractice | null> {
  const found = findAcademyModule(trackId, levelId, moduleId);
  if (!found) return null;

  const { track, level, module: mod } = found;
  const query = mod.practice_query || mod.title;
  const dishes = await searchPracticeDishes(query, mod, inventory, profile, 6);

  const techniqueIds = mod.techniques ?? [];
  const flavorIds = mod.flavor_profiles ?? mod.flavors ?? [];
  const cultureIds = mod.cultures ?? [];

  const learn_links = [
    ...techniqueIds.map((id) => ({ id, label: labelForKnowledgeId(id), kind: 'technique' })),
    ...flavorIds.map((id) => ({ id, label: labelForKnowledgeId(id), kind: 'flavor_profile' })),
    ...cultureIds.map((id) => ({ id, label: labelForKnowledgeId(id), kind: 'culture' })),
  ].slice(0, 8);

  const spiceNote = mod.spices?.length ? ` Focus spices: ${mod.spices.join(', ')}.` : '';
  const ingredientNote = mod.ingredients?.length
    ? ` Target ingredients: ${mod.ingredients.slice(0, 4).map(labelForKnowledgeId).join(', ')}.`
    : '';

  const clara_prompt = [
    `Academy practice — ${track.title} · ${level.title} · ${mod.title}.`,
    `Find a recipe that helps me practice: ${techniqueIds.map(labelForKnowledgeId).join(', ') || mod.title}.`,
    ingredientNote,
    spiceNote,
    mod.summary,
  ]
    .filter(Boolean)
    .join(' ');

  return {
    track_id: track.id,
    track_title: track.title,
    level_id: level.id,
    level_title: level.title,
    module_id: mod.id,
    module_title: mod.title,
    practice_query: query,
    clara_prompt,
    dishes,
    learn_links,
    teaching: mod.teaching ?? [],
    time_limit_minutes: mod.time_limit_minutes,
    judge_criteria: mod.judge_criteria,
    show_refs: mod.show_refs,
  };
}

export function listFeaturedAcademyTracks(): {
  id: string;
  title: string;
  summary: string;
  track_type?: string;
  level_count: number;
  module_count: number;
}[] {
  const featuredIds = [
    'track.amateur_to_executive',
    'track.master_baker',
    'track.game_show',
  ];
  return featuredIds
    .map((id) => {
      const track = getDeepEntry(id);
      if (!track) return null;
      const levels = track.levels ?? [];
      const module_count = levels.reduce((n, l) => n + (l.modules?.length ?? 0), 0);
      return {
        id: track.id,
        title: track.title,
        summary: track.summary,
        track_type: track.track_type,
        level_count: levels.length,
        module_count,
      };
    })
    .filter(Boolean) as ReturnType<typeof listFeaturedAcademyTracks>;
}
