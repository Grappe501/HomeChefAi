/**
 * Enrich ingredient knowledge nodes with packaging, brands, forms, and retail depth.
 * Run: npm run knowledge:depth
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { WIZARD_ITEM_CONFIG } from '../src/types/pantryWizard.js';
import { FOOD_TAXONOMY } from '../src/types/foodTaxonomy.js';
import { WIZARD_KNOWLEDGE_OVERRIDES, wizardItemToSlug } from '../src/types/knowledgeIdCore.js';
import type { KnowledgeNode } from '../src/types/knowledge.js';
import {
  brandsForWizardItem,
  inferRetailAisle,
  inferStorageLocation,
} from './ingredient-depth/brand-catalog.js';

const KNOWLEDGE_ROOT = process.env.KNOWLEDGE_ROOT
  ? resolve(process.env.KNOWLEDGE_ROOT)
  : resolve('data/ai');

const ING_DIR = join(KNOWLEDGE_ROOT, 'ingredients');

function loadAllIngredientNodes(): Map<string, { path: string; node: KnowledgeNode }> {
  const map = new Map<string, { path: string; node: KnowledgeNode }>();
  for (const file of readdirSync(ING_DIR)) {
    if (!file.endsWith('.json')) continue;
    const path = join(ING_DIR, file);
    const node = JSON.parse(readFileSync(path, 'utf8')) as KnowledgeNode;
    if (node.type !== 'ingredient') continue;
    map.set(node.id, { path, node });
  }
  return map;
}

function findNodeForWizardItem(
  wizardItem: string,
  nodes: Map<string, { path: string; node: KnowledgeNode }>,
): { path: string; node: KnowledgeNode } | undefined {
  const overrideId = WIZARD_KNOWLEDGE_OVERRIDES[wizardItem];
  if (overrideId && nodes.has(overrideId)) return nodes.get(overrideId);

  for (const entry of nodes.values()) {
    if (entry.node.attributes?.wizard_item === wizardItem) return entry;
  }

  const slugId = `ingredient.${wizardItemToSlug(wizardItem)}`;
  if (nodes.has(slugId)) return nodes.get(slugId);

  return undefined;
}

function taxonomyFamilyForWizard(wizardItem: string): string | undefined {
  for (const [id, family] of Object.entries(FOOD_TAXONOMY)) {
    if (family.wizardItemName === wizardItem) return id;
  }
  return undefined;
}

function enrichFromWizard(wizardItem: string, node: KnowledgeNode): KnowledgeNode {
  const config = WIZARD_ITEM_CONFIG[wizardItem];
  if (!config) return node;

  const attrs = { ...(node.attributes ?? {}) };
  attrs.wizard_item = wizardItem;
  attrs.taxonomy_family = attrs.taxonomy_family ?? taxonomyFamilyForWizard(wizardItem);
  attrs.unit_category = config.unitCategory;
  attrs.default_unit = config.defaultUnit;
  attrs.package_label = config.packageLabel;
  attrs.packaging_options = config.level1Options.map((o) => ({
    label: o.label,
    quantity: o.quantity,
    unit: o.unit,
  }));
  attrs.retail_aisle = inferRetailAisle(wizardItem, config.unitCategory);
  attrs.storage_location = inferStorageLocation(wizardItem, config.unitCategory);
  attrs.brand_examples = brandsForWizardItem(wizardItem).map((b) => ({
    id: b.id,
    label: b.label,
    tier: b.tier,
  }));

  if (config.subtypes?.length) {
    attrs.form_options = config.subtypes.map((s) => ({
      id: wizardItemToSlug(s),
      label: s,
    }));
  }

  return { ...node, attributes: attrs, sources: [...new Set([...(node.sources ?? []), 'ingredient_depth_v1'])] };
}

function enrichFromTaxonomy(node: KnowledgeNode): KnowledgeNode {
  const familyId = node.attributes?.taxonomy_family as string | undefined;
  if (!familyId || !FOOD_TAXONOMY[familyId]) return node;

  const family = FOOD_TAXONOMY[familyId];
  const attrs = { ...(node.attributes ?? {}) };

  if (family.formOptions?.length) {
    attrs.form_options = family.formOptions.map((f) => ({
      id: f.id,
      label: f.label,
      packaging: f.quantityOptions[0]?.unit,
      knowledge_id: f.variant
        ? `ingredient.${familyId}.${f.variant}`
        : f.form
          ? `ingredient.${familyId}.${f.form}`
          : undefined,
    }));
  } else if (family.forms?.length) {
    attrs.form_options = family.forms.map((f) => ({ id: f.id, label: f.label }));
  }

  if (family.commonUnits?.length && !attrs.default_unit) {
    attrs.default_unit = family.commonUnits[0];
  }

  return { ...node, attributes: attrs };
}

function writeNode(path: string, node: KnowledgeNode) {
  writeFileSync(path, JSON.stringify(node, null, 2) + '\n', 'utf8');
}

function consolidateChickenBreast(nodes: Map<string, { path: string; node: KnowledgeNode }>) {
  const legacy = nodes.get('ingredient.chicken_breast');
  const canonicalPath = join(ING_DIR, 'chicken_breast.json');
  const canonical: KnowledgeNode = {
    id: 'ingredient.chicken.breast',
    type: 'ingredient',
    display_name: 'Chicken Breast',
    parent_id: 'ingredient.chicken',
    description: 'Boneless skinless chicken breast — sold fresh or frozen in family packs.',
    attributes: {
      ...(legacy?.node.attributes ?? {}),
      wizard_item: 'Chicken Breast',
      variant_of: 'ingredient.chicken',
      variant_key: 'breast',
      alias_ids: ['ingredient.chicken_breast'],
      dietary: { contains_meat: true },
      cuisine_tags: ['american', 'mediterranean', 'asian', 'mexican'],
    },
    sources: ['ingredient_depth_v1', 'curated'],
  };

  const enriched = enrichFromWizard('Chicken Breast', canonical);
  writeNode(canonicalPath, enriched);
  nodes.set('ingredient.chicken.breast', { path: canonicalPath, node: enriched });

  const chickenParent = nodes.get('ingredient.chicken');
  if (chickenParent) {
    const variantIds = new Set(chickenParent.node.attributes?.variant_ids as string[] ?? []);
    variantIds.add('ingredient.chicken.breast');
    variantIds.delete('ingredient.chicken_breast');
    chickenParent.node.attributes = {
      ...chickenParent.node.attributes,
      variant_ids: [...variantIds],
    };
    writeNode(chickenParent.path, chickenParent.node);
  }
}

function main() {
  const nodes = loadAllIngredientNodes();
  let enriched = 0;
  let created = 0;

  for (const wizardItem of Object.keys(WIZARD_ITEM_CONFIG)) {
    let entry = findNodeForWizardItem(wizardItem, nodes);
    if (!entry) {
      const id = WIZARD_KNOWLEDGE_OVERRIDES[wizardItem] ?? `ingredient.${wizardItemToSlug(wizardItem)}`;
      const slug = id.replace('ingredient.', '').replace(/\./g, '_');
      const path = join(ING_DIR, `${slug}.json`);
      const node: KnowledgeNode = {
        id,
        type: 'ingredient',
        display_name: wizardItem,
        parent_id: 'ingredient.pantry',
        attributes: { wizard_item: wizardItem },
        sources: ['ingredient_depth_v1'],
      };
      entry = { path, node };
      nodes.set(id, entry);
      created++;
    }

    let next = enrichFromWizard(wizardItem, entry.node);
    next = enrichFromTaxonomy(next);
    writeNode(entry.path, next);
    entry.node = next;
    enriched++;
  }

  consolidateChickenBreast(nodes);

  for (const { path, node } of nodes.values()) {
    if (node.attributes?.taxonomy_family && !node.attributes?.wizard_item) {
      const next = enrichFromTaxonomy(node);
      if (JSON.stringify(next) !== JSON.stringify(node)) {
        writeNode(path, next);
        enriched++;
      }
    }
  }

  const manifest = {
    version: 1,
    generated_at: new Date().toISOString(),
    total_ingredient_files: nodes.size,
    wizard_items_enriched: Object.keys(WIZARD_ITEM_CONFIG).length,
    with_packaging: [...nodes.values()].filter((e) => e.node.attributes?.packaging_options?.length).length,
    with_brands: [...nodes.values()].filter((e) => e.node.attributes?.brand_examples?.length).length,
    with_forms: [...nodes.values()].filter((e) => e.node.attributes?.form_options?.length).length,
  };

  writeFileSync(join(KNOWLEDGE_ROOT, 'ingredient-manifest.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf8');

  console.log(`Enriched ${enriched} ingredient nodes (${created} created)`);
  console.log('Manifest:', manifest);
}

main();
