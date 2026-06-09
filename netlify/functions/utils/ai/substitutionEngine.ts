/**
 * Substitution Intelligence Engine — Layer 1
 * Resolves what to swap when missing an ingredient or adapting for dietary needs.
 * All knowledge from H:/HomeChefAi/data/ai — never GPT-guessed.
 */

import type {
  DietaryProfile,
  KnowledgeNode,
  SubstitutionReason,
  SubstitutionResponse,
  SubstitutionSuggestion,
} from '../../../../src/types/knowledge.js';
import {
  getKnowledgeNode,
  listKnowledgeNodes,
  loadKnowledgeRegistry,
} from './knowledgeLoader.js';
import { knowledgeIdParentChain } from '../../../../src/types/knowledgeIdCore.js';

const REASON_ALIASES: Record<string, SubstitutionReason> = {
  missing: 'missing',
  out: 'missing',
  dont_have: 'missing',
  vegan: 'vegan',
  plant_based: 'vegan',
  vegetarian: 'vegetarian',
  veggie: 'vegetarian',
  dairy_free: 'dairy_free',
  dairyfree: 'dairy_free',
  lactose_free: 'dairy_free',
  gluten_free: 'gluten_free',
  glutenfree: 'gluten_free',
  nut_free: 'nut_free',
  nutfree: 'nut_free',
  egg_free: 'egg_free',
  eggfree: 'egg_free',
  low_sodium: 'low_sodium',
  low_salt: 'low_sodium',
};

export function parseSubstitutionReason(raw?: string | null): SubstitutionReason {
  if (!raw?.trim()) return 'missing';
  const key = raw.trim().toLowerCase().replace(/[\s-]+/g, '_');
  return REASON_ALIASES[key] ?? 'missing';
}

function getDietary(node: KnowledgeNode): DietaryProfile {
  return (node.attributes?.dietary as DietaryProfile | undefined) ?? {};
}

function nodeSatisfiesReason(node: KnowledgeNode, reason: SubstitutionReason): boolean {
  const d = getDietary(node);
  switch (reason) {
    case 'missing':
      return true;
    case 'vegan':
      return d.vegan === true;
    case 'vegetarian':
      return d.vegetarian === true || d.vegan === true;
    case 'dairy_free':
      return d.contains_dairy !== true;
    case 'gluten_free':
      return d.contains_gluten !== true;
    case 'nut_free':
      return d.contains_nuts !== true;
    case 'egg_free':
      return d.contains_eggs !== true;
    case 'low_sodium':
      return true;
    default:
      return true;
  }
}

function sourceNeedsSubstitution(node: KnowledgeNode, reason: SubstitutionReason): boolean {
  if (reason === 'missing') return true;
  return !nodeSatisfiesReason(node, reason);
}

function refMatchesReason(
  reasons: SubstitutionReason[] | undefined,
  reason: SubstitutionReason,
): boolean {
  if (reason === 'missing') {
    return !reasons?.length || reasons.includes('missing');
  }
  return !!reasons?.includes(reason);
}

function clampConfidence(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function suggestionFromNode(
  target: KnowledgeNode,
  reason: SubstitutionReason,
  opts: { note?: string; ratio?: string; confidence: number; source: SubstitutionSuggestion['source'] },
): SubstitutionSuggestion {
  return {
    id: target.id,
    display_name: target.display_name,
    reason,
    note: opts.note,
    ratio: opts.ratio,
    confidence: clampConfidence(opts.confidence),
    source: opts.source,
  };
}

/** Direct substitutes on ingredient node */
function collectDirectSubstitutes(
  source: KnowledgeNode,
  reason: SubstitutionReason,
): SubstitutionSuggestion[] {
  const refs = (source.attributes?.substitutes ?? []) as {
    id: string;
    note?: string;
    ratio?: string;
    reasons?: SubstitutionReason[];
    confidence?: number;
  }[];

  const out: SubstitutionSuggestion[] = [];
  for (const ref of refs) {
    if (!refMatchesReason(ref.reasons, reason)) continue;
    const target = getKnowledgeNode(ref.id);
    if (!target) continue;
    if (reason !== 'missing' && !nodeSatisfiesReason(target, reason)) continue;
    out.push(
      suggestionFromNode(target, reason, {
        note: ref.note,
        ratio: ref.ratio,
        confidence: ref.confidence ?? (reason === 'missing' ? 0.85 : 0.75),
        source: reason === 'missing' ? 'direct' : 'dietary',
      }),
    );
  }
  return out;
}

/** Substitution edge nodes in data/ai/substitutions/ */
function collectEdgeSubstitutes(
  sourceId: string,
  reason: SubstitutionReason,
): SubstitutionSuggestion[] {
  const edges = listKnowledgeNodes('substitution');
  const out: SubstitutionSuggestion[] = [];

  for (const edge of edges) {
    const fromId = edge.attributes?.from_id as string | undefined;
    if (fromId !== sourceId) continue;

    const edgeReasons = (edge.attributes?.reasons as SubstitutionReason[] | undefined) ?? ['missing'];
    if (!refMatchesReason(edgeReasons, reason)) continue;

    const toId = edge.attributes?.to_id as string | undefined;
    if (!toId) continue;

    const target = getKnowledgeNode(toId);
    if (!target) continue;
    if (reason !== 'missing' && !nodeSatisfiesReason(target, reason)) continue;

    out.push(
      suggestionFromNode(target, reason, {
        note: (edge.attributes?.note as string | undefined) ?? edge.display_name,
        ratio: edge.attributes?.ratio as string | undefined,
        confidence: (edge.attributes?.confidence as number | undefined) ?? 0.8,
        source: 'edge',
      }),
    );
  }
  return out;
}

/** Reverse edges (to_id → from_id) for "what can I use instead of X" */
function collectReverseEdges(
  sourceId: string,
  reason: SubstitutionReason,
): SubstitutionSuggestion[] {
  if (reason !== 'missing') return [];
  const edges = listKnowledgeNodes('substitution');
  const out: SubstitutionSuggestion[] = [];

  for (const edge of edges) {
    const toId = edge.attributes?.to_id as string | undefined;
    if (toId !== sourceId) continue;
    const fromId = edge.attributes?.from_id as string | undefined;
    if (!fromId) continue;
    const target = getKnowledgeNode(fromId);
    if (!target) continue;
    out.push(
      suggestionFromNode(target, reason, {
        note: `Reverse swap — ${edge.attributes?.note ?? edge.display_name}`,
        ratio: edge.attributes?.ratio as string | undefined,
        confidence: ((edge.attributes?.confidence as number | undefined) ?? 0.7) * 0.9,
        source: 'edge',
      }),
    );
  }
  return out;
}

function dedupeAndRank(items: SubstitutionSuggestion[]): SubstitutionSuggestion[] {
  const byId = new Map<string, SubstitutionSuggestion>();
  for (const item of items) {
    const existing = byId.get(item.id);
    if (!existing || item.confidence > existing.confidence) {
      byId.set(item.id, item);
    }
  }
  return [...byId.values()].sort((a, b) => b.confidence - a.confidence);
}

export interface ResolveSubstitutionOptions {
  reason?: SubstitutionReason;
  limit?: number;
  excludeIds?: string[];
}

/**
 * Core substitution resolver — used by knowledge API, meals, and Clara orchestrator.
 * Walks parent chain for variants (e.g. ingredient.paprika.smoked → ingredient.paprika).
 */
export function resolveSubstitutions(
  fromId: string,
  options: ResolveSubstitutionOptions = {},
): SubstitutionResponse | null {
  const reason = options.reason ?? 'missing';
  const limit = options.limit ?? 10;
  const exclude = new Set(options.excludeIds ?? []);
  const chain = knowledgeIdParentChain(fromId);

  let resolvedFrom: string | undefined;
  let allCollected: SubstitutionSuggestion[] = [];
  let sourceName = fromId;
  let alreadySatisfies = false;

  for (let i = 0; i < chain.length; i++) {
    const id = chain[i];
    const source = getKnowledgeNode(id);
    if (!source) continue;

    sourceName = source.display_name;
    if (reason !== 'missing' && !sourceNeedsSubstitution(source, reason)) {
      alreadySatisfies = true;
      break;
    }

    const depthPenalty = i === 0 ? 1 : 0.92 ** i;
    const collected = [
      ...collectDirectSubstitutes(source, reason),
      ...collectEdgeSubstitutes(id, reason),
      ...collectReverseEdges(id, reason),
    ]
      .filter((s) => !exclude.has(s.id))
      .map((s) => ({ ...s, confidence: clampConfidence(s.confidence * depthPenalty) }));

    if (collected.length && !resolvedFrom && i > 0) {
      resolvedFrom = id;
    }
    allCollected.push(...collected);
    if (dedupeAndRank(allCollected).length >= limit) break;
  }

  const rootSource = getKnowledgeNode(fromId);
  if (!rootSource && !allCollected.length && !alreadySatisfies) return null;

  if (alreadySatisfies) {
    return {
      from_id: fromId,
      from_name: rootSource?.display_name ?? sourceName,
      reason,
      suggestions: [],
      already_satisfies: true,
    };
  }

  const suggestions = dedupeAndRank(allCollected).slice(0, limit);
  return {
    from_id: fromId,
    from_name: rootSource?.display_name ?? sourceName,
    reason,
    suggestions,
    already_satisfies: false,
    resolved_from: resolvedFrom,
  };
}

/** Batch: what can replace each missing id given pantry inventory */
export function resolveMissingFromPantry(
  neededIds: string[],
  availableIds: string[],
  reason: SubstitutionReason = 'missing',
): Array<{ needed_id: string; result: SubstitutionResponse | null }> {
  const available = new Set(availableIds);
  return neededIds.map((needed_id) => {
    if (available.has(needed_id)) {
      const node = getKnowledgeNode(needed_id);
      return {
        needed_id,
        result: node
          ? {
              from_id: needed_id,
              from_name: node.display_name,
              reason,
              suggestions: [],
              already_satisfies: true,
            }
          : null,
      };
    }
    const result = resolveSubstitutions(needed_id, { reason });
    if (!result) return { needed_id, result: null };
    const inPantry = result.suggestions.filter((s) => available.has(s.id));
    return {
      needed_id,
      result: { ...result, suggestions: inPantry.length ? inPantry : result.suggestions },
    };
  });
}

/** Resolve wizard item name → knowledge id, then substitute */
export function resolveSubstitutionsByWizardItem(
  wizardItem: string,
  options: ResolveSubstitutionOptions = {},
): SubstitutionResponse | null {
  loadKnowledgeRegistry();
  const slug = wizardItemToSlug(wizardItem);
  const candidates = [
    `ingredient.${slug}`,
    ...listKnowledgeNodes('ingredient')
      .filter((n) => n.attributes?.wizard_item === wizardItem)
      .map((n) => n.id),
  ];
  for (const id of candidates) {
    const node = getKnowledgeNode(id);
    if (node) return resolveSubstitutions(id, options);
  }
  return null;
}

export function wizardItemToSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

/** Prompt context block for Clara / meals when reasoning about swaps */
export function formatSubstitutionContext(fromId: string, reason: SubstitutionReason): string {
  const result = resolveSubstitutions(fromId, { reason, limit: 5 });
  if (!result) return '';
  if (result.already_satisfies) {
    return `${result.from_name} already satisfies ${reason.replace(/_/g, ' ')}.`;
  }
  if (!result.suggestions.length) {
    return `No registry substitutes for ${result.from_name} (${reason}).`;
  }
  const lines = result.suggestions.map(
    (s, i) =>
      `${i + 1}. ${s.display_name}${s.ratio ? ` (${s.ratio})` : ''}${s.note ? ` — ${s.note}` : ''}`,
  );
  return `Substitutes for ${result.from_name} [${reason}]:\n${lines.join('\n')}`;
}
