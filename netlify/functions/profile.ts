import type { Handler } from '@netlify/functions';
import { withCors, jsonResponse, errorResponse, parseBody, requireAuth } from './utils/response.js';
import { getSupabaseUserClient, useDevStore } from './utils/supabase.js';
import { loadStore, saveStore } from './utils/devStore.js';

const JSONB_FIELDS = new Set([
  'dietary_restrictions',
  'cuisine_preferences',
  'allergies',
  'last_meal_memory',
  'kitchen_identity',
  'culinary_profile',
  'assistant_persona',
  'food_priorities',
  'favorite_meals',
  'taste_profile',
  'behavior_profile',
  'skill_profile',
  'identity_profile',
]);

function sanitizeUpdates(body: Record<string, unknown>): Record<string, unknown> {
  const allowed = [
    'dietary_restrictions', 'cuisine_preferences', 'allergies', 'household_size',
    'preferred_store', 'onboarding_complete', 'assistant_name', 'last_meal_memory',
    'gamification_level', 'gamification_xp', 'name', 'zip_code',
    'household_id', 'household_display_name', 'kitchen_identity', 'culinary_profile', 'assistant_persona',
    'food_priorities', 'taste_profile', 'behavior_profile', 'skill_profile', 'identity_profile',
  ];
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of allowed) {
    if (body[key] === undefined) continue;
    let val = body[key];
    if (JSONB_FIELDS.has(key) && val === null) {
      if (key === 'last_meal_memory') val = {};
      else if (key === 'taste_profile' || key === 'behavior_profile' || key === 'skill_profile' || key === 'identity_profile' || key === 'kitchen_identity' || key === 'culinary_profile') val = null;
      else val = [];
    }
    updates[key] = val;
  }
  return updates;
}

export const handler: Handler = withCors(async (event) => {
  const user = await requireAuth(event);
  if (!user) return errorResponse('Unauthorized', 401);

  if (event.httpMethod === 'GET') {
    if (useDevStore()) {
      const store = loadStore();
      const profile = store.profiles.find((p) => p.user_id === user.id);
      return jsonResponse({ user: { id: user.id, email: user.email }, profile: profile ?? null });
    }
    if (!user.token) return errorResponse('Missing token', 401);
    const db = getSupabaseUserClient(user.token);
    const { data: profile, error } = await db.from('profiles').select('*').eq('user_id', user.id).maybeSingle();
    if (error) return errorResponse(error.message, 500);
    return jsonResponse({ user: { id: user.id, email: user.email, name: profile?.name }, profile });
  }

  if (event.httpMethod === 'PUT') {
    const body = parseBody<Record<string, unknown>>(event);
    if (!body) return errorResponse('Invalid body');

    const updates = sanitizeUpdates(body);

    if (useDevStore()) {
      const store = loadStore();
      const idx = store.profiles.findIndex((p) => p.user_id === user.id);
      if (idx === -1) return errorResponse('Profile not found', 404);
      store.profiles[idx] = { ...store.profiles[idx], ...updates, user_id: user.id };
      saveStore(store);
      return jsonResponse({ profile: store.profiles[idx] });
    }

    if (!user.token) return errorResponse('Missing token', 401);
    const db = getSupabaseUserClient(user.token);

    const { data: existing } = await db.from('profiles').select('user_id').eq('user_id', user.id).maybeSingle();

    if (!existing) {
      const { data: profile, error } = await db
        .from('profiles')
        .insert({ user_id: user.id, email: user.email, ...updates })
        .select()
        .single();
      if (error) return errorResponse(error.message, 500);
      return jsonResponse({ profile });
    }

    const { data: profile, error } = await db
      .from('profiles')
      .update(updates)
      .eq('user_id', user.id)
      .select()
      .maybeSingle();

    if (error) return errorResponse(error.message, 500);
    if (!profile) return errorResponse('Profile update failed — no rows returned', 500);
    return jsonResponse({ profile });
  }

  return errorResponse('Method not allowed', 405);
});
