/**
 * Shared auth + pantry load for assistant handlers.
 */

import type { HandlerEvent } from '@netlify/functions';
import { requireAuth, errorResponse } from './response.js';
import { useDevStore, loadStore } from './db.js';
import { getSupabaseUserClient } from './supabase.js';
import type { InventoryItem, Profile } from '../../src/types/index.js';

export interface AssistantSession {
  userId: string;
  token?: string;
  inventory: InventoryItem[];
  profile: Profile;
}

export async function loadAssistantSession(
  event: HandlerEvent,
): Promise<{ session: AssistantSession } | { error: ReturnType<typeof errorResponse> }> {
  const user = await requireAuth(event);
  if (!user) return { error: errorResponse('Unauthorized', 401) };

  if (useDevStore()) {
    const store = loadStore();
    const profile = store.profiles.find((p) => p.user_id === user.id);
    if (!profile) return { error: errorResponse('Profile not found', 404) };
    return {
      session: {
        userId: user.id,
        token: user.token,
        inventory: store.inventory_items.filter((i) => i.user_id === user.id),
        profile: profile as Profile,
      },
    };
  }

  if (!user.token) return { error: errorResponse('Missing token', 401) };

  const db = getSupabaseUserClient(user.token);
  const { data: items } = await db.from('inventory_items').select('*').eq('user_id', user.id);
  const { data: prof, error } = await db.from('profiles').select('*').eq('user_id', user.id).maybeSingle();
  if (error || !prof) return { error: errorResponse('Profile not found', 404) };

  return {
    session: {
      userId: user.id,
      token: user.token,
      inventory: (items ?? []) as InventoryItem[],
      profile: prof as Profile,
    },
  };
}
