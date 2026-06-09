/**
 * Deep knowledge loader — history, origins, teaching from data/ai/deep/
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, resolve } from 'path';
import type { DeepKnowledgeEntry } from '../../../../src/types/knowledgeDeep.js';
import { resolveKnowledgeRoot } from './knowledgeLoader.js';

let cachedDeep: Map<string, DeepKnowledgeEntry> | null = null;

function listJsonFiles(dir: string): string[] {
  const out: string[] = [];
  try {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) out.push(...listJsonFiles(full));
      else if (entry.endsWith('.json')) out.push(full);
    }
  } catch {
    /* missing dir */
  }
  return out;
}

function validateDeep(raw: unknown): DeepKnowledgeEntry | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as DeepKnowledgeEntry;
  if (!o.id || !o.title || !o.kind) return null;
  return {
    ...o,
    summary: o.summary ?? '',
    origins: o.origins ?? '',
    history: o.history ?? '',
    teaching: o.teaching ?? [],
  };
}

export function loadDeepCatalog(): Map<string, DeepKnowledgeEntry> {
  if (cachedDeep) return cachedDeep;

  const root = join(resolveKnowledgeRoot(), 'deep');
  const map = new Map<string, DeepKnowledgeEntry>();

  for (const file of listJsonFiles(root)) {
    try {
      const raw = JSON.parse(readFileSync(file, 'utf8'));
      const entry = validateDeep(raw);
      if (entry) map.set(entry.id, entry);
    } catch {
      /* skip bad file */
    }
  }

  cachedDeep = map;
  return map;
}

export function getDeepEntry(id: string): DeepKnowledgeEntry | undefined {
  return loadDeepCatalog().get(id);
}

export function getDeepByKnowledgeId(knowledgeId: string): DeepKnowledgeEntry | undefined {
  for (const entry of loadDeepCatalog().values()) {
    if (entry.knowledge_id === knowledgeId) return entry;
  }
  return undefined;
}

export function listDeepEntries(kind?: DeepKnowledgeEntry['kind']): DeepKnowledgeEntry[] {
  const all = [...loadDeepCatalog().values()];
  if (!kind) return all.sort((a, b) => a.title.localeCompare(b.title));
  return all.filter((e) => e.kind === kind).sort((a, b) => a.title.localeCompare(b.title));
}

export function matchDishDeep(mealName: string): DeepKnowledgeEntry | undefined {
  const lower = mealName.toLowerCase().trim();
  let best: DeepKnowledgeEntry | undefined;
  let bestLen = 0;

  for (const entry of loadDeepCatalog().values()) {
    if (entry.kind !== 'dish' && entry.kind !== 'style') continue;
    const keywords = entry.match_keywords ?? [entry.title.toLowerCase()];
    for (const kw of keywords) {
      const k = kw.toLowerCase();
      if (lower.includes(k) && k.length > bestLen) {
        best = entry;
        bestLen = k.length;
      }
    }
  }
  return best;
}

export function searchDeep(query: string, limit = 20): DeepKnowledgeEntry[] {
  const q = query.toLowerCase().trim();
  if (!q) return listDeepEntries().slice(0, limit);

  return listDeepEntries()
    .filter((e) => {
      const blob = `${e.title} ${e.summary} ${e.origins} ${e.history} ${e.match_keywords?.join(' ') ?? ''}`.toLowerCase();
      return blob.includes(q);
    })
    .slice(0, limit);
}
