import type { Handler } from '@netlify/functions';
import { withCors, jsonResponse, errorResponse, parseBody, requireAuth } from './utils/response.js';
import { useDevStore, loadStore, saveStore } from './utils/db.js';
import { getSupabaseUserClient } from './utils/supabase.js';

export const handler: Handler = withCors(async (event) => {
  const user = await requireAuth(event);
  if (!user) return errorResponse('Unauthorized', 401);

  if (event.httpMethod === 'GET') {
    const zip = event.queryStringParameters?.zip;
    if (useDevStore()) {
      const store = loadStore() as { swap_posts?: Record<string, unknown>[] };
      let posts = store.swap_posts ?? [];
      if (zip) posts = posts.filter((p) => p.zip_code === zip && p.status === 'open');
      return jsonResponse({ posts });
    }
    if (!user.token) return errorResponse('Missing token', 401);
    const db = getSupabaseUserClient(user.token);
    let q = db.from('swap_posts').select('*').eq('status', 'open').order('created_at', { ascending: false }).limit(50);
    if (zip) q = q.eq('zip_code', zip);
    const { data, error } = await q;
    if (error) return errorResponse(error.message, 500);
    return jsonResponse({ posts: data ?? [] });
  }

  if (event.httpMethod === 'POST') {
    const body = parseBody<{
      action?: string;
      post_id?: string;
      message?: string;
      item_name?: string;
      quantity?: number;
      unit?: string;
      post_type?: string;
      zip_code?: string;
    }>(event);
    if (!body) return errorResponse('Invalid body');

    if (body.action === 'respond' && body.post_id) {
      if (!user.token) return errorResponse('Missing token', 401);
      const db = getSupabaseUserClient(user.token);
      const { data, error } = await db.from('swap_responses').insert({
        post_id: body.post_id,
        user_id: user.id,
        message: body.message || "I'm interested!",
      }).select().single();
      if (error) return errorResponse(error.message, 500);
      return jsonResponse({ response: data }, 201);
    }

    if (!body.item_name || !body.zip_code) return errorResponse('item_name and zip_code required');

    if (useDevStore()) {
      const store = loadStore() as { swap_posts?: Record<string, unknown>[] };
      if (!store.swap_posts) store.swap_posts = [];
      const post = {
        id: crypto.randomUUID(),
        user_id: user.id,
        item_name: body.item_name,
        quantity: body.quantity ?? 1,
        unit: body.unit ?? 'each',
        post_type: body.post_type ?? 'offer',
        zip_code: body.zip_code,
        message: body.message,
        status: 'open',
        created_at: new Date().toISOString(),
      };
      store.swap_posts.push(post);
      saveStore(store as never);
      return jsonResponse({ post }, 201);
    }

    if (!user.token) return errorResponse('Missing token', 401);
    const db = getSupabaseUserClient(user.token);
    const { data, error } = await db.from('swap_posts').insert({
      user_id: user.id,
      item_name: body.item_name,
      quantity: body.quantity ?? 1,
      unit: body.unit ?? 'each',
      post_type: body.post_type ?? 'offer',
      zip_code: body.zip_code,
      message: body.message,
    }).select().single();
    if (error) return errorResponse(error.message, 500);
    return jsonResponse({ post: data }, 201);
  }

  return errorResponse('Method not allowed', 405);
});
