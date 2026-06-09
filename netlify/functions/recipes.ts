import type { Handler } from '@netlify/functions';
import { withCors, jsonResponse, errorResponse, parseBody, requireAuth } from './utils/response.js';
import { getSupabaseUserClient, useDevStore } from './utils/supabase.js';
import { loadStore, saveStore } from './utils/db.js';

export const handler: Handler = withCors(async (event) => {
  const user = await requireAuth(event);
  if (!user) return errorResponse('Unauthorized', 401);

  if (event.httpMethod === 'GET') {
    const feed = event.queryStringParameters?.feed === 'public';
    if (useDevStore()) {
      const store = loadStore() as { recipes?: Record<string, unknown>[] };
      const recipes = (store.recipes ?? []).filter((r) => feed ? r.is_public : r.user_id === user.id);
      return jsonResponse({ recipes });
    }
    if (!user.token) return errorResponse('Missing token', 401);
    const db = getSupabaseUserClient(user.token);
    let query = db.from('recipes').select('*, profiles(name)').order('created_at', { ascending: false }).limit(50);
    if (feed) query = query.eq('is_public', true);
    else query = query.eq('user_id', user.id);
    const { data } = await query;
    const recipes = (data ?? []).map((r: Record<string, unknown>) => ({
      ...r,
      author_name: (r.profiles as { name?: string })?.name,
    }));
    return jsonResponse({ recipes });
  }

  if (event.httpMethod === 'POST') {
    const body = parseBody<Record<string, unknown>>(event);
    if (!body) return errorResponse('Invalid body');

    if (body.action === 'like' && body.id) {
      if (!user.token) return errorResponse('Missing token', 401);
    const db = getSupabaseUserClient(user.token);
      await db.from('recipe_likes').upsert({ user_id: user.id, recipe_id: body.id as string });
      await db.rpc('increment_recipe_likes', { recipe_id: body.id }).catch(() => {});
      return jsonResponse({ liked: true });
    }

    if (body.action === 'save' && body.id) {
      if (!user.token) return errorResponse('Missing token', 401);
    const db = getSupabaseUserClient(user.token);
      await db.from('recipe_saves').upsert({ user_id: user.id, recipe_id: body.id as string });
      return jsonResponse({ saved: true });
    }

    const recipe = {
      user_id: user.id,
      title: body.title,
      description: body.description,
      ingredients: body.ingredients ?? [],
      instructions: body.instructions,
      prep_time_minutes: body.prep_time_minutes,
      is_public: body.is_public ?? false,
      origin_recipe_id: body.origin_recipe_id ?? null,
      tradition_id: body.tradition_id ?? null,
      serve_count: 0,
      last_served_at: null,
    };

    if (useDevStore()) {
      const store = loadStore() as { recipes?: Record<string, unknown>[] };
      if (!store.recipes) store.recipes = [];
      const id = crypto.randomUUID();
      store.recipes.push({ id, ...recipe, likes_count: 0, created_at: new Date().toISOString() });
      saveStore(store as never);
      return jsonResponse({ recipe: { id, ...recipe } }, 201);
    }

    if (!user.token) return errorResponse('Missing token', 401);
    const db = getSupabaseUserClient(user.token);
    const { data, error } = await db.from('recipes').insert(recipe).select().single();
    if (error) return errorResponse(error.message, 500);
    return jsonResponse({ recipe: data }, 201);
  }

  return errorResponse('Method not allowed', 405);
});
