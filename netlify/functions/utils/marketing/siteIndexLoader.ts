/**
 * Marketing site search index — loaded from data/marketing/search-index.json + deep corpus.
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { resolveKnowledgeRoot } from '../ai/knowledgeLoader.js';
import type { SiteSearchEntry, SiteSearchResult } from '../../../../src/types/siteSearch.js';

let cached: SiteSearchEntry[] | null = null;

function loadDeepLearn(): SiteSearchEntry[] {
  const out: SiteSearchEntry[] = [];
  const deepDir = join(resolveKnowledgeRoot(), 'deep');
  try {
    for (const file of readdirSync(deepDir)) {
      if (!file.endsWith('.json')) continue;
      const raw = JSON.parse(readFileSync(join(deepDir, file), 'utf8'));
      if (!raw.id || !raw.title) continue;
      out.push({
        id: `learn-${raw.id}`,
        title: raw.title,
        href: `/learn/${raw.id}`,
        category: 'learn',
        summary: raw.summary || String(raw.origins ?? '').slice(0, 160),
        keywords: `${raw.kind} ${(raw.match_keywords ?? []).join(' ')}`.slice(0, 200),
      });
    }
  } catch {
    /* missing */
  }
  return out;
}

function readSearchIndexFile(): SiteSearchEntry[] {
  const candidates = [
    join(process.cwd(), 'data/marketing/search-index.json'),
    join(resolveKnowledgeRoot(), '..', 'marketing', 'search-index.json'),
  ];
  for (const path of candidates) {
    try {
      const raw = JSON.parse(readFileSync(path, 'utf8'));
      return raw.entries ?? raw;
    } catch {
      /* try next */
    }
  }
  return [];
}

export function loadSiteSearchIndex(): SiteSearchEntry[] {
  if (cached) return cached;

  let entries: SiteSearchEntry[] = readSearchIndexFile();

  const learnIds = new Set(entries.filter((e) => e.category === 'learn').map((e) => e.id));
  for (const le of loadDeepLearn()) {
    if (!learnIds.has(le.id)) entries.push(le);
  }

  cached = entries;
  return entries;
}

function snippet(text: string, query: string, max = 140): string {
  const lower = text.toLowerCase();
  const q = query.toLowerCase().trim();
  const idx = lower.indexOf(q.split(/\s+/)[0] ?? q);
  if (idx < 0) return text.slice(0, max) + (text.length > max ? '…' : '');
  const start = Math.max(0, idx - 30);
  return (start > 0 ? '…' : '') + text.slice(start, start + max) + (text.length > start + max ? '…' : '');
}

export function searchSiteIndex(query: string, limit = 12): SiteSearchResult[] {
  const q = query.toLowerCase().trim();
  const entries = loadSiteSearchIndex();
  if (!q) {
    return entries
      .filter((e) => e.category === 'page' || e.category === 'faq')
      .slice(0, limit)
      .map((e) => ({ ...e, score: 1, snippet: e.summary.slice(0, 140) }));
  }

  const terms = q.split(/\s+/).filter(Boolean);

  return entries
    .map((e) => {
      const blob = `${e.title} ${e.summary} ${e.keywords ?? ''}`.toLowerCase();
      let score = 0;
      if (e.title.toLowerCase().includes(q)) score += 10;
      if (blob.includes(q)) score += 5;
      for (const t of terms) {
        if (e.title.toLowerCase().includes(t)) score += 3;
        if (blob.includes(t)) score += 1;
      }
      return { ...e, score, snippet: snippet(e.summary, q) };
    })
    .filter((e) => e.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function buildSiteContextForAI(query: string, topK = 8): string {
  const results = searchSiteIndex(query, topK);
  if (!results.length) {
    return 'No direct matches. SousChef is a Household Food Operating System with pantry tracking, meal planning, Clara AI sous chef, Brain insights, Kitchen Academy, and pricing Free/Plus/Family.';
  }
  return results
    .map((r, i) => `[${i + 1}] ${r.title} (${r.href})\n${r.summary}`)
    .join('\n\n');
}
