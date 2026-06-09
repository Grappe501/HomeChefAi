/**
 * Generates public/sitemap.xml from site search entries + legal pages.
 * Run: npx tsx scripts/build-sitemap.ts
 */
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readdirSync, readFileSync } from 'fs';
import { buildSiteSearchEntries } from '../src/content/siteSearchData.js';
import { SITE_URL } from '../src/content/marketingContent.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const deepDir = join(root, 'data/ai/deep');

function learnEntries() {
  const out: { href: string }[] = [];
  try {
    for (const file of readdirSync(deepDir)) {
      if (!file.endsWith('.json')) continue;
      const raw = JSON.parse(readFileSync(join(deepDir, file), 'utf8'));
      if (raw.id) out.push({ href: `/learn/${raw.id}` });
    }
  } catch {
    /* optional */
  }
  return out;
}

const entries = buildSiteSearchEntries(
  learnEntries().map((e, i) => ({
    id: `learn-sitemap-${i}`,
    title: '',
    href: e.href,
    category: 'learn' as const,
    summary: '',
  })),
);

const urls = new Set<string>();
urls.add('/');
for (const e of entries) {
  if (e.href.startsWith('/') && !e.href.endsWith('.html') && !e.href.includes('#')) {
    urls.add(e.href);
  }
}
for (const legal of ['privacy', 'terms', 'ai-usage', 'community', 'sub-processors']) {
  urls.add(`/legal/${legal}.html`);
}

const today = new Date().toISOString().slice(0, 10);
const priority = (path: string) => {
  if (path === '/' || path === '/landing') return '1.0';
  if (path === '/pricing' || path === '/explore') return '0.9';
  if (path.startsWith('/learn/') || path.startsWith('/explore/')) return '0.6';
  if (path.startsWith('/legal/')) return '0.4';
  return '0.7';
};

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...urls]
  .sort()
  .map(
    (path) =>
      `  <url><loc>${SITE_URL}${path === '/' ? '/landing' : path}</loc><lastmod>${today}</lastmod><changefreq>${path.startsWith('/legal/') ? 'yearly' : 'weekly'}</changefreq><priority>${priority(path)}</priority></url>`,
  )
  .join('\n')}
</urlset>
`;

writeFileSync(join(root, 'public/sitemap.xml'), xml);
console.log(`Wrote sitemap with ${urls.size} URLs to public/sitemap.xml`);
