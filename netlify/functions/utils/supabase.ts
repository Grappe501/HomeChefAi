import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { HandlerEvent } from '@netlify/functions';
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

export function getBearerToken(event: HandlerEvent): string | null {
  const authHeader = event.headers.authorization || event.headers.Authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
}

/** User-scoped client (RLS) — preferred for all user data operations */
export function getSupabaseUserClient(token: string): SupabaseClient {
  const url = supabaseUrl();
  const key = anonKey();
  if (!url || !key) throw new Error('Supabase not configured');
  return createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  });
}

/** Admin client — optional; falls back to user client when service role unset */
export function getSupabaseAdmin(): SupabaseClient {
  const url = supabaseUrl();
  const key = serviceKey() || anonKey();
  if (!url || !key) throw new Error('Supabase admin credentials not configured');
  if (!adminClient || serviceKey()) {
    adminClient = createClient(url, key, { auth: { persistSession: false } });
  }
  return adminClient;
}

export async function verifyAuthUser(event: HandlerEvent): Promise<{ id: string; email?: string; token?: string } | null> {
  if (useDevStore()) {
    const id = event.headers['x-user-id'] || event.headers['X-User-Id'];
    return id ? { id } : null;
  }

  const token = getBearerToken(event);
  if (!token) return null;

  const url = supabaseUrl();
  const key = anonKey();
  if (!url || !key) return null;

  const client = createClient(url, key, { auth: { persistSession: false } });
  const { data: { user }, error } = await client.auth.getUser(token);
  if (error || !user) return null;
  return { id: user.id, email: user.email, token };
}

export function billingEnabled(): boolean {
  return process.env.ENABLE_BILLING === 'true';
}

export { useDevStore };
