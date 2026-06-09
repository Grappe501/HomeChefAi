/**
 * Phase 1 + substitution intelligence tests
 * Run: npm run test:knowledge
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  loadKnowledgeRegistry,
  getKnowledgeNode,
  searchKnowledge,
  getSubstituteNodes,
  validateKnowledgeNode,
  getKnowledgeStats,
  clearKnowledgeCache,
  resolveKnowledgeRoot,
  DEFAULT_KNOWLEDGE_ROOT,
} from '../netlify/functions/utils/ai/knowledgeLoader.ts';
import {
  resolveSubstitutions,
  parseSubstitutionReason,
  formatSubstitutionContext,
  resolveMissingFromPantry,
} from '../netlify/functions/utils/ai/substitutionEngine.ts';
import { getCuisineStaples, getPairings } from '../netlify/functions/utils/ai/graphQueries.ts';

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

  it('loads 80+ nodes after Phase 2 generation', () => {
    const stats = getKnowledgeStats();
    assert.ok(stats.count >= 80, `Expected >= 80 nodes, got ${stats.count}`);
  });

  it('gets paprika by id', () => {
    const node = getKnowledgeNode('ingredient.paprika');
    assert.ok(node);
    assert.equal(node.display_name, 'Paprika');
  });

  it('searches by name', () => {
    const results = searchKnowledge('paprika');
    assert.ok(results.length >= 1);
  });

  it('validates node shape', () => {
    const node = getKnowledgeNode('technique.roux');
    assert.ok(node && validateKnowledgeNode(node));
  });
});

describe('substitution intelligence', () => {
  it('parses reason aliases', () => {
    assert.equal(parseSubstitutionReason('plant-based'), 'vegan');
    assert.equal(parseSubstitutionReason('dairyfree'), 'dairy_free');
    assert.equal(parseSubstitutionReason(undefined), 'missing');
  });

  it('suggests missing substitutes for paprika', () => {
    const result = resolveSubstitutions('ingredient.paprika', { reason: 'missing' });
    assert.ok(result);
    assert.ok(result.suggestions.length >= 1);
    assert.equal(result.reason, 'missing');
  });

  it('suggests vegan swaps for butter', () => {
    const result = resolveSubstitutions('ingredient.butter', { reason: 'vegan' });
    assert.ok(result);
    assert.equal(result.already_satisfies, false);
    assert.ok(result.suggestions.length >= 1);
    const ids = result.suggestions.map((s) => s.id);
    assert.ok(ids.some((id) => id.includes('vegan') || id.includes('coconut')));
  });

  it('suggests vegan swaps for chicken', () => {
    const result = resolveSubstitutions('ingredient.chicken', { reason: 'vegan' });
    assert.ok(result);
    assert.ok(result.suggestions.length >= 1);
    assert.ok(result.suggestions.some((s) => s.id === 'ingredient.tofu' || s.id === 'ingredient.tempeh'));
  });

  it('suggests gluten-free flour swap', () => {
    const result = resolveSubstitutions('ingredient.flour', { reason: 'gluten_free' });
    assert.ok(result);
    assert.ok(result.suggestions.some((s) => s.id === 'ingredient.gluten_free_flour'));
  });

  it('reports tofu already satisfies vegan', () => {
    const result = resolveSubstitutions('ingredient.tofu', { reason: 'vegan' });
    assert.ok(result);
    assert.equal(result.already_satisfies, true);
  });

  it('formats context for Clara prompts', () => {
    const ctx = formatSubstitutionContext('ingredient.butter', 'vegan');
    assert.ok(ctx.includes('Substitutes'));
    assert.ok(ctx.includes('butter') || ctx.includes('Butter'));
  });

  it('resolves missing from pantry with available subs', () => {
    const results = resolveMissingFromPantry(
      ['ingredient.paprika'],
      ['ingredient.cayenne'],
      'missing',
    );
    assert.equal(results.length, 1);
  });
});

describe('graph queries', () => {
  it('returns cuisine staples', () => {
    const staples = getCuisineStaples('cuisine.cajun');
    assert.ok(Array.isArray(staples));
  });

  it('returns pairings for garlic', () => {
    const pairings = getPairings('ingredient.garlic');
    assert.ok(pairings.length >= 1);
  });
});
