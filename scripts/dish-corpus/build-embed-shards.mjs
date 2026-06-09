#!/usr/bin/env node
/**
 * Agent Suite v6 Phase 4 — pre-built embedding shards (query-only embed at runtime).
 * Run: npm run knowledge:embed-shards  (requires OPENAI_API_KEY)
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');
const CORPUS = join(ROOT, 'data', 'ai', 'dishes', 'corpus');
const OUT = join(ROOT, 'data', 'ai', 'embeddings', 'shards');
const SAMPLES_PER_CUISINE = 80;
const BATCH = 64;

async function embedBatch(texts, apiKey) {
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: texts.map((t) => t.slice(0, 400)) }),
  });
  if (!res.ok) throw new Error(`Embeddings failed: ${res.status}`);
  const data = await res.json();
  return data.data.sort((a, b) => a.index - b.index).map((r) => r.embedding);
}

function quantize(vec) {
  let max = 0;
  for (const v of vec) max = Math.max(max, Math.abs(v));
  const scale = max > 0 ? 127 / max : 1;
  return vec.map((v) => Math.round(v * scale));
}

async function main() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('OPENAI_API_KEY required');
    process.exit(1);
  }

  mkdirSync(OUT, { recursive: true });
  const manifest = { version: 1, generated_at: new Date().toISOString(), shards: [] };

  for (const file of readdirSync(CORPUS).filter((f) => f.endsWith('.json'))) {
    const cuisine = file.replace('.json', '');
    const raw = JSON.parse(readFileSync(join(CORPUS, file), 'utf8'));
    const dishes = (raw.dishes ?? []).slice(0, SAMPLES_PER_CUISINE);
    if (!dishes.length) continue;

    const entries = [];
    for (let i = 0; i < dishes.length; i += BATCH) {
      const chunk = dishes.slice(i, i + BATCH);
      const texts = chunk.map((d) => {
        const a = d.attributes ?? {};
        return [d.display_name, a.course, ...(a.tags ?? []), cuisine].filter(Boolean).join(' ');
      });
      const vectors = await embedBatch(texts, apiKey);
      for (let j = 0; j < chunk.length; j++) {
        entries.push({
          id: chunk[j].id,
          title: chunk[j].display_name,
          v: quantize(vectors[j]),
        });
      }
      process.stdout.write(`  ${cuisine}: ${Math.min(i + BATCH, dishes.length)}/${dishes.length}\r`);
    }
    console.log(`  ${cuisine}: ${entries.length} vectors`);

    writeFileSync(join(OUT, `${cuisine}.json`), JSON.stringify({ cuisine, dim: 1536, entries }));
    manifest.shards.push({ cuisine, count: entries.length });
  }

  writeFileSync(join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log('Embedding shards complete:', manifest.shards.length, 'cuisines');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
