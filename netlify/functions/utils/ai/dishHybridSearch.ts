/**
 * Agent Suite v6 Phase 3 — Hybrid BM25 + embedding rerank over dish corpus.
 */

import type { InventoryItem, Profile } from '../../../../src/types/index.js';
import type { DishMatch } from '../../../../src/types/dish.js';
import { searchDishesBm25 } from './dishBm25.js';
import { cosineSimilarity, embedTexts } from './dishEmbeddings.js';

const HYBRID_CANDIDATES = 36;
const EMBED_BATCH = 24;

export function isHybridSearchEnabled(): boolean {
  if (process.env.AGENT_V6_PHASE3 === 'false') return false;
  if (process.env.AGENT_V6_HYBRID === 'false') return false;
  return !!process.env.OPENAI_API_KEY;
}

function dishEmbedText(row: DishMatch): string {
  return [row.title, row.cuisine_label, row.course, ...row.tags].filter(Boolean).join(' ').slice(0, 400);
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

  const bm25Pool = searchDishesBm25(query, inventory, profile, {
    ...options,
    limit: Math.max(limit * 2, HYBRID_CANDIDATES),
  });

  if (bm25Pool.length < 2) return bm25Pool.slice(0, limit);

  const candidates = bm25Pool.slice(0, EMBED_BATCH);
  const texts = [query.slice(0, 200), ...candidates.map(dishEmbedText)];
  const embeddings = await embedTexts(texts);
  if (embeddings.length !== texts.length) {
    return bm25Pool.slice(0, limit);
  }

  const queryEmb = embeddings[0];
  const maxBm25 = Math.max(...candidates.map((c) => c.score), 0.01);

  const reranked = candidates.map((row, i) => {
    const semantic = cosineSimilarity(queryEmb, embeddings[i + 1]);
    const bm25Norm = row.score / maxBm25;
    const pantryNorm = row.pantry_match / 100;
    const combined = bm25Norm * 0.45 + semantic * 0.35 + pantryNorm * 0.2;
    return { ...row, score: combined };
  });

  reranked.sort((a, b) => b.score - a.score);

  const picked: DishMatch[] = [];
  const seen = new Set<string>();
  for (const row of reranked) {
    const key = row.title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    picked.push(row);
    if (picked.length >= limit) break;
  }

  return picked;
}
