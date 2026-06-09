import type { Handler } from '@netlify/functions';
import { withCors, jsonResponse, errorResponse, parseBody, requireAuth } from './utils/response.js';
import { getSupabaseUserClient, useDevStore } from './utils/supabase.js';
import { loadStore, saveStore } from './utils/devStore.js';

export const handler: Handler = withCors(async (event) => {
  const user = await requireAuth(event);
  if (!user) return errorResponse('Unauthorized', 401);

  if (event.httpMethod === 'GET') {
    if (useDevStore()) {
      const store = loadStore();
      const profile = store.profiles.find((p) => p.user_id === user.id);
      return jsonResponse({ user: { id: user.id, email: user.email }, profile });
    }
    if (!user.token) return errorResponse('Missing token', 401);
    const db = getSupabaseUserClient(user.token);
    const { data: profile } = await db.from('profiles').select('*').eq('user_id', user.id).single();
    return jsonResponse({ user: { id: user.id, email: user.email, name: profile?.name }, profile });
  }

  if (event.httpMethod === 'PUT') {
    const body = parseBody<Record<string, unknown>>(event);
    if (!body) return errorResponse('Invalid body');

    const allowed = [
      'dietary_restrictions', 'cuisine_preferences', 'allergies', 'household_size',
      'preferred_store', 'onboarding_complete', 'assistant_name', 'last_meal_memory',
      'gamification_level', 'gamification_xp', 'name', 'zip_code',
      'household_id', 'household_display_name', 'kitchen_identity', 'culinary_profile', 'assistant_persona',
      'food_priorities',
    ];
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const key of allowed) {
      if (body[key] !== undefined) updates[key] = body[key];
    }

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
    const { data: profile, error } = await db.from('profiles').update(updates).eq('user_id', user.id).select().single();
    if (error) return errorResponse(error.message, 500);
    return jsonResponse({ profile });
  }

  return errorResponse('Method not allowed', 405);
});
