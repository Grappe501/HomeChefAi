import type { Handler } from '@netlify/functions';
import { withCors, jsonResponse, errorResponse, parseBody, requireAuth } from './utils/response.js';
import { getSupabaseUserClient, useDevStore } from './utils/supabase.js';
import { loadStore, saveStore } from './utils/devStore.js';

function generateCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

interface DevHousehold {
  id: string;
  name: string;
  display_name?: string;
  invite_code: string;
  created_by: string;
  members: { user_id: string; role: string; display_name?: string }[];
}

export const handler: Handler = withCors(async (event) => {
  const user = await requireAuth(event);
  if (!user) return errorResponse('Unauthorized', 401);

  if (event.httpMethod === 'GET') {
    if (useDevStore()) {
      const store = loadStore() as { households?: DevHousehold[]; profiles?: { user_id: string; household_id?: string }[] };
      const profile = store.profiles?.find((p) => p.user_id === user.id);
      if (!profile?.household_id) return jsonResponse({ household: null, members: [] });
      const household = store.households?.find((h) => h.id === profile.household_id);
      return jsonResponse({ household, members: household?.members ?? [] });
    }
    if (!user.token) return errorResponse('Missing token', 401);
    const db = getSupabaseUserClient(user.token);
    const { data: profile } = await db.from('profiles').select('household_id').eq('user_id', user.id).single();
    if (!profile?.household_id) return jsonResponse({ household: null, members: [] });
    const { data: household } = await db.from('households').select('*').eq('id', profile.household_id).single();
    const { data: members } = await db
      .from('household_members')
      .select('user_id, role, display_name, joined_at')
      .eq('household_id', profile.household_id);
    return jsonResponse({ household, members: members ?? [] });
  }

  if (event.httpMethod === 'POST') {
    const body = parseBody<{ action?: string; name?: string; display_name?: string; invite_code?: string }>(event);
    if (!body?.action) return errorResponse('action required');

    if (body.action === 'create') {
      const name = body.display_name || body.name || 'Our Kitchen';
      const inviteCode = generateCode();
      const id = crypto.randomUUID();

      if (useDevStore()) {
        const store = loadStore() as { households?: DevHousehold[]; profiles?: Record<string, unknown>[] };
        if (!store.households) store.households = [];
        const household: DevHousehold = {
          id,
          name,
          display_name: body.display_name || name,
          invite_code: inviteCode,
          created_by: user.id,
          members: [{ user_id: user.id, role: 'owner', display_name: body.display_name }],
        };
        store.households.push(household);
        const pIdx = store.profiles?.findIndex((p) => (p as { user_id: string }).user_id === user.id) ?? -1;
        if (pIdx >= 0 && store.profiles) {
          store.profiles[pIdx] = { ...store.profiles[pIdx], household_id: id, household_display_name: body.display_name || name };
        }
        saveStore(store as never);
        return jsonResponse({ household, invite_code: inviteCode }, 201);
      }

      if (!user.token) return errorResponse('Missing token', 401);
      const db = getSupabaseUserClient(user.token);
      const { data: household, error } = await db
        .from('households')
        .insert({ id, name, display_name: body.display_name || name, invite_code: inviteCode, created_by: user.id })
        .select()
        .single();
      if (error) return errorResponse(error.message, 500);
      await db.from('household_members').insert({ household_id: id, user_id: user.id, role: 'owner' });
      await db.from('profiles').update({ household_id: id, household_display_name: body.display_name || name }).eq('user_id', user.id);
      return jsonResponse({ household, invite_code: inviteCode }, 201);
    }

    if (body.action === 'join') {
      const code = (body.invite_code || '').toUpperCase().trim();
      if (!code) return errorResponse('invite_code required');

      if (useDevStore()) {
        const store = loadStore() as { households?: DevHousehold[]; profiles?: Record<string, unknown>[] };
        const household = store.households?.find((h) => h.invite_code === code);
        if (!household) return errorResponse('Invalid invite code', 404);
        if (!household.members.some((m) => m.user_id === user.id)) {
          household.members.push({ user_id: user.id, role: 'member' });
        }
        const pIdx = store.profiles?.findIndex((p) => (p as { user_id: string }).user_id === user.id) ?? -1;
        if (pIdx >= 0 && store.profiles) {
          store.profiles[pIdx] = { ...store.profiles[pIdx], household_id: household.id, household_display_name: household.display_name };
        }
        saveStore(store as never);
        return jsonResponse({ household, members: household.members });
      }

      if (!user.token) return errorResponse('Missing token', 401);
      const db = getSupabaseUserClient(user.token);
      const { data: household } = await db.from('households').select('*').eq('invite_code', code).single();
      if (!household) return errorResponse('Invalid invite code', 404);
      await db.from('household_members').upsert({ household_id: household.id, user_id: user.id, role: 'member' });
      await db.from('profiles').update({ household_id: household.id, household_display_name: household.display_name }).eq('user_id', user.id);
      const { data: members } = await db.from('household_members').select('*').eq('household_id', household.id);
      return jsonResponse({ household, members: members ?? [] });
    }

    if (body.action === 'invite') {
      if (useDevStore()) {
        const store = loadStore() as { households?: DevHousehold[]; profiles?: { user_id: string; household_id?: string }[] };
        const profile = store.profiles?.find((p) => p.user_id === user.id);
        const household = store.households?.find((h) => h.id === profile?.household_id);
        if (!household) return errorResponse('No household', 404);
        return jsonResponse({ invite_code: household.invite_code });
      }
      if (!user.token) return errorResponse('Missing token', 401);
      const db = getSupabaseUserClient(user.token);
      const { data: profile } = await db.from('profiles').select('household_id').eq('user_id', user.id).single();
      if (!profile?.household_id) return errorResponse('No household', 404);
      const { data: household } = await db.from('households').select('invite_code').eq('id', profile.household_id).single();
      return jsonResponse({ invite_code: household?.invite_code });
    }

    return errorResponse('Unknown action', 400);
  }

  return errorResponse('Method not allowed', 405);
});
