/**
 * Agent Suite v6 — filter knowledge graph slices per expert persona.
 */

import type { KnowledgeNodeType } from '../../../../src/types/knowledge.js';
import type { ExpertDefinition } from './brainRegistry.js';
import { listKnowledgeNodes } from './knowledgeLoader.js';

const SLICE_TO_TYPE: Record<string, KnowledgeNodeType | 'dishes'> = {
  ingredients: 'ingredient',
  techniques: 'technique',
  cuisines: 'cuisine',
  meal_patterns: 'meal_pattern',
  substitutions: 'substitution',
  flavor_profiles: 'flavor_profile',
  food_science: 'food_science',
  nutrition: 'nutrition',
  hosting: 'hosting',
  culture: 'culture',
  traditions: 'tradition',
  food_sources: 'food_source',
};

function tokenize(message: string): string[] {
  return message
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

function scoreNodeForMessage(node: { id: string; display_name: string; description?: string }, tokens: string[]): number {
  if (!tokens.length) return 1;
  const blob = `${node.id} ${node.display_name} ${node.description ?? ''}`.toLowerCase();
  let score = 0;
  for (const t of tokens) {
    if (blob.includes(t)) score += 2;
  }
  return score;
}

export function buildExpertKnowledgeContext(expert: ExpertDefinition, message: string, limit = 6): string {
  if (expert.knowledgeSlices.includes('*')) return '';

  const tokens = tokenize(message);
  const picked: { display_name: string; snippet: string; score: number }[] = [];

  for (const slice of expert.knowledgeSlices) {
    const nodeType = SLICE_TO_TYPE[slice];
    if (!nodeType || nodeType === 'dishes') continue;

    const nodes = listKnowledgeNodes(nodeType as KnowledgeNodeType)
      .map((n) => ({ node: n, score: scoreNodeForMessage(n, tokens) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    for (const { node, score } of nodes) {
      if (score <= 0 && tokens.length > 0) continue;
      picked.push({
        display_name: node.display_name,
        snippet: node.description?.slice(0, 120) ?? String(node.attributes?.micro_lesson ?? '').slice(0, 120),
        score: score || 1,
      });
    }
  }

  if (!picked.length) return '';

  picked.sort((a, b) => b.score - a.score);
  const unique = new Map<string, string>();
  for (const p of picked) {
    if (unique.size >= limit) break;
    if (!unique.has(p.display_name)) {
      unique.set(p.display_name, p.snippet);
    }
  }

  const lines = [...unique.entries()].map(([name, snippet]) =>
    snippet ? `- ${name}: ${snippet}` : `- ${name}`,
  );

  return `[${expert.displayName} knowledge]\n${lines.join('\n')}`;
}

export function buildAllExpertKnowledgeContexts(
  experts: ExpertDefinition[],
  message: string,
): string {
  return experts
    .filter((e) => e.id !== 'sous_chef')
    .map((e) => buildExpertKnowledgeContext(e, message))
    .filter(Boolean)
    .join('\n\n');
}
