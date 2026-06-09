import type { Handler } from '@netlify/functions';
import { withCors, jsonResponse, errorResponse, requireAuth } from './utils/response.js';
import { useDevStore, loadStore, saveStore } from './utils/db.js';
import { getSupabaseUserClient } from './utils/supabase.js';
import { isFounderUser, syncFounderFlag } from './utils/founder.js';

export const handler: Handler = withCors(async (event) => {
  const user = await requireAuth(event);
  if (!user) return errorResponse('Unauthorized', 401);

  if (event.httpMethod === 'POST') {
    if (useDevStore()) {
      const store = loadStore();
      let profile = store.profiles.find((p) => p.user_id === user.id);
      if (!profile) {
        profile = {
          user_id: user.id,
          dietary_restrictions: [],
          cuisine_preferences: [],
          allergies: [],
          household_size: 2,
          preferred_store: 'Walmart',
          gamification_level: 1,
          gamification_xp: 0,
          onboarding_complete: false,
          assistant_name: 'Sous Chef',
          last_meal_memory: {},
          is_founder: isFounderUser(user, true),
        };
        store.profiles.push(profile);
        saveStore(store);
      } else if (profile.is_founder !== isFounderUser(user, true)) {
        profile.is_founder = isFounderUser(user, true);
        saveStore(store);
      }
      return jsonResponse({ user: { id: user.id, email: user.email }, profile });
    }

    if (!user.token) return errorResponse('Missing token', 401);
    const db = getSupabaseUserClient(user.token);
    await syncFounderFlag(db, user.id, user.email);
    const { data: profile, error } = await db.from('profiles').select('*').eq('user_id', user.id).maybeSingle();
    if (error) return errorResponse(error.message, 500);
    if (!profile) {
      const founder = isFounderUser(user, false);
      const { data: created, error: insertErr } = await db.from('profiles').insert({
        user_id: user.id,
        email: user.email,
        is_founder: founder,
      }).select().single();
      if (insertErr) return errorResponse(insertErr.message, 500);
      return jsonResponse({ user: { id: user.id, email: user.email, name: created?.name }, profile: created });
    }
    return jsonResponse({ user: { id: user.id, email: user.email, name: profile?.name }, profile });
  }

  return errorResponse('Method not allowed', 405);
});
