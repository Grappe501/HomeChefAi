/**
 * Knowledge graph query helpers — Phase 2
 */

import type { KnowledgeNode, KnowledgeNodeType } from '../../../src/types/knowledge.js';
import {
  getKnowledgeNode,
  getRelatedByPairing,
  getSubstituteNodes,
  listKnowledgeNodes,
  searchKnowledge,
} from './knowledgeLoader.js';
import { resolveSubstitutions, type ResolveSubstitutionOptions } from './substitutionEngine.js';

export function getPairings(id: string, limit = 8): KnowledgeNode[] {
  return getRelatedByPairing(id, limit);
}

export function getSubstitutes(id: string): KnowledgeNode[] {
  return getSubstituteNodes(id);
}

export function getCuisineStaples(cuisineId: string): KnowledgeNode[] {
  const cuisine = getKnowledgeNode(cuisineId);
  if (!cuisine) return [];
  const stapleIds = (cuisine.attributes?.staples as string[] | undefined) ?? [];
  const registry = listKnowledgeNodes();
  return stapleIds
    .map((sid) => registry.find((n) => n.id === sid))
    .filter((n): n is KnowledgeNode => !!n);
}

export function getNodesByCuisineTag(tag: string, type?: KnowledgeNodeType): KnowledgeNode[] {
  const lower = tag.toLowerCase();
  return listKnowledgeNodes(type).filter((n) => {
    const tags = (n.attributes?.cuisine_tags as string[] | undefined) ?? [];
    return tags.some((t) => t.toLowerCase() === lower);
  });
}

export function getTechniquesForCuisine(cuisineId: string): KnowledgeNode[] {
  const cuisine = getKnowledgeNode(cuisineId);
  const tags = (cuisine?.attributes?.cuisine_tags as string[] | undefined) ?? [];
  if (!tags.length) return [];
  return listKnowledgeNodes('technique').filter((t) => {
    const tTags = (t.attributes?.cuisine_tags as string[] | undefined) ?? [];
    return tTags.some((tt) => tags.includes(tt));
  });
}

export function getKnowledgeBundle(ids: string[]): KnowledgeNode[] {
  return ids.map((id) => getKnowledgeNode(id)).filter((n): n is KnowledgeNode => !!n);
}

export function searchAndSubstitute(
  query: string,
  options: ResolveSubstitutionOptions = {},
): { matches: ReturnType<typeof searchKnowledge>; substitution: ReturnType<typeof resolveSubstitutions> } | null {
  const matches = searchKnowledge(query, 'ingredient', 3);
  if (!matches.length) return null;
  const top = matches[0];
  return {
    matches,
    substitution: resolveSubstitutions(top.id, options),
  };
}

export function getFlavorProfileNodes(): KnowledgeNode[] {
  return listKnowledgeNodes('flavor_profile');
}

export function getFoodScienceForTechnique(techniqueId: string): KnowledgeNode[] {
  const technique = getKnowledgeNode(techniqueId);
  const related = (technique?.attributes?.science_ids as string[] | undefined) ?? [];
  return getKnowledgeBundle(related);
}
