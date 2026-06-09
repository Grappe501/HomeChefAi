/**
 * Agent Suite v6 Phase 4 — pre-built embedding shards for semantic recall.
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { resolveKnowledgeRoot } from './knowledgeLoader.js';
import { cosineSimilarity, embedTexts } from './dishEmbeddings.js';

interface ShardEntry {
  id: string;
  title: string;
  v: number[];
}

interface ShardFile {
  cuisine: string;
  dim: number;
  entries: ShardEntry[];
}

let shardCache = new Map<string, ShardEntry[]>();
let manifestLoaded = false;
let shardCuisines: string[] = [];

export function isShardSearchEnabled(): boolean {
  if (process.env.AGENT_V6_PHASE4 === 'false') return false;
  if (process.env.AGENT_V6_SHARDS === 'false') return false;
  return !!process.env.OPENAI_API_KEY;
}

function shardsDir(): string {
  return join(resolveKnowledgeRoot(), 'embeddings', 'shards');
}

function loadManifest(): string[] {
  if (manifestLoaded) return shardCuisines;
  manifestLoaded = true;
  const path = join(shardsDir(), 'manifest.json');
  if (!existsSync(shardsDir())) {
    shardCuisines = [];
    return shardCuisines;
  }
  if (!existsSync(path)) {
    shardCuisines = readdirSync(shardsDir()).filter((f) => f.endsWith('.json') && f !== 'manifest.json').map((f) => f.replace('.json', ''));
    return shardCuisines;
  }
  const manifest = JSON.parse(readFileSync(path, 'utf8')) as { shards: { cuisine: string }[] };
  shardCuisines = manifest.shards.map((s) => s.cuisine);
  return shardCuisines;
}

function loadShard(cuisine: string): ShardEntry[] {
  if (shardCache.has(cuisine)) return shardCache.get(cuisine)!;
  const path = join(shardsDir(), `${cuisine}.json`);
  if (!existsSync(path)) return [];
  const raw = JSON.parse(readFileSync(path, 'utf8')) as ShardFile;
  shardCache.set(cuisine, raw.entries);
  return raw.entries;
}

function dequantize(v: number[]): number[] {
  return v.map((x) => x / 127);
}

export function detectCuisinesFromQuery(query: string): string[] {
  const q = query.toLowerCase();
  const cuisines = loadManifest();
  const hits = cuisines.filter((c) => q.includes(c.replace(/_/g, ' ')) || q.includes(c));
  return hits.length ? hits.slice(0, 4) : cuisines.slice(0, 8);
}

export async function semanticSearchShardIds(
  query: string,
  limit = 24,
): Promise<{ id: string; title: string; semantic: number }[]> {
  if (!isShardSearchEnabled()) return [];

  const queryEmb = (await embedTexts([query.slice(0, 200)]))[0];
  if (!queryEmb?.length) return [];

  const cuisines = detectCuisinesFromQuery(query);
  const scored: { id: string; title: string; semantic: number }[] = [];

  for (const cuisine of cuisines) {
    for (const entry of loadShard(cuisine)) {
      const semantic = cosineSimilarity(queryEmb, dequantize(entry.v));
      scored.push({ id: entry.id, title: entry.title, semantic });
    }
  }

  scored.sort((a, b) => b.semantic - a.semantic);
  return scored.slice(0, limit);
}

export function clearShardCache(): void {
  shardCache = new Map();
  manifestLoaded = false;
  shardCuisines = [];
}
