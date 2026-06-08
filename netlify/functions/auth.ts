import { v4 as uuidv4 } from 'uuid';
import type { Handler } from '@netlify/functions';
import { withCors, jsonResponse, errorResponse, parseBody } from './utils/response.js';
import { useDevStore, loadStore, saveStore, queryOne, query } from './utils/db.js';
import type { Profile } from '../../src/types/index';

interface AuthBody {
  email?: string;
  name?: string;
  user_id?: string;
}

export const handler: Handler = withCors(async (event) => {
  if (event.httpMethod === 'POST') {
    const body = parseBody<AuthBody>(event);
    if (!body) return errorResponse('Invalid body');

    if (body.user_id) {
      if (useDevStore()) {
        const store = loadStore();
        const user = store.users.find((u) => u.id === body.user_id);
        if (!user) return errorResponse('User not found', 404);
        const profile = store.profiles.find((p) => p.user_id === body.user_id);
        return jsonResponse({ user, profile });
      }
      const user = await queryOne('SELECT * FROM users WHERE id = $1', [body.user_id]);
      const profile = await queryOne('SELECT * FROM profiles WHERE user_id = $1', [body.user_id]);
      return jsonResponse({ user, profile });
    }

    const userId = uuidv4();
    const email = body.email || `user-${userId.slice(0, 8)}@homechef.local`;
    const name = body.name || 'Chef';

    const defaultProfile: Profile = {
      user_id: userId,
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
    };

    if (useDevStore()) {
      const store = loadStore();
      const existing = store.users.find((u) => u.email === email);
      if (existing) {
        const profile = store.profiles.find((p) => p.user_id === existing.id);
        return jsonResponse({ user: existing, profile });
      }
      const user = { id: userId, email, name, created_at: new Date().toISOString() };
      store.users.push(user);
      store.profiles.push(defaultProfile);
      saveStore(store);
      return jsonResponse({ user, profile: defaultProfile }, 201);
    }

    await query(
      'INSERT INTO users (id, email, name) VALUES ($1, $2, $3)',
      [userId, email, name]
    );
    await query(
      `INSERT INTO profiles (user_id, dietary_restrictions, cuisine_preferences, allergies, household_size, preferred_store, gamification_level, gamification_xp, onboarding_complete, assistant_name, last_meal_memory)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [userId, '[]', '[]', '[]', 2, 'Walmart', 1, 0, false, 'Sous Chef', '{}']
    );
    const user = await queryOne('SELECT * FROM users WHERE id = $1', [userId]);
    const profile = await queryOne('SELECT * FROM profiles WHERE user_id = $1', [userId]);
    return jsonResponse({ user, profile }, 201);
  }

  return errorResponse('Method not allowed', 405);
});
