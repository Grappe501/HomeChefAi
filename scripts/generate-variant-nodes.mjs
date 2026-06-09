/**
 * Generate variant ingredient nodes from parent nodes + food taxonomy.
 * Output: H:/HomeChefAi/data/ai/ingredients/
 * Run: npm run knowledge:variants
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { join, resolve } from 'path';

const KNOWLEDGE_ROOT = process.env.KNOWLEDGE_ROOT
  ? resolve(process.env.KNOWLEDGE_ROOT)
  : resolve('H:/HomeChefAi/data/ai');

const ING_DIR = join(KNOWLEDGE_ROOT, 'ingredients');

/** Extra variants from FOOD_TAXONOMY not yet on parent nodes */
const TAXONOMY_VARIANTS = {
  'ingredient.milk': [
    { id: 'whole', label: 'Whole Milk' },
    { id: 'two_percent', label: '2% Milk' },
    { id: 'skim', label: 'Skim Milk' },
    { id: 'lactose_free', label: 'Lactose-Free Milk' },
    { id: 'oat', label: 'Oat Milk', dietary: { vegan: true, vegetarian: true } },
    { id: 'almond', label: 'Almond Milk', dietary: { vegan: true, vegetarian: true, contains_nuts: true } },
  ],
  'ingredient.potato': [
    { id: 'russet', label: 'Russet Potato' },
    { id: 'red', label: 'Red Potato' },
    { id: 'yukon_gold', label: 'Yukon Gold Potato' },
    { id: 'sweet', label: 'Sweet Potato' },
  ],
  'ingredient.beans': [
    { id: 'black', label: 'Black Beans' },
    { id: 'kidney', label: 'Kidney Beans' },
    { id: 'pinto', label: 'Pinto Beans' },
    { id: 'chickpea', label: 'Chickpeas' },
  ],
  'ingredient.cheese': [
    { id: 'cheddar', label: 'Cheddar Cheese' },
    { id: 'mozzarella', label: 'Mozzarella Cheese' },
    { id: 'parmesan', label: 'Parmesan Cheese' },
    { id: 'pepper_jack', label: 'Pepper Jack Cheese' },
    { id: 'swiss', label: 'Swiss Cheese' },
    { id: 'shredded', label: 'Shredded Cheese' },
    { id: 'block', label: 'Block Cheese' },
  ],
  'ingredient.tomato': [
    { id: 'fresh', label: 'Fresh Tomatoes' },
    { id: 'diced', label: 'Diced Tomatoes (canned)' },
    { id: 'crushed', label: 'Crushed Tomatoes (canned)' },
    { id: 'sauce', label: 'Tomato Sauce' },
    { id: 'paste', label: 'Tomato Paste' },
  ],
  'ingredient.ground_beef': [
    { id: '80_20', label: 'Ground Beef 80/20' },
    { id: '85_15', label: 'Ground Beef 85/15' },
    { id: '90_10', label: 'Ground Beef 90/10' },
    { id: '93_7', label: 'Ground Beef 93/7' },
  ],
  'ingredient.flour': [
    { id: 'all_purpose', label: 'All-Purpose Flour' },
    { id: 'bread', label: 'Bread Flour' },
    { id: 'self_rising', label: 'Self-Rising Flour' },
    { id: 'whole_wheat', label: 'Whole Wheat Flour' },
  ],
  'ingredient.rice': [
    { id: 'white', label: 'White Rice' },
    { id: 'jasmine', label: 'Jasmine Rice' },
    { id: 'basmati', label: 'Basmati Rice' },
    { id: 'brown', label: 'Brown Rice' },
    { id: 'wild', label: 'Wild Rice' },
  ],
};

function variantFileName(parentId, variantId) {
  const parentSlug = parentId.replace('ingredient.', '').replace(/\./g, '_');
  return `${parentSlug}_${variantId}.json`;
}

function loadParentNodes() {
  const parents = new Map();
  for (const file of readdirSync(ING_DIR)) {
    if (!file.endsWith('.json')) continue;
    const raw = JSON.parse(readFileSync(join(ING_DIR, file), 'utf8'));
    if (raw.type !== 'ingredient') continue;
    if (raw.attributes?.variant_of) continue;
    parents.set(raw.id, raw);
  }
  return parents;
}

function findParentFile(parentId) {
  const slug = parentId.replace('ingredient.', '');
  const candidates = [
    join(ING_DIR, `${slug}.json`),
    join(ING_DIR, `${slug.replace(/\./g, '_')}.json`),
  ];
  return candidates.find((p) => existsSync(p));
}

function collectVariants(parentId, parentNode) {
  const fromNode = (parentNode.attributes?.variants ?? []).map((v) => ({
    id: v.id,
    label: v.label,
    dietary: undefined,
  }));
  const fromTaxonomy = TAXONOMY_VARIANTS[parentId] ?? [];
  const byId = new Map();
  for (const v of [...fromNode, ...fromTaxonomy]) {
    if (!byId.has(v.id)) byId.set(v.id, v);
  }
  return [...byId.values()];
}

let created = 0;
let skipped = 0;
let parentsPatched = 0;

mkdirSync(ING_DIR, { recursive: true });
const parents = loadParentNodes();

for (const [parentId, parentNode] of parents) {
  const variants = collectVariants(parentId, parentNode);
  if (!variants.length) continue;

  const variantIds = [];
  const parentDietary = parentNode.attributes?.dietary;

  for (const v of variants) {
    const variantKnowledgeId = `${parentId}.${v.id}`;
    variantIds.push(variantKnowledgeId);
    const fileName = variantFileName(parentId, v.id);
    const filePath = join(ING_DIR, fileName);

    const node = {
      id: variantKnowledgeId,
      type: 'ingredient',
      display_name: v.label,
      parent_id: parentId,
      attributes: {
        variant_of: parentId,
        variant_key: v.id,
        dietary: v.dietary ?? parentDietary,
        cuisine_tags: parentNode.attributes?.cuisine_tags,
        pairings: parentNode.attributes?.pairings,
      },
      sources: ['generate-variant-nodes', ...(parentNode.sources ?? [])],
    };

    if (!existsSync(filePath)) {
      writeFileSync(filePath, JSON.stringify(node, null, 2) + '\n', 'utf8');
      created++;
    } else {
      skipped++;
    }
  }

  const parentPath = findParentFile(parentId);
  if (parentPath) {
    const updated = JSON.parse(readFileSync(parentPath, 'utf8'));
    updated.attributes = updated.attributes ?? {};
    updated.attributes.variant_ids = variantIds;
    writeFileSync(parentPath, JSON.stringify(updated, null, 2) + '\n', 'utf8');
    parentsPatched++;
  }
}

function getKnowledgeNodeFallback(parentId) {
  const p = findParentFile(parentId);
  if (!p) return null;
  return JSON.parse(readFileSync(p, 'utf8'));
}

/** Push corpus toward 250+ with high-value variant-specific nodes */
const EXTRA_VARIANTS = [
  { parent: 'ingredient.chicken', id: 'wings', label: 'Chicken Wings' },
  { parent: 'ingredient.chicken', id: 'drumstick', label: 'Chicken Drumsticks' },
  { parent: 'ingredient.bacon', id: 'turkey', label: 'Turkey Bacon' },
  { parent: 'ingredient.sausage', id: 'italian', label: 'Italian Sausage' },
  { parent: 'ingredient.sausage', id: 'breakfast', label: 'Breakfast Sausage' },
  { parent: 'ingredient.paprika', id: 'pimenton', label: 'Pimentón (Spanish Paprika)' },
  { parent: 'ingredient.tomato', id: 'cherry', label: 'Cherry Tomatoes' },
  { parent: 'ingredient.onion', id: 'green', label: 'Green Onions' },
];

for (const extra of EXTRA_VARIANTS) {
  const variantKnowledgeId = `${extra.parent}.${extra.id}`;
  const fileName = variantFileName(extra.parent, extra.id);
  const filePath = join(ING_DIR, fileName);
  if (existsSync(filePath)) continue;
  const parentNode = parents.get(extra.parent) ?? getKnowledgeNodeFallback(extra.parent);
  const node = {
    id: variantKnowledgeId,
    type: 'ingredient',
    display_name: extra.label,
    parent_id: extra.parent,
    attributes: {
      variant_of: extra.parent,
      variant_key: extra.id,
      dietary: parentNode?.attributes?.dietary,
    },
    sources: ['generate-variant-nodes'],
  };
  writeFileSync(filePath, JSON.stringify(node, null, 2) + '\n', 'utf8');
  created++;
}

console.log(JSON.stringify({ root: KNOWLEDGE_ROOT, created, skipped, parents_patched: parentsPatched }, null, 2));
