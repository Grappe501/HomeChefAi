/**
 * Knowledge registry, substitution intelligence, variant, and id resolution tests
 * Run: npm run test:knowledge
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  clearKnowledgeCache,
  getKnowledgeNode,
  getKnowledgeStats,
  getVariantNodes,
  loadKnowledgeRegistry,
  resolveKnowledgeRoot,
  searchKnowledge,
  validateKnowledgeNode,
  DEFAULT_KNOWLEDGE_ROOT,
} from '../netlify/functions/utils/ai/knowledgeLoader.ts';
import {
  resolveSubstitutions,
  parseSubstitutionReason,
  formatSubstitutionContext,
  resolveMissingFromPantry,
} from '../netlify/functions/utils/ai/substitutionEngine.ts';
import { getCuisineStaples, getPairings } from '../netlify/functions/utils/ai/graphQueries.ts';
import {
  resolveWizardInventoryKnowledge,
  taxonomySelectionToKnowledgeId,
  WIZARD_KNOWLEDGE_OVERRIDES,
} from '../src/types/knowledgeId.ts';

before(() => {
  process.env.KNOWLEDGE_ROOT = DEFAULT_KNOWLEDGE_ROOT;
  clearKnowledgeCache();
  loadKnowledgeRegistry(true);
});

after(() => {
  clearKnowledgeCache();
});

describe('knowledge registry', () => {
  it('resolves H: drive root', () => {
    const root = resolveKnowledgeRoot();
    assert.ok(root.replace(/\\/g, '/').includes('HomeChefAi/data/ai'));
  });

  it('loads 250+ nodes with variants', () => {
    const stats = getKnowledgeStats();
    assert.ok(stats.count >= 250, `Expected >= 250 nodes, got ${stats.count}`);
  });

  it('gets paprika by id', () => {
    const node = getKnowledgeNode('ingredient.paprika');
    assert.ok(node);
    assert.equal(node.display_name, 'Paprika');
  });

  it('searches by name', () => {
    assert.ok(searchKnowledge('paprika').length >= 1);
  });

  it('validates node shape', () => {
    const node = getKnowledgeNode('technique.roux');
    assert.ok(node && validateKnowledgeNode(node));
  });
});

describe('knowledgeId resolution', () => {
  it('maps cheese mozzarella taxonomy to variant id', () => {
    assert.equal(
      taxonomySelectionToKnowledgeId({
        taxonomy_id: 'cheese.mozzarella',
        family: 'cheese',
        variant: 'mozzarella',
        detail_level: 'quick_start',
      }),
      'ingredient.cheese.mozzarella',
    );
  });

  it('maps Paprika wizard item to base id', () => {
    const { knowledge_id } = resolveWizardInventoryKnowledge('Paprika');
    assert.equal(knowledge_id, WIZARD_KNOWLEDGE_OVERRIDES.Paprika);
  });

  it('maps White Rice to rice.white variant', () => {
    const { knowledge_id } = resolveWizardInventoryKnowledge('White Rice');
    assert.equal(knowledge_id, 'ingredient.rice.white');
  });

  it('maps Chicken Breast to chicken.breast variant', () => {
    const { knowledge_id } = resolveWizardInventoryKnowledge('Chicken Breast');
    assert.equal(knowledge_id, 'ingredient.chicken.breast');
  });
});

describe('variant nodes', () => {
  it('loads paprika.smoked variant', () => {
    const node = getKnowledgeNode('ingredient.paprika.smoked');
    assert.ok(node);
    assert.equal(node.parent_id, 'ingredient.paprika');
  });

  it('lists paprika variants', () => {
    assert.ok(getVariantNodes('ingredient.paprika').length >= 5);
  });

  it('inherits substitutes from parent for variant', () => {
    const result = resolveSubstitutions('ingredient.paprika.smoked', { reason: 'missing' });
    assert.ok(result && result.suggestions.length >= 1);
  });
});

describe('substitution intelligence', () => {
  it('parses reason aliases', () => {
    assert.equal(parseSubstitutionReason('plant-based'), 'vegan');
    assert.equal(parseSubstitutionReason(undefined), 'missing');
  });

  it('suggests vegan swaps for butter', () => {
    const result = resolveSubstitutions('ingredient.butter', { reason: 'vegan' });
    assert.ok(result && result.suggestions.length >= 1);
  });

  it('suggests vegan swaps for chicken', () => {
    const result = resolveSubstitutions('ingredient.chicken', { reason: 'vegan' });
    assert.ok(result?.suggestions.some((s) => s.id === 'ingredient.tofu'));
  });

  it('formats context for Clara prompts', () => {
    const ctx = formatSubstitutionContext('ingredient.butter', 'vegan');
    assert.ok(ctx.includes('Substitutes'));
  });
});

describe('graph queries', () => {
  it('returns cuisine staples', () => {
    assert.ok(Array.isArray(getCuisineStaples('cuisine.cajun')));
  });

  it('returns pairings for garlic', () => {
    assert.ok(getPairings('ingredient.garlic').length >= 1);
  });
});
