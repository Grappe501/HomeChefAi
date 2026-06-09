/**
 * Sandbox smoke test — intelligence stack imports and deterministic engines.
 * Run: npx tsx scripts/sandbox-intelligence.mjs
 */
import { strict as assert } from 'node:assert';

const results = [];

async function check(name, fn) {
  try {
    await fn();
    results.push({ name, ok: true });
    console.log(`✓ ${name}`);
  } catch (err) {
    results.push({ name, ok: false, error: err instanceof Error ? err.message : String(err) });
    console.error(`✗ ${name}:`, err instanceof Error ? err.message : err);
  }
}

await check('taste profile engine', async () => {
  const { formatTasteProfileForPrompt } = await import('../netlify/functions/utils/learning/tasteProfileEngine.js');
  const block = formatTasteProfileForPrompt({
    version: 1,
    taste_vector: {
      spicy: 0.5,
      rich: 0.5,
      acidic: 0.5,
      fresh_light: 0.5,
      adventurous: 0.5,
      kid_friendly: 0.5,
      comfort: 0.5,
      quick_weeknight: 0.5,
    },
    preferences: [],
    drift_notes: [],
    updated_at: new Date().toISOString(),
  });
  assert.equal(typeof block, 'string');
});

await check('behavior profile engine', async () => {
  const { inferBehaviorProfile, formatBehaviorProfileForPrompt, buildRhythmNudges } = await import(
    '../netlify/functions/utils/learning/behaviorProfileEngine.js'
  );
  const profile = inferBehaviorProfile({
    profile: { user_id: 'test', dietary_restrictions: [], cuisine_preferences: [], allergies: [], household_size: 2, preferred_store: 'Walmart', gamification_level: 1, gamification_xp: 0, onboarding_complete: true, assistant_name: 'Clara', last_meal_memory: {} },
    usageLogs: [
      { id: '1', meal_name: 'Pasta', created_at: new Date().toISOString() },
      { id: '2', meal_name: 'Tacos', created_at: new Date(Date.now() - 86400000).toISOString() },
      { id: '3', meal_name: 'Soup', created_at: new Date(Date.now() - 172800000).toISOString() },
      { id: '4', meal_name: 'Leftover pasta', created_at: new Date(Date.now() - 259200000).toISOString() },
    ],
    receipts: [
      { id: 'r1', receipt_date: '2026-06-01', total_amount: 85, verified: true, created_at: '2026-06-01T12:00:00Z' },
      { id: 'r2', receipt_date: '2026-06-08', total_amount: 92, verified: true, created_at: '2026-06-08T12:00:00Z' },
    ],
    mealOutcomes: [],
    ledgerEntries: [],
  });
  assert.ok(profile.time_budget.weeknight_max_minutes > 0);
  assert.ok(formatBehaviorProfileForPrompt(profile).includes('Kitchen rhythm'));
  assert.ok(Array.isArray(buildRhythmNudges(profile)));
});

await check('inventory steward engine', async () => {
  const { buildStewardPreview, findLowStock } = await import('../netlify/functions/utils/inventory/stewardEngine.js');
  const items = [
    { id: '1', user_id: 'u', name: 'Milk', category: 'dairy', quantity: 0.5, unit: 'gal', location: 'fridge', added_via: 'manual', created_at: '', updated_at: '' },
    { id: '2', user_id: 'u', name: 'milk', category: 'dairy', quantity: 1, unit: 'gal', location: 'fridge', added_via: 'manual', created_at: '', updated_at: '' },
  ];
  const preview = buildStewardPreview(items);
  assert.ok(preview.duplicates.length >= 1);
  assert.ok(Array.isArray(findLowStock(items)));
});

await check('clara agent tools registry', async () => {
  const { CLARA_AGENT_TOOLS } = await import('../netlify/functions/utils/ai/claraAgentTools.js');
  const names = CLARA_AGENT_TOOLS.map((t) => t.function.name);
  for (const required of [
    'get_taste_profile',
    'get_kitchen_rhythm',
    'remember_preference',
    'reconcile_inventory',
    'audit_pantry',
    'apply_inventory_delta',
    'search_dishes',
    'get_brain_context',
  ]) {
    assert.ok(names.includes(required), `missing tool: ${required}`);
  }
});

await check('dish search pack (disk)', async () => {
  const { ensureSearchPack } = await import('../netlify/functions/utils/ai/dishSearchPack.js');
  const docs = await ensureSearchPack();
  assert.ok(docs.length > 1000, `expected large corpus, got ${docs.length}`);
});

await check('kitchen brain context exports', async () => {
  const mod = await import('../netlify/functions/utils/ai/kitchenBrainContext.js');
  assert.equal(typeof mod.buildKitchenBrainContext, 'function');
  assert.equal(typeof mod.buildPlannerIntelligenceFeedback, 'function');
});

await check('static search pack in public/', async () => {
  const { existsSync } = await import('node:fs');
  const { join } = await import('node:path');
  const path = join(process.cwd(), 'public/data/ai/search/dish-bm25-pack.json');
  assert.ok(existsSync(path), 'public search pack missing — run build-search-pack first');
});

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
if (failed.length) {
  process.exit(1);
}
