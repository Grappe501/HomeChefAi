import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase env vars missing — auth will not work until VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.');
}

export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);

const REFRESH_BUFFER_SEC = 120;

/** Fresh access token — refreshes when expired (common after mobile backgrounding). */
export async function getAccessToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return null;

  const expiresAt = session.expires_at ?? 0;
  const nowSec = Math.floor(Date.now() / 1000);

  if (expiresAt > nowSec + REFRESH_BUFFER_SEC) {
    return session.access_token;
  }

  const { data: refreshed, error } = await supabase.auth.refreshSession();
  if (error) {
    console.warn('Session refresh failed:', error.message);
    // Still try the existing token if not fully expired
    if (expiresAt > nowSec) return session.access_token;
    return null;
  }

  return refreshed.session?.access_token ?? null;
}

/** Force refresh — used after 401 from API. */
export async function refreshAccessToken(): Promise<string | null> {
  const { data, error } = await supabase.auth.refreshSession();
  if (error) {
    console.warn('Forced session refresh failed:', error.message);
    return null;
  }
  return data.session?.access_token ?? null;
}
