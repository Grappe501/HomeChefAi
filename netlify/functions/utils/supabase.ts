import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { HandlerEvent } from '@netlify/functions';
import ws from 'ws';
import { useDevStore } from './devStore.js';

let adminClient: SupabaseClient | null = null;

function supabaseUrl() {
  return process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
}

function anonKey() {
  return process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
}

function serviceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || '';
}

/** Node 20 on Netlify lacks native WebSocket — required by @supabase/supabase-js */
function clientOptions(token?: string) {
  return {
    global: token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { transport: ws as unknown as typeof WebSocket },
  };
}

export function getBearerToken(event: HandlerEvent): string | null {
  const authHeader = event.headers.authorization || event.headers.Authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
}

export function getSupabaseUserClient(token: string): SupabaseClient {
  const url = supabaseUrl();
  const key = anonKey();
  if (!url || !key) throw new Error('Supabase not configured');
  return createClient(url, key, clientOptions(token));
}

export function getSupabaseAdmin(): SupabaseClient {
  const url = supabaseUrl();
  const key = serviceKey() || anonKey();
  if (!url || !key) throw new Error('Supabase admin credentials not configured');
  if (!adminClient || serviceKey()) {
    adminClient = createClient(url, key, clientOptions());
  }
  return adminClient;
}

export async function verifyAuthUser(event: HandlerEvent): Promise<{ id: string; email?: string; token?: string } | null> {
  if (useDevStore()) {
    const id = event.headers['x-user-id'] || event.headers['X-User-Id'];
    return id ? { id: typeof id === 'string' ? id : String(id) } : null;
  }

  const token = getBearerToken(event);
  if (!token) return null;

  const url = supabaseUrl();
  const key = anonKey();
  if (!url || !key) return null;

  try {
    const client = createClient(url, key, clientOptions());
    const { data: { user }, error } = await client.auth.getUser(token);
    if (error || !user) return null;
    return { id: user.id, email: user.email, token };
  } catch (err) {
    console.error('verifyAuthUser failed:', err);
    return null;
  }
}

export function billingEnabled(): boolean {
  return process.env.ENABLE_BILLING === 'true';
}

export { useDevStore };
