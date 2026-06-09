/**
 * Kitchen Knowledge Loader — Phase 1
 * All knowledge files live under H:/HomeChefAi/data/ai (override via KNOWLEDGE_ROOT).
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, resolve } from 'path';
import type { KnowledgeNode, KnowledgeNodeType, KnowledgeSearchResult } from '../../../../src/types/knowledge.js';
import { knowledgeIdParentChain } from '../../../../src/types/knowledgeIdCore.js';

/** Canonical registry root on H: drive */
export const DEFAULT_KNOWLEDGE_ROOT = 'H:/HomeChefAi/data/ai';

const TYPE_DIRS: KnowledgeNodeType[] = [
  'ingredient',
  'technique',
  'cuisine',
  'meal_pattern',
  'substitution',
  'flavor_profile',
  'food_science',
  'nutrition',
  'hosting',
  'culture',
  'tradition',
  'dish',
];

let cachedNodes: Map<string, KnowledgeNode> | null = null;
let cachedRoot: string | null = null;

export function resolveKnowledgeRoot(): string {
  const env = process.env.KNOWLEDGE_ROOT?.trim();
  if (env) {
    const resolved = resolve(env.replace(/\\/g, '/'));
    if (dirExists(resolved)) return resolved;
  }

  const candidates = [
    resolve(DEFAULT_KNOWLEDGE_ROOT.replace(/\\/g, '/')),
    resolve(process.cwd(), 'data/ai'),
    join(process.env.LAMBDA_TASK_ROOT ?? '', 'data/ai'),
  ];

  for (const p of candidates) {
    if (dirExists(p)) return p;
  }

  return resolve(DEFAULT_KNOWLEDGE_ROOT.replace(/\\/g, '/'));
}

function listJsonFiles(dir: string, skipDirs = new Set(['deep'])): string[] {
  const out: string[] = [];
  if (!dirExists(dir)) return out;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (skipDirs.has(entry)) continue;
      out.push(...listJsonFiles(full, skipDirs));
    } else if (entry.endsWith('.json')) {
      out.push(full);
    }
  }
  return out;
}

function dirExists(p: string): boolean {
  try {
    return statSync(p).isDirectory();
  } catch {
    return false;
  }
}

export function validateKnowledgeNode(raw: unknown): raw is KnowledgeNode {
  if (!raw || typeof raw !== 'object') return false;
  const n = raw as KnowledgeNode;
  if (!n.id || typeof n.id !== 'string') return false;
  if (!n.type || !TYPE_DIRS.includes(n.type)) return false;
  if (!n.display_name || typeof n.display_name !== 'string') return false;
  return true;
}

function loadNodeFile(filePath: string): KnowledgeNode | null {
  try {
    const raw = JSON.parse(readFileSync(filePath, 'utf8')) as unknown;
    if (!validateKnowledgeNode(raw)) {
      console.warn('Invalid knowledge node:', filePath);
      return null;
    }
    return raw;
  } catch (err) {
    console.warn('Failed to load knowledge file:', filePath, err);
    return null;
  }
}

/** Load or return cached registry from disk */
export function loadKnowledgeRegistry(force = false): Map<string, KnowledgeNode> {
  const root = resolveKnowledgeRoot();
  if (!force && cachedNodes && cachedRoot === root) return cachedNodes;

  const map = new Map<string, KnowledgeNode>();
  if (!dirExists(root)) {
    console.warn('Knowledge root not found:', root);
    cachedNodes = map;
    cachedRoot = root;
    return map;
  }

  for (const file of listJsonFiles(root)) {
    const node = loadNodeFile(file);
    if (node) {
      if (map.has(node.id)) {
        console.warn('Duplicate knowledge id:', node.id, file);
      }
      map.set(node.id, node);
    }
  }

  cachedNodes = map;
  cachedRoot = root;
  return map;
}

export function clearKnowledgeCache(): void {
  cachedNodes = null;
  cachedRoot = null;
}

export function getKnowledgeNode(id: string): KnowledgeNode | null {
  return loadKnowledgeRegistry().get(id) ?? null;
}

export function listKnowledgeNodes(type?: KnowledgeNodeType): KnowledgeNode[] {
  const all = [...loadKnowledgeRegistry().values()];
  return type ? all.filter((n) => n.type === type) : all;
}

function scoreMatch(node: KnowledgeNode, q: string): number {
  const lower = q.toLowerCase();
  let score = 0;
  if (node.id.toLowerCase().includes(lower)) score += 10;
  if (node.display_name.toLowerCase().includes(lower)) score += 8;
  if (node.description?.toLowerCase().includes(lower)) score += 4;
  const tags = (node.attributes?.cuisine_tags as string[] | undefined) ?? [];
  if (tags.some((t) => t.includes(lower))) score += 3;
  return score;
}

export function searchKnowledge(q: string, type?: KnowledgeNodeType, limit = 20): KnowledgeSearchResult[] {
  const query = q.trim();
  if (!query) return [];
  const nodes = listKnowledgeNodes(type);
  return nodes
    .map((node) => ({ id: node.id, type: node.type, display_name: node.display_name, score: scoreMatch(node, query) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function getSubstituteNodes(id: string): KnowledgeNode[] {
  const node = getKnowledgeNode(id);
  if (!node?.attributes?.substitutes) return [];
  const registry = loadKnowledgeRegistry();
  const refs = node.attributes.substitutes as { id: string }[];
  return refs.map((r) => registry.get(r.id)).filter((n): n is KnowledgeNode => !!n);
}

export function getRelatedByPairing(id: string, limit = 8): KnowledgeNode[] {
  const node = getKnowledgeNode(id);
  if (!node?.attributes?.pairings) return [];
  const registry = loadKnowledgeRegistry();
  const ids = node.attributes.pairings as string[];
  return ids.map((pid) => registry.get(pid)).filter((n): n is KnowledgeNode => !!n).slice(0, limit);
}

export function getKnowledgeStats(): { root: string; count: number; by_type: Record<string, number> } {
  const root = resolveKnowledgeRoot();
  const nodes = listKnowledgeNodes();
  const by_type: Record<string, number> = {};
  for (const n of nodes) {
    by_type[n.type] = (by_type[n.type] ?? 0) + 1;
  }
  return { root, count: nodes.length, by_type };
}

/** Child variant nodes for a parent ingredient id */
export function getVariantNodes(parentId: string): KnowledgeNode[] {
  const ids = (getKnowledgeNode(parentId)?.attributes?.variant_ids as string[] | undefined) ?? [];
  if (ids.length) {
    return ids.map((id) => getKnowledgeNode(id)).filter((n): n is KnowledgeNode => !!n);
  }
  return listKnowledgeNodes('ingredient').filter(
    (n) => n.attributes?.variant_of === parentId || n.parent_id === parentId,
  );
}

/** Lookup by pantry wizard item label */
export function findKnowledgeByWizardItem(wizardItem: string): KnowledgeNode | null {
  const match = listKnowledgeNodes('ingredient').find(
    (n) => n.attributes?.wizard_item === wizardItem && !n.attributes?.variant_of,
  );
  return match ?? null;
}

/** Resolve id with parent fallback for display */
export function resolveKnowledgeNode(id: string): KnowledgeNode | null {
  for (const candidate of knowledgeIdParentChain(id)) {
    const node = getKnowledgeNode(candidate);
    if (node) return node;
  }
  return null;
}
