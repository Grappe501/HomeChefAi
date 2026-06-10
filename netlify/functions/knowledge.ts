import type { Handler } from '@netlify/functions';
import { withCors, jsonResponse, errorResponse, requireAuth } from './utils/response.js';
import {
  getKnowledgeNode,
  searchKnowledge,
  getSubstituteNodes,
  getRelatedByPairing,
  listKnowledgeNodes,
  getKnowledgeStats,
  getVariantNodes,
  findKnowledgeByWizardItem,
} from './utils/ai/knowledgeLoader.js';
import {
  resolveSubstitutions,
  resolveMissingFromPantry,
  parseSubstitutionReason,
  formatSubstitutionContext,
} from './utils/ai/substitutionEngine.js';
import {
  getPairings,
  getCuisineStaples,
  getNodesByCuisineTag,
  searchAndSubstitute,
} from './utils/ai/graphQueries.js';
import type { KnowledgeNodeType, SubstitutionReason } from '../../src/types/knowledge.js';
import { SUBSTITUTION_REASONS } from '../../src/types/knowledge.js';
import { getDeepEntry, listDeepEntries, searchDeep } from './utils/ai/deepLoader.js';
import { matchDishesForPantry } from './utils/ai/dishMatcher.js';
import { listFeaturedAcademyTracks, listAcademyDirectories, suggestAcademyPractice } from './utils/ai/academyPractice.js';
import { useDevStore, loadStore } from './utils/db.js';
import { getSupabaseUserClient } from './utils/supabase.js';
import type { InventoryItem, Profile } from '../../src/types/index.js';

const VALID_TYPES = new Set([
  'ingredient', 'technique', 'cuisine', 'meal_pattern', 'substitution',
  'flavor_profile', 'food_science', 'nutrition', 'hosting', 'culture', 'tradition', 'dish', 'food_source',
]);

export const handler: Handler = withCors(async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return jsonResponse({});
  }

  if (event.httpMethod !== 'GET') {
    return errorResponse('Method not allowed', 405);
  }

  const user = await requireAuth(event);
  if (!user) return errorResponse('Unauthorized', 401);

  const params = event.queryStringParameters ?? {};
  const action = params.action ?? 'get';

  if (action === 'stats') {
    return jsonResponse(getKnowledgeStats());
  }

  if (action === 'academy_tracks') {
    return jsonResponse({ tracks: listFeaturedAcademyTracks() });
  }

  if (action === 'academy_directories') {
    return jsonResponse({ directories: listAcademyDirectories() });
  }

  if (action === 'academy_practice') {
    const trackId = params.track_id?.trim();
    const levelId = params.level_id?.trim();
    const moduleId = params.module_id?.trim();
    if (!trackId || !levelId || !moduleId) {
      return errorResponse('track_id, level_id, and module_id are required', 400);
    }
    let inventory: InventoryItem[] = [];
    let profile: Profile = {
      user_id: user.id,
      dietary_restrictions: [],
      cuisine_preferences: [],
      allergies: [],
      household_size: 2,
      preferred_store: '',
      gamification_level: 1,
      gamification_xp: 0,
      onboarding_complete: true,
      assistant_name: 'Clara',
      last_meal_memory: {},
    };
    if (useDevStore()) {
      const store = loadStore();
      inventory = store.inventory_items.filter((i) => i.user_id === user.id);
      const prof = store.profiles.find((p) => p.user_id === user.id);
      if (prof) profile = prof as Profile;
    } else if (user.token) {
      const db = getSupabaseUserClient(user.token);
      const { data: items } = await db.from('inventory_items').select('*').eq('user_id', user.id);
      inventory = (items ?? []) as InventoryItem[];
      const { data: prof } = await db.from('profiles').select('*').eq('user_id', user.id).maybeSingle();
      if (prof) profile = prof as Profile;
    }
    const practice = await suggestAcademyPractice(trackId, levelId, moduleId, inventory, profile);
    if (!practice) return errorResponse('Academy module not found', 404);
    return jsonResponse({ practice });
  }

  if (action === 'deep_catalog') {
    const kind = params.kind as import('../../src/types/knowledgeDeep.js').DeepEntryKind | undefined;
    const entries = listDeepEntries(kind).map((e) => ({
      id: e.id,
      kind: e.kind,
      title: e.title,
      summary: e.summary,
      first_known: e.first_known,
      knowledge_id: e.knowledge_id,
    }));
    return jsonResponse({ entries, count: entries.length });
  }

  if (action === 'deep_search') {
    const q = params.q?.trim();
    if (!q) return errorResponse('Query q is required', 400);
    const results = searchDeep(q, Number(params.limit) || 20);
    return jsonResponse({ results, query: q });
  }

  if (action === 'deep') {
    const id = params.id;
    if (!id) return errorResponse('id required', 400);
    const entry = getDeepEntry(id);
    if (!entry) return errorResponse(`Deep entry not found: ${id}`, 404);
    return jsonResponse({ entry });
  }

  if (action === 'reasons') {
    return jsonResponse({ reasons: SUBSTITUTION_REASONS });
  }

  if (action === 'match_pantry') {
    const needed = params.limit ? Number(params.limit) : 30;
    let inventory: InventoryItem[] = [];
    let profile: Profile = {
      user_id: user.id,
      dietary_restrictions: [],
      cuisine_preferences: [],
      allergies: [],
      household_size: 2,
      preferred_store: '',
      gamification_level: 1,
      gamification_xp: 0,
      onboarding_complete: true,
      assistant_name: 'Clara',
      last_meal_memory: {},
    };
    if (useDevStore()) {
      const store = loadStore();
      inventory = store.inventory_items.filter((i) => i.user_id === user.id);
      const prof = store.profiles.find((p) => p.user_id === user.id);
      if (prof) profile = prof as Profile;
    } else if (user.token) {
      const db = getSupabaseUserClient(user.token);
      const { data: items } = await db.from('inventory_items').select('*').eq('user_id', user.id);
      inventory = (items ?? []) as InventoryItem[];
      const { data: prof } = await db.from('profiles').select('*').eq('user_id', user.id).maybeSingle();
      if (prof) profile = prof as Profile;
    }
    const dishes = matchDishesForPantry(inventory, profile, {
      limit: Math.min(Math.max(needed, 1), 100),
      meal_type: params.meal_type,
    });
    return jsonResponse({ dishes, count: dishes.length });
  }

  if (action === 'list') {
    const type = params.type as KnowledgeNodeType | undefined;
    if (type && !VALID_TYPES.has(type)) {
      return errorResponse('Invalid type', 400);
    }
    const nodes = listKnowledgeNodes(type);
    return jsonResponse({ nodes, count: nodes.length });
  }

  if (action === 'search') {
    const q = params.q?.trim();
    if (!q) return errorResponse('Query q is required', 400);
    const type = params.type as KnowledgeNodeType | undefined;
    if (type && !VALID_TYPES.has(type)) return errorResponse('Invalid type', 400);
    const results = searchKnowledge(q, type, Number(params.limit) || 20);
    return jsonResponse({ results, query: q });
  }

  if (action === 'pairings') {
    const id = params.id;
    if (!id) return errorResponse('id required', 400);
    return jsonResponse({ id, pairings: getPairings(id) });
  }

  if (action === 'variants') {
    const id = params.id;
    if (!id) return errorResponse('id required', 400);
    const parent = getKnowledgeNode(id);
    if (!parent) return errorResponse(`Knowledge node not found: ${id}`, 404);
    const variants = getVariantNodes(id);
    return jsonResponse({ parent, variants, count: variants.length });
  }

  if (action === 'cuisine_staples') {
    const id = params.id ?? params.cuisine;
    if (!id) return errorResponse('id or cuisine required', 400);
    const cuisineId = id.startsWith('cuisine.') ? id : `cuisine.${id}`;
    return jsonResponse({ cuisine_id: cuisineId, staples: getCuisineStaples(cuisineId) });
  }

  if (action === 'by_cuisine') {
    const tag = params.tag ?? params.cuisine;
    if (!tag) return errorResponse('tag required', 400);
    const type = params.type as KnowledgeNodeType | undefined;
    return jsonResponse({ tag, nodes: getNodesByCuisineTag(tag, type) });
  }

  if (action === 'substitute' || params.substitute) {
    const id = params.id ?? params.substitute;
    if (!id) return errorResponse('id or substitute param required', 400);
    const source = getKnowledgeNode(id);
    if (!source) return errorResponse('Knowledge node not found', 404);
    const substitutes = getSubstituteNodes(id);
    return jsonResponse({ node: source, substitutes });
  }

  if (action === 'substitutes') {
    const id = params.id;
    if (!id) return errorResponse('id required', 400);
    const reason = parseSubstitutionReason(params.reason) as SubstitutionReason;
    const limit = Number(params.limit) || 10;
    const result = resolveSubstitutions(id, { reason, limit });
    if (!result) return errorResponse(`Knowledge node not found: ${id}`, 404);
    return jsonResponse(result);
  }

  if (action === 'substitute_context') {
    const id = params.id;
    if (!id) return errorResponse('id required', 400);
    const reason = parseSubstitutionReason(params.reason) as SubstitutionReason;
    return jsonResponse({ context: formatSubstitutionContext(id, reason) });
  }

  if (action === 'missing_from_pantry') {
    const needed = params.needed?.split(',').map((s) => s.trim()).filter(Boolean) ?? [];
    const available = params.available?.split(',').map((s) => s.trim()).filter(Boolean) ?? [];
    if (!needed.length) return errorResponse('needed comma-separated ids required', 400);
    const reason = parseSubstitutionReason(params.reason) as SubstitutionReason;
    return jsonResponse({ results: resolveMissingFromPantry(needed, available, reason) });
  }

  if (action === 'search_substitute') {
    const q = params.q?.trim();
    if (!q) return errorResponse('Query q is required', 400);
    const reason = parseSubstitutionReason(params.reason) as SubstitutionReason;
    const bundle = searchAndSubstitute(q, { reason });
    if (!bundle) return errorResponse('No matching ingredient', 404);
    return jsonResponse(bundle);
  }

  const id = params.id;
  if (!id) {
    return errorResponse('id required (or use action=search|list|stats|substitutes)', 400);
  }

  const node = getKnowledgeNode(id);
  if (!node) {
    return errorResponse(`Knowledge node not found: ${id}`, 404);
  }

  const related = getRelatedByPairing(id);
  const substitutes = getSubstituteNodes(id);
  const reason = parseSubstitutionReason(params.reason ?? 'missing') as SubstitutionReason;
  const substitution = resolveSubstitutions(id, { reason, limit: 5 });

  return jsonResponse({
    node,
    substitutes,
    related,
    substitution,
  });
});
