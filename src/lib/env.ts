/** Frontend build defaults — safe fallbacks when VITE_* unset (Netlify sets these in netlify.toml). */

export const appEnv = {
  apiBase: import.meta.env.VITE_API_BASE || '/.netlify/functions',
  appName: import.meta.env.VITE_APP_NAME || 'HomeChef AI',
  siteUrl: import.meta.env.VITE_SITE_URL || 'https://home-chef-ai.netlify.app',
  enableBilling: import.meta.env.VITE_ENABLE_BILLING === 'true',
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
} as const;

export function hasSupabaseConfig(): boolean {
  return Boolean(appEnv.supabaseUrl && appEnv.supabaseAnonKey);
}
