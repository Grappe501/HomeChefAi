import type { Handler } from '@netlify/functions';
import { withCors, jsonResponse, errorResponse, requireAuth } from './utils/response.js';
import { useDevStore, loadStore, saveStore } from './utils/db.js';
import { getSupabaseUserClient } from './utils/supabase.js';
import type { StoredMemory } from './utils/brain/types.js';
import type { DevStore } from './utils/types.js';

export const handler: Handler = withCors(async (event) => {
  const user = await requireAuth(event);
  if (!user) return errorResponse('Unauthorized', 401);
  const userId = user.id;

  if (event.httpMethod === 'GET') {
    const memoryId = event.queryStringParameters?.id;
    const type = event.queryStringParameters?.type;
    const action = event.queryStringParameters?.action || 'insights';

    if (action === 'ledger' || action === 'ledger-recent') {
      const domain = event.queryStringParameters?.domain;
      const limit = Number(event.queryStringParameters?.limit) || 20;
      const { getRecentLedger } = await import('./utils/ai/ledgerStore.js');
      const entries = await getRecentLedger(userId, user.token, domain, limit);
      return jsonResponse({ ledger: entries, count: entries.length });
    }

    if (useDevStore()) {
      const store = loadStore() as DevStore & { household_memories?: StoredMemory[] };
      const memories = (store.household_memories ?? []).filter((m) => m.user_id === userId);
      if (memoryId) {
        const mem = memories.find((m) => m.id === memoryId);
        if (!mem) return errorResponse('Memory not found', 404);
        return jsonResponse({ memory: mem });
      }
      if (action === 'all') {
        const filtered = type ? memories.filter((m) => m.memory_type === type) : memories;
        return jsonResponse({ memories: filtered.sort(byUpdated) });
      }
      const insights = memories.filter((m) => m.surfaced).sort(byConfidence);
      return jsonResponse({ insights, learning: memories.filter((m) => !m.surfaced).length });
    }

    if (!user.token) return errorResponse('Missing token', 401);
    const db = getSupabaseUserClient(user.token);

    if (memoryId) {
      const { data: mem, error } = await db.from('household_memories').select('*').eq('id', memoryId).eq('user_id', userId).single();
      if (error || !mem) return errorResponse('Memory not found', 404);
      return jsonResponse({ memory: mem });
    }

    let q = db.from('household_memories').select('*').eq('user_id', userId);
    if (type) q = q.eq('memory_type', type);

    if (action === 'all') {
      const { data, error } = await q.order('updated_at', { ascending: false });
      if (error) return errorResponse(error.message, 500);
      return jsonResponse({ memories: data ?? [] });
    }

    const { data: insights, error } = await db
      .from('household_memories')
      .select('*')
      .eq('user_id', userId)
      .eq('surfaced', true)
      .order('confidence', { ascending: false });
    if (error) return errorResponse(error.message, 500);

    const { count } = await db
      .from('household_memories')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('surfaced', false);

    return jsonResponse({ insights: insights ?? [], learning: count ?? 0 });
  }

  if (event.httpMethod === 'POST') {
    const { runBrainSyncDevStore, runBrainSyncSupabase, getBrainScopeDevStore, getBrainScopeSupabase } = await import('./utils/brain/runBrainSync.js');

    if (useDevStore()) {
      const store = loadStore() as DevStore & { household_memories?: StoredMemory[] };
      const scope = getBrainScopeDevStore(store, userId);
      const count = runBrainSyncDevStore(store, scope);
      saveStore(store as never);
      return jsonResponse({ synced: true, insights_count: count });
    }

    if (!user.token) return errorResponse('Missing token', 401);
    const db = getSupabaseUserClient(user.token);
    const scope = await getBrainScopeSupabase(db, userId);
    const count = await runBrainSyncSupabase(db, scope);
    return jsonResponse({ synced: true, insights_count: count });
  }

  return errorResponse('Method not allowed', 405);
});

function byConfidence(a: StoredMemory, b: StoredMemory) {
  return b.confidence - a.confidence;
}

function byUpdated(a: StoredMemory, b: StoredMemory) {
  return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
}
