/**
 * Agent Suite v6 Phase 3/4 — Hybrid BM25 + shard embeddings (query-only embed).
 */

import type { InventoryItem, Profile } from '../../../../src/types/index.js';
import type { DishMatch } from '../../../../src/types/dish.js';
import { searchDishesBm25 } from './dishBm25.js';
import { cosineSimilarity, embedTexts } from './dishEmbeddings.js';
import { isShardSearchEnabled, semanticSearchShardIds } from './dishEmbedIndex.js';
import { getDocById } from './dishSearchPack.js';
import { getDishFromCatalog, hydrateDishNodes } from './dishCatalog.js';
import { scoreDishNode, scoreDishFromDoc } from './dishMatcher.js';
import { listAvailableKnowledgeIds } from '../inventoryContext.js';
import { getKnowledgeNode } from './knowledgeLoader.js';

const HYBRID_CANDIDATES = 36;

export function isHybridSearchEnabled(): boolean {
  if (process.env.AGENT_V6_PHASE3 === 'false') return false;
  if (process.env.AGENT_V6_HYBRID === 'false') return false;
  return !!process.env.OPENAI_API_KEY;
}

export function isPhase4ShardHybrid(): boolean {
  return isHybridSearchEnabled() && isShardSearchEnabled();
}

export async function searchDishesHybrid(
  query: string,
  inventory: InventoryItem[],
  profile: Profile,
  options: {
    limit?: number;
    meal_type?: string;
    course?: string;
    min_pantry_match?: number;
  } = {},
): Promise<DishMatch[]> {
  const limit = options.limit ?? 12;

  if (!isHybridSearchEnabled()) {
    return searchDishesBm25(query, inventory, profile, options);
  }

  if (isPhase4ShardHybrid()) {
    return searchDishesShardHybrid(query, inventory, profile, options);
  }

  const bm25Pool = await searchDishesBm25(query, inventory, profile, {
    ...options,
    limit: Math.max(limit * 2, HYBRID_CANDIDATES),
  });

  if (bm25Pool.length < 2) return bm25Pool.slice(0, limit);

  const candidates = bm25Pool.slice(0, 24);
  const texts = [query.slice(0, 200), ...candidates.map((c) => [c.title, c.cuisine_label, c.course].join(' '))];
  const embeddings = await embedTexts(texts);
  if (embeddings.length !== texts.length) return bm25Pool.slice(0, limit);

  const queryEmb = embeddings[0];
  const maxBm25 = Math.max(...candidates.map((c) => c.score), 0.01);

  const reranked = candidates.map((row, i) => {
    const semantic = cosineSimilarity(queryEmb, embeddings[i + 1]);
    const bm25Norm = row.score / maxBm25;
    const pantryNorm = row.pantry_match / 100;
    return { ...row, score: bm25Norm * 0.45 + semantic * 0.35 + pantryNorm * 0.2 };
  });

  reranked.sort((a, b) => b.score - a.score);
  return dedupeLimit(reranked, limit);
}

async function searchDishesShardHybrid(
  query: string,
  inventory: InventoryItem[],
  profile: Profile,
  options: { limit?: number; meal_type?: string; course?: string; min_pantry_match?: number },
): Promise<DishMatch[]> {
  const limit = options.limit ?? 12;
  const [bm25Pool, shardHits] = await Promise.all([
    searchDishesBm25(query, inventory, profile, { ...options, limit: HYBRID_CANDIDATES }),
    semanticSearchShardIds(query, HYBRID_CANDIDATES),
  ]);

  const kidSet = new Set(listAvailableKnowledgeIds(inventory));
  const prefs = new Set(
    (profile.cuisine_preferences ?? []).map((p) => `cuisine.${p.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`),
  );

  const byId = new Map<string, DishMatch>();
  for (const row of bm25Pool) byId.set(row.id, row);

  for (const hit of shardHits) {
    if (byId.has(hit.id)) {
      const existing = byId.get(hit.id)!;
      byId.set(hit.id, { ...existing, score: existing.score + hit.semantic * 0.35 });
      continue;
    }
    const doc = getDocById(hit.id);
    if (!doc) continue;
    const node = getDishFromCatalog(hit.id);
    const row = node
      ? scoreDishNode(node, inventory, kidSet, prefs)
      : scoreDishFromDoc(doc, inventory, kidSet, prefs);
    if (!row) continue;
    const cuisine = getKnowledgeNode(row.cuisine_id);
    byId.set(hit.id, {
      ...row,
      cuisine_label: cuisine?.display_name ?? row.cuisine_id.replace(/^cuisine\./, ''),
      score: hit.semantic * 0.55 + row.score * 0.25,
    });
  }

  const merged = [...byId.values()].sort((a, b) => b.score - a.score).slice(0, limit);
  const hydrated = await hydrateDishNodes(merged.map((m) => m.id));
  return merged.map((m) => {
    const full = hydrated.get(m.id);
    if (!full) return m;
    const row = scoreDishNode(full, inventory, kidSet, prefs);
    return row ? { ...row, cuisine_label: m.cuisine_label, score: m.score } : m;
  });
}

function dedupeLimit(rows: DishMatch[], limit: number): DishMatch[] {
  const picked: DishMatch[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    const key = row.title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    picked.push(row);
    if (picked.length >= limit) break;
  }
  return picked;
}
