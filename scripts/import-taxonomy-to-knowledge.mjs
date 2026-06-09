/**
 * Import food taxonomy families into H:/HomeChefAi/data/ai/ingredients/
 * Run: node scripts/import-taxonomy-to-knowledge.mjs
 *
 * All output stays on H: drive (KNOWLEDGE_ROOT).
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, resolve } from 'path';

const KNOWLEDGE_ROOT = process.env.KNOWLEDGE_ROOT
  ? resolve(process.env.KNOWLEDGE_ROOT)
  : resolve('H:/HomeChefAi/data/ai');

const FAMILIES = [
  { id: 'cheese', displayName: 'Cheese', category: 'dairy', tags: ['american', 'italian'] },
  { id: 'tomato', displayName: 'Tomato', category: 'produce', tags: ['italian', 'mexican'] },
  { id: 'potato', displayName: 'Potato', category: 'produce', tags: ['american', 'comfort'] },
  { id: 'beans', displayName: 'Beans', category: 'legumes', tags: ['mexican', 'southern'] },
  { id: 'milk', displayName: 'Milk', category: 'dairy', tags: ['american'] },
  { id: 'rice', displayName: 'Rice', category: 'grains', tags: ['asian', 'mexican'] },
  { id: 'flour', displayName: 'Flour', category: 'grains', tags: ['american', 'baking'] },
  { id: 'ground_beef', displayName: 'Ground Beef', category: 'meat', tags: ['american', 'comfort'] },
];

const outDir = join(KNOWLEDGE_ROOT, 'ingredients');
mkdirSync(outDir, { recursive: true });

let created = 0;
let skipped = 0;

for (const fam of FAMILIES) {
  const nodeId = `ingredient.${fam.id}`;
  const fileName = `${fam.id}.json`;
  const filePath = join(outDir, fileName);

  if (existsSync(filePath)) {
    skipped++;
    continue;
  }

  const node = {
    id: nodeId,
    type: 'ingredient',
    display_name: fam.displayName,
    parent_id: `ingredient.${fam.category}`,
    attributes: {
      cuisine_tags: fam.tags,
      imported_from: 'food_taxonomy_1_1',
    },
    sources: ['import-taxonomy-to-knowledge', 'food_taxonomy_1_0'],
  };

  writeFileSync(filePath, JSON.stringify(node, null, 2) + '\n', 'utf8');
  created++;
}

console.log(`Knowledge import complete`);
console.log(`  Root: ${KNOWLEDGE_ROOT}`);
console.log(`  Created: ${created}`);
console.log(`  Skipped (exists): ${skipped}`);
