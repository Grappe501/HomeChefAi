/**
 * Writes data/marketing/search-index.json for Netlify site-search function.
 * Run: npx tsx scripts/build-search-index.ts
 */
import { writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { buildSiteSearchEntries } from '../src/content/siteSearchData.js';
import type { SiteSearchEntry } from '../src/types/siteSearch.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const deepDir = join(root, 'data/ai/deep');

function learnEntries(): SiteSearchEntry[] {
  const out: SiteSearchEntry[] = [];
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
        summary: raw.summary || raw.origins?.slice(0, 160) || '',
        keywords: `${raw.kind} ${raw.match_keywords?.join(' ') ?? ''} ${raw.history ?? ''}`.slice(0, 300),
      });
    }
  } catch {
    /* optional */
  }
  return out;
}

const entries = buildSiteSearchEntries(learnEntries());
const outDir = join(root, 'data/marketing');
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'search-index.json'), JSON.stringify({ entries, built_at: new Date().toISOString() }, null, 0));
console.log(`Wrote ${entries.length} search entries to data/marketing/search-index.json`);
