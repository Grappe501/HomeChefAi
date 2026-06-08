import type { Handler } from '@netlify/functions';
import { withCors, jsonResponse, errorResponse, parseBody, getUserId } from './utils/response.js';
import { useDevStore, loadStore, saveStore, queryOne, query } from './utils/db.js';

export const handler: Handler = withCors(async (event) => {
  const userId = getUserId(event);
  if (!userId) return errorResponse('Missing user ID', 401);

  if (event.httpMethod === 'GET') {
    if (useDevStore()) {
      const store = loadStore();
      const profile = store.profiles.find((p) => p.user_id === userId);
      const user = store.users.find((u) => u.id === userId);
      return jsonResponse({ user, profile });
    }
    const user = await queryOne('SELECT * FROM users WHERE id = $1', [userId]);
    const profile = await queryOne('SELECT * FROM profiles WHERE user_id = $1', [userId]);
    return jsonResponse({ user, profile });
  }

  if (event.httpMethod === 'PUT') {
    const body = parseBody<Record<string, unknown>>(event);
    if (!body) return errorResponse('Invalid body');

    if (useDevStore()) {
      const store = loadStore();
      const idx = store.profiles.findIndex((p) => p.user_id === userId);
      if (idx === -1) return errorResponse('Profile not found', 404);
      store.profiles[idx] = { ...store.profiles[idx], ...body, user_id: userId };
      if (body.name) {
        const uIdx = store.users.findIndex((u) => u.id === userId);
        if (uIdx >= 0) store.users[uIdx].name = body.name as string;
      }
      saveStore(store);
      return jsonResponse({ profile: store.profiles[idx] });
    }

    const fields: string[] = [];
    const values: unknown[] = [];
    let i = 1;
    const allowed = [
      'dietary_restrictions', 'cuisine_preferences', 'allergies', 'household_size',
      'preferred_store', 'onboarding_complete', 'assistant_name', 'last_meal_memory',
      'gamification_level', 'gamification_xp',
    ];
    for (const key of allowed) {
      if (body[key] !== undefined) {
        fields.push(`${key} = $${i++}`);
        values.push(typeof body[key] === 'object' ? JSON.stringify(body[key]) : body[key]);
      }
    }
    if (fields.length === 0) return errorResponse('No fields to update');
    fields.push(`updated_at = NOW()`);
    values.push(userId);
    await query(
      `UPDATE profiles SET ${fields.join(', ')} WHERE user_id = $${i}`,
      values
    );
    const profile = await queryOne('SELECT * FROM profiles WHERE user_id = $1', [userId]);
    return jsonResponse({ profile });
  }

  return errorResponse('Method not allowed', 405);
});
