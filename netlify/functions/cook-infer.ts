import type { Handler } from '@netlify/functions';
import { withCors, jsonResponse, errorResponse, parseBody, requireAuth } from './utils/response.js';
import { useDevStore, loadStore } from './utils/db.js';
import { getSupabaseUserClient } from './utils/supabase.js';
import type { InventoryItem, Profile } from '../../src/types/index';
import { inferCookLogIngredients } from './utils/ai/cookLogInfer.js';
import { inferCookLogWithAi } from './utils/ai/cookLogAiFallback.js';
import { chargeCredits, quotaErrorResponse } from './utils/quotas.js';

async function loadInventory(userId: string, token?: string): Promise<InventoryItem[]> {
  if (useDevStore()) {
    return loadStore().inventory_items.filter((i) => i.user_id === userId);
  }
  if (!token) return [];
  const db = getSupabaseUserClient(token);
  const { data } = await db.from('inventory_items').select('*').eq('user_id', userId);
  return (data ?? []) as InventoryItem[];
}

async function loadProfile(userId: string, token?: string): Promise<Profile | null> {
  if (useDevStore()) {
    return loadStore().profiles.find((p) => p.user_id === userId) ?? null;
  }
  if (!token) return null;
  const db = getSupabaseUserClient(token);
  const { data } = await db.from('profiles').select('*').eq('user_id', userId).single();
  return data as Profile;
}

export const handler: Handler = withCors(async (event) => {
  const user = await requireAuth(event);
  if (!user) return errorResponse('Unauthorized', 401);

  if (event.httpMethod !== 'POST') return errorResponse('Method not allowed', 405);

  const body = parseBody<{ meal_description: string; force_ai?: boolean }>(event);
  if (!body?.meal_description?.trim()) return errorResponse('Missing meal_description');

  const inventory = await loadInventory(user.id, user.token);
  const graphResult = inferCookLogIngredients(body.meal_description, inventory);

  if (!body.force_ai && graphResult.confidence >= 0.45 && graphResult.suggested_items.length > 0) {
    return jsonResponse({
      ...graphResult,
      credit_cost: 0,
    });
  }

  const profile = await loadProfile(user.id, user.token);
  if (!profile) return errorResponse('Profile not found', 404);

  const credit = await chargeCredits(user.id, 'cook_log_infer');
  if (!credit.allowed) {
    return quotaErrorResponse(
      { ai_credits_used: credit.status.pool },
      { ai_credits_used: credit.status.used },
      credit.status,
    );
  }

  const aiResult = await inferCookLogWithAi(body.meal_description, inventory, profile);
  if (aiResult) {
    return jsonResponse({
      reply: aiResult.reply,
      suggested_items: aiResult.suggested_items,
      confidence: aiResult.confidence,
      source: 'ai' as const,
      credit_cost: credit.cost,
      credits_remaining: credit.status.remaining,
    });
  }

  return jsonResponse({
    reply: graphResult.reply ?? `Logged: ${body.meal_description}. Add ingredients manually if needed.`,
    suggested_items: graphResult.suggested_items,
    confidence: graphResult.confidence,
    source: 'graph' as const,
    credit_cost: credit.cost,
    credits_remaining: credit.status.remaining,
  });
});
