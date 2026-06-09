#!/usr/bin/env node
/**
 * Build compact BM25 search pack — bundled in functions (~60MB vs 340MB full corpus).
 * Run: npm run knowledge:search-pack
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, cpSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');
const AI = join(ROOT, 'data', 'ai');
const CORPUS = join(AI, 'dishes', 'corpus');
const OUT = join(AI, 'search');
const PUBLIC = join(ROOT, 'public', 'data', 'ai');

const STOP = new Set(['the', 'and', 'for', 'with', 'from', 'your', 'what', 'can', 'make', 'cook', 'how']);

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP.has(t));
}

function main() {
  const docs = [];
  let total = 0;

  for (const file of readdirSync(CORPUS).filter((f) => f.endsWith('.json'))) {
    const cuisineKey = file.replace('.json', '');
    const raw = JSON.parse(readFileSync(join(CORPUS, file), 'utf8'));
    const dishes = raw.dishes ?? [];
    for (const d of dishes) {
      const attrs = d.attributes ?? {};
      const keywords = [
        d.display_name,
        d.description ?? '',
        ...(attrs.tags ?? []),
        attrs.course ?? '',
        cuisineKey,
      ].join(' ');
      const terms = [...new Set(tokenize(keywords))];
      const ingredients = (attrs.ingredients ?? []).map((i) => (typeof i === 'string' ? i : i.name)).filter(Boolean);
      docs.push({
        id: d.id,
        title: d.display_name,
        cuisine_key: cuisineKey,
        cuisine_id: String(attrs.cuisine_id ?? `cuisine.${cuisineKey}`),
        course: String(attrs.course ?? 'main'),
        meal_types: attrs.meal_types ?? ['dinner'],
        prep_time_minutes: Number(attrs.prep_time_minutes ?? 30),
        tags: attrs.tags ?? [],
        terms,
        ingredient_names: ingredients,
        required_staples: attrs.required_staples ?? [],
        description: (d.description ?? '').slice(0, 200),
      });
      total++;
    }
  }

  mkdirSync(OUT, { recursive: true });
  const pack = {
    version: 1,
    generated_at: new Date().toISOString(),
    total,
    docs,
  };
  writeFileSync(join(OUT, 'dish-bm25-pack.json'), JSON.stringify(pack));
  console.log(`Wrote dish-bm25-pack.json — ${docs.length} docs, ${(JSON.stringify(pack).length / 1024 / 1024).toFixed(1)} MB`);

  mkdirSync(join(PUBLIC, 'dishes', 'corpus'), { recursive: true });
  cpSync(CORPUS, join(PUBLIC, 'dishes', 'corpus'), { recursive: true });
  cpSync(join(AI, 'dish-manifest.json'), join(PUBLIC, 'dish-manifest.json'));
  console.log('Copied corpus to public/data/ai for static serving');
}

main();
