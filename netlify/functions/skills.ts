import type { Handler } from '@netlify/functions';
import { withCors, jsonResponse, errorResponse, requireAuth } from './utils/response.js';
import { useDevStore, loadStore } from './utils/db.js';
import { getSupabaseUserClient } from './utils/supabase.js';
import {
  buildSkillCoaching,
  listTechniquesWithLessons,
  inferTechniquesFromText,
} from './utils/ai/skills.js';
import type { ConfidenceLevel } from '../../src/types/platform';

export const handler: Handler = withCors(async (event) => {
  const user = await requireAuth(event);
  if (!user) return errorResponse('Unauthorized', 401);

  if (event.httpMethod === 'GET') {
    const params = event.queryStringParameters ?? {};
    const action = params.action ?? 'coach';

    if (action === 'list') {
      return jsonResponse({ techniques: listTechniquesWithLessons() });
    }

    const meal = params.meal ?? params.q ?? '';
    const ingredients = params.ingredients?.split(',').map((s) => s.trim()).filter(Boolean) ?? [];
    if (!meal.trim()) return errorResponse('meal or q required', 400);

    let skillLevel: ConfidenceLevel = 'beginner';
    if (useDevStore()) {
      const profile = loadStore().profiles.find((p) => p.user_id === user.id);
      skillLevel = (profile?.culinary_profile?.confidence as ConfidenceLevel) ?? 'beginner';
    } else if (user.token) {
      const db = getSupabaseUserClient(user.token);
      const { data: profile } = await db.from('profiles').select('culinary_profile').eq('user_id', user.id).single();
      skillLevel = (profile?.culinary_profile as { confidence?: ConfidenceLevel })?.confidence ?? 'beginner';
    }

    const coaching = buildSkillCoaching(meal, ingredients, skillLevel);
    return jsonResponse(coaching);
  }

  if (event.httpMethod === 'POST') {
    const body = JSON.parse(event.body ?? '{}') as {
      meal_name?: string;
      ingredients?: string[];
      action?: string;
    };
    const meal = body.meal_name ?? '';
    if (!meal.trim()) return errorResponse('meal_name required', 400);
    const coaching = buildSkillCoaching(meal, body.ingredients ?? [], 'beginner');
    return jsonResponse({
      ...coaching,
      inferred: inferTechniquesFromText(meal, body.ingredients ?? []),
    });
  }

  return errorResponse('Method not allowed', 405);
});
