import { v4 as uuidv4 } from 'uuid';
import type { Handler } from '@netlify/functions';
import { withCors, jsonResponse, errorResponse, parseBody, requireAuth } from './utils/response.js';
import { useDevStore, loadStore, saveStore } from './utils/db.js';
import { getSupabaseUserClient } from './utils/supabase.js';
import { awardXpDevStore, awardXpSupabase, XP_AWARDS } from './utils/gamification.js';
import { runBrainSyncDevStore, runBrainSyncSupabase, getBrainScopeDevStore, getBrainScopeSupabase } from './utils/brain/runBrainSync.js';
import { inferTechniquesFromText } from './utils/ai/skills.js';
import { recordSkillPractice } from './utils/ai/skillJourneyStore.js';
import { buildBehaviorProfileForUser } from './utils/learning/behaviorStore.js';

async function incrementRecipeServeCount(
  db: import('@supabase/supabase-js').SupabaseClient,
  userId: string,
  mealName?: string,
): Promise<void> {
  if (!mealName?.trim()) return;
  const { data } = await db
    .from('recipes')
    .select('id, serve_count, title')
    .eq('user_id', userId)
    .ilike('title', mealName.trim())
    .limit(1);
  const match = data?.[0];
  if (!match) return;
  await db
    .from('recipes')
    .update({
      serve_count: (match.serve_count ?? 0) + 1,
      last_served_at: new Date().toISOString(),
    })
    .eq('id', match.id);
}

function incrementRecipeServeCountDevStore(
  store: { recipes?: { id: string; user_id: string; title?: string; serve_count?: number }[] },
  userId: string,
  mealName?: string,
): void {
  if (!mealName?.trim() || !store.recipes) return;
  const lower = mealName.toLowerCase().trim();
  const idx = store.recipes.findIndex(
    (r) => r.user_id === userId && r.title?.toLowerCase().trim() === lower,
  );
  if (idx < 0) return;
  store.recipes[idx].serve_count = (store.recipes[idx].serve_count ?? 0) + 1;
  (store.recipes[idx] as { last_served_at?: string }).last_served_at = new Date().toISOString();
}

export const handler: Handler = withCors(async (event) => {
  const user = await requireAuth(event);
  if (!user) return errorResponse('Unauthorized', 401);
  const userId = user.id;

  if (event.httpMethod === 'POST') {
    const body = parseBody<{
      description?: string;
      meal_name?: string;
      items_used: { item_id?: string; name: string; quantity: number; unit: string }[];
      share_recipe?: boolean;
      recipe_public?: boolean;
      technique_ids?: string[];
    }>(event);
    if (!body?.items_used) return errorResponse('Missing items_used');

    const inferredTechniques =
      body.technique_ids?.length
        ? body.technique_ids
        : inferTechniquesFromText(
            body.meal_name ?? body.description ?? '',
            body.items_used.map((i) => i.name),
          );

    const logId = uuidv4();
    const log = {
      id: logId,
      user_id: userId,
      description: body.description,
      meal_name: body.meal_name,
      items_used: body.items_used,
      technique_ids: inferredTechniques,
      skill_metadata: { source: 'cook_log' },
      created_at: new Date().toISOString(),
    };

    if (useDevStore()) {
      const store = loadStore();
      store.usage_logs.push(log);
      for (const used of body.items_used) {
        const idx = store.inventory_items.findIndex(
          (i) => i.user_id === userId && (used.item_id ? i.id === used.item_id : i.name.toLowerCase() === used.name.toLowerCase())
        );
        if (idx >= 0) {
          store.inventory_items[idx].quantity = Math.max(0, Number(store.inventory_items[idx].quantity) - used.quantity);
        }
      }
      const pIdx = store.profiles.findIndex((p) => p.user_id === userId);
      if (pIdx >= 0) {
        awardXpDevStore(store, userId, XP_AWARDS.cook_log, {
          last_meal_memory: {
            meal: body.meal_name,
            date: new Date().toISOString(),
            items: body.items_used.map((i) => i.name),
          },
        });
      }
      const scope = getBrainScopeDevStore(store, userId);
      runBrainSyncDevStore(store, scope);
      await recordSkillPractice(userId, undefined, inferredTechniques);
      incrementRecipeServeCountDevStore(store, userId, body.meal_name);
      saveStore(store);
      await buildBehaviorProfileForUser(userId, undefined);
      return jsonResponse({ log, inventory_updated: true, xp_gained: XP_AWARDS.cook_log }, 201);
    }

    if (!user.token) return errorResponse('Missing token', 401);
    const db = getSupabaseUserClient(user.token);

    await db.from('usage_logs').insert({
      id: logId,
      user_id: userId,
      description: body.description,
      meal_name: body.meal_name,
      items_used: body.items_used,
      technique_ids: inferredTechniques,
      skill_metadata: { source: 'cook_log' },
    });

    for (const used of body.items_used) {
      if (used.item_id) {
        const { data: item } = await db.from('inventory_items').select('quantity').eq('id', used.item_id).single();
        if (item) {
          await db.from('inventory_items').update({
            quantity: Math.max(0, Number(item.quantity) - used.quantity),
            updated_at: new Date().toISOString(),
          }).eq('id', used.item_id);
        }
      } else {
        const { data: items } = await db.from('inventory_items').select('id, quantity, name').eq('user_id', userId).ilike('name', used.name);
        if (items?.[0]) {
          await db.from('inventory_items').update({
            quantity: Math.max(0, Number(items[0].quantity) - used.quantity),
            updated_at: new Date().toISOString(),
          }).eq('id', items[0].id);
        }
      }
    }

    const xp = await awardXpSupabase(db, userId, XP_AWARDS.cook_log, {
      last_meal_memory: {
        meal: body.meal_name,
        date: new Date().toISOString(),
        items: body.items_used.map((i) => i.name),
      },
    });

    const scope = await getBrainScopeSupabase(db, userId);
    await runBrainSyncSupabase(db, scope);
    await recordSkillPractice(userId, user.token, inferredTechniques);
    await incrementRecipeServeCount(db, userId, body.meal_name);
    await buildBehaviorProfileForUser(userId, user.token);

    let recipe = null;
    if (body.share_recipe && body.meal_name) {
      const { data } = await db.from('recipes').insert({
        user_id: userId,
        title: body.meal_name,
        description: body.description,
        ingredients: body.items_used,
        is_public: body.recipe_public ?? true,
      }).select().single();
      recipe = data;
    }

    return jsonResponse({ log, inventory_updated: true, recipe, xp_gained: xp.gained }, 201);
  }

  if (event.httpMethod === 'GET') {
    if (useDevStore()) {
      const store = loadStore();
      return jsonResponse({ logs: store.usage_logs.filter((l) => l.user_id === userId) });
    }
    if (!user.token) return errorResponse('Missing token', 401);
    const db = getSupabaseUserClient(user.token);
    const { data } = await db.from('usage_logs').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(50);
    return jsonResponse({ logs: data ?? [] });
  }

  return errorResponse('Method not allowed', 405);
});
