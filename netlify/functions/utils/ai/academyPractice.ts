/**
 * Kitchen Academy — practice recipe suggestions for track modules.
 */

import type { InventoryItem, Profile } from '../../../../src/types/index.js';
import type { DishMatch } from '../../../../src/types/dish.js';
import { getDeepEntry } from './deepLoader.js';
import { searchDishes } from './dishSearch.js';
import { getKnowledgeNode } from './knowledgeLoader.js';

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
  const { matches: dishes } = await searchDishes(query, inventory, profile, { limit: 6 });

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
