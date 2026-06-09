import type { Handler } from '@netlify/functions';
import { withCors, jsonResponse, errorResponse, requireAuth } from './utils/response.js';
import { useDevStore, loadStore } from './utils/db.js';
import { getSupabaseUserClient } from './utils/supabase.js';

export const handler: Handler = withCors(async (event) => {
  const user = await requireAuth(event);
  if (!user) return errorResponse('Unauthorized', 401);

  if (event.httpMethod !== 'GET') return errorResponse('Method not allowed', 405);

  let inventory: { name: string; quantity: number; unit: string }[] = [];
  let memory: { meal?: string; date?: string; items?: string[] } = {};
  let logs: { meal_name?: string; created_at?: string }[] = [];

  if (useDevStore()) {
    const store = loadStore();
    inventory = store.inventory_items.filter((i) => i.user_id === user.id).map((i) => ({ name: i.name, quantity: Number(i.quantity), unit: i.unit }));
    const profile = store.profiles.find((p) => p.user_id === user.id);
    memory = (profile?.last_meal_memory as typeof memory) || {};
    logs = store.usage_logs.filter((l) => l.user_id === user.id).slice(0, 20);
  } else if (user.token) {
    const db = getSupabaseUserClient(user.token);
    const { data: items } = await db.from('inventory_items').select('name, quantity, unit').eq('user_id', user.id);
    inventory = (items ?? []).map((i) => ({ name: i.name, quantity: Number(i.quantity), unit: i.unit }));
    const { data: profile } = await db.from('profiles').select('last_meal_memory').eq('user_id', user.id).single();
    memory = (profile?.last_meal_memory as typeof memory) || {};
    const { data: usageLogs } = await db.from('usage_logs').select('meal_name, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20);
    logs = usageLogs ?? [];
  }

  const suggestions = buildSuggestions(inventory, memory, logs);
  return jsonResponse({ suggestions });
});

function buildSuggestions(
  inventory: { name: string; quantity: number; unit: string }[],
  memory: { meal?: string; date?: string },
  logs: { meal_name?: string; created_at?: string }[]
) {
  const names = inventory.map((i) => i.name.toLowerCase());
  const out: { type: string; title: string; message: string; priority: number }[] = [];

  const has = (...keywords: string[]) => keywords.some((k) => names.some((n) => n.includes(k)));

  if (has('chicken', 'poultry') && has('bbq', 'barbecue', 'sauce')) {
    const lastBbq = logs.find((l) => l.meal_name?.toLowerCase().includes('bbq') || l.meal_name?.toLowerCase().includes('barbecue'));
    const daysSince = lastBbq?.created_at
      ? Math.floor((Date.now() - new Date(lastBbq.created_at).getTime()) / 86400000)
      : 999;
    if (daysSince > 14) {
      out.push({
        type: 'memory',
        title: 'BBQ night?',
        message: `You haven't had barbecue in ${daysSince > 60 ? 'a while' : `${daysSince} days`} — you've got chicken and sauce. Let's do that tonight.`,
        priority: 10,
      });
    }
  }

  if (has('egg') && has('bread', 'cheese')) {
    out.push({ type: 'quick', title: 'Grilled cheese or breakfast?', message: 'Eggs and bread on hand — quick meal ready in 10 minutes.', priority: 5 });
  }

  if (memory.meal) {
    out.push({
      type: 'repeat',
      title: `Loved ${memory.meal}?`,
      message: `Last time you cooked ${memory.meal}. Want something similar tonight?`,
      priority: 3,
    });
  }

  if (inventory.length === 0) {
    out.push({ type: 'onboard', title: 'Start your pantry', message: 'Scan your first grocery receipt — takes 30 seconds.', priority: 20 });
  }

  return out.sort((a, b) => b.priority - a.priority).slice(0, 5);
}
