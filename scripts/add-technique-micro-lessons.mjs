/**
 * Add micro_lesson to technique nodes missing one (Phase 7).
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const ROOT = 'H:/HomeChefAi/data/ai/techniques';

const LESSONS = {
  saute: 'Cook until onions turn translucent — that sweetness is your flavor base.',
  stir_fry: 'Keep the pan screaming hot; add ingredients in order of cook time.',
  sear: 'Pat protein dry — moisture is the enemy of a golden crust.',
  roast: 'Give food space on the sheet pan; crowding steams instead of roasts.',
  braise: 'Brown first, then low-and-slow in liquid — tough cuts become tender.',
  simmer: 'Gentle bubbles, not a rolling boil — keeps broth clear and meat tender.',
  poach: 'Liquid should shimmer, never boil — perfect for eggs and delicate fish.',
  steam: 'Keep the lid on; escaping steam is lost cooking power.',
  grill: 'Clean grates + oil = fewer stuck proteins and better grill marks.',
  deep_fry: 'Oil at 350–375°F — too cool means greasy, too hot burns outside.',
  emulsion: 'Add oil in a thin stream while whisking — patience beats speed.',
  caramelize: 'Low heat + patience — rush it and you get bitter, not sweet.',
  deglaze: 'Scrape the fond — that brown layer is concentrated flavor.',
  marinate: 'Acid + time — 30 minutes for fish, overnight for tough cuts.',
  ferment: 'Salt and time control safety — follow tested ratios for pickles.',
  knead: 'Stop when dough is smooth and springs back — over-kneading toughens bread.',
  proof: 'Warm draft-free spot — dough should double before baking.',
  rest: 'Rest meat 5–10 minutes after cooking — juices redistribute instead of running out.',
  reduce: 'Wide pan, medium heat — more surface area = faster, richer reduction.',
};

const files = readdirSync(ROOT).filter((f) => f.endsWith('.json'));
let updated = 0;

for (const file of files) {
  const path = join(ROOT, file);
  const node = JSON.parse(readFileSync(path, 'utf-8'));
  const key = file.replace('.json', '');
  if (node.attributes?.micro_lesson) continue;
  const lesson = LESSONS[key];
  if (!lesson) continue;
  node.attributes = { ...(node.attributes ?? {}), micro_lesson: lesson };
  if (!node.description && key === 'saute') {
    node.description = 'Quick cooking in a small amount of fat over medium-high heat.';
  }
  writeFileSync(path, JSON.stringify(node, null, 2) + '\n');
  updated++;
  console.log('Updated', file);
}

console.log(`Done — ${updated} techniques updated.`);
