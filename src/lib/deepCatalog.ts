/**
 * Client-side deep catalog — same JSON as data/ai/deep/ (bundled at build).
 */

import type { DeepEntryKind, DeepKnowledgeEntry } from '@/types/knowledgeDeep';

const modules = import.meta.glob<{ default: DeepKnowledgeEntry }>('../../data/ai/deep/*.json', {
  eager: true,
});

const CATALOG: DeepKnowledgeEntry[] = Object.values(modules)
  .map((m) => m.default)
  .filter((e) => e?.id && e?.title)
  .sort((a, b) => a.title.localeCompare(b.title));

export function listDeepCatalog(kind?: DeepEntryKind): DeepKnowledgeEntry[] {
  if (!kind) return CATALOG;
  return CATALOG.filter((e) => e.kind === kind);
}

export function getDeepById(id: string): DeepKnowledgeEntry | undefined {
  return CATALOG.find((e) => e.id === id);
}

export function searchDeepCatalog(query: string, limit = 20): DeepKnowledgeEntry[] {
  const q = query.toLowerCase().trim();
  if (!q) return CATALOG.slice(0, limit);
  return CATALOG.filter((e) => {
    const blob = `${e.title} ${e.summary} ${e.origins} ${e.history} ${e.match_keywords?.join(' ') ?? ''}`.toLowerCase();
    return blob.includes(q);
  }).slice(0, limit);
}

export const DEEP_KIND_LABEL: Record<DeepEntryKind, string> = {
  ingredient: 'Ingredient',
  technique: 'Technique',
  dish: 'Dish',
  style: 'Cooking style',
  tradition: 'Tradition',
  flavor_profile: 'Taste profile',
  culture: 'Cultural cuisine',
  food_source: 'Food sourcing',
  path: 'Learning path',
};

export { CATALOG as DEEP_CATALOG };
