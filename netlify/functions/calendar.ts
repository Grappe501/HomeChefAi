import { v4 as uuidv4 } from 'uuid';
import type { Handler } from '@netlify/functions';
import { withCors, jsonResponse, errorResponse, parseBody, requireAuth } from './utils/response.js';
import { useDevStore, loadStore, saveStore } from './utils/db.js';
import { getSupabaseUserClient } from './utils/supabase.js';

export const handler: Handler = withCors(async (event) => {
  const user = await requireAuth(event);
  if (!user) return errorResponse('Unauthorized', 401);

  if (event.httpMethod === 'GET') {
    const from = event.queryStringParameters?.from || new Date().toISOString().split('T')[0];
    const days = Number(event.queryStringParameters?.days || 14);

    if (useDevStore()) {
      const store = loadStore();
      const events = (store as { calendar_events?: Record<string, unknown>[] }).calendar_events?.filter(
        (e) => e.user_id === user.id
      ) ?? [];
      return jsonResponse({ events });
    }

    if (!user.token) return errorResponse('Missing token', 401);
    const db = getSupabaseUserClient(user.token);
    const end = new Date(from);
    end.setDate(end.getDate() + days);
    const { data: events } = await db.from('calendar_events')
      .select('*')
      .eq('user_id', user.id)
      .gte('event_date', from)
      .lte('event_date', end.toISOString().split('T')[0])
      .order('event_date');

    const { data: expiring } = await db.from('inventory_items')
      .select('id, name, expiration_date')
      .eq('user_id', user.id)
      .not('expiration_date', 'is', null)
      .gte('expiration_date', from)
      .lte('expiration_date', end.toISOString().split('T')[0]);

    const { data: plans } = await db.from('meal_plans')
      .select('plan_data, start_date, title')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1);

    const mealEvents = flattenMealPlan(plans?.[0]);
    const expireEvents = (expiring ?? []).map((i) => ({
      id: `exp-${i.id}`,
      event_date: i.expiration_date,
      event_type: 'expire',
      title: `Use ${i.name}`,
      description: 'Expiration date',
      completed: false,
    }));

    return jsonResponse({ events: [...(events ?? []), ...mealEvents, ...expireEvents] });
  }

  if (event.httpMethod === 'POST') {
    const body = parseBody<{ action?: string; id?: string; event?: Record<string, unknown> }>(event);
    if (!body) return errorResponse('Invalid body');

    if (body.action === 'complete' && body.id) {
      if (!user.token) return errorResponse('Missing token', 401);
      const db = getSupabaseUserClient(user.token);
      await db.from('calendar_events').update({ completed: true }).eq('id', body.id).eq('user_id', user.id);
      return jsonResponse({ success: true });
    }

    if (body.action === 'sync-meals') {
      if (!user.token) return errorResponse('Missing token', 401);
      const db = getSupabaseUserClient(user.token);
      const { data: plan } = await db.from('meal_plans').select('*').eq('user_id', user.id).eq('status', 'active').order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (!plan) return jsonResponse({ synced: 0 });
      const events = flattenMealPlan(plan).map((e) => ({
        id: uuidv4(),
        user_id: user.id,
        ...e,
      }));
      for (const ev of events) {
        await db.from('calendar_events').upsert({
          user_id: user.id,
          event_date: ev.event_date,
          event_type: ev.event_type,
          title: ev.title,
          description: ev.description,
          metadata: { meal_type: ev.event_type },
        }, { onConflict: 'user_id,event_date,title', ignoreDuplicates: true });
      }
      return jsonResponse({ synced: events.length });
    }

    return errorResponse('Unknown action', 400);
  }

  return errorResponse('Method not allowed', 405);
});

function flattenMealPlan(plan: { plan_data?: { meals?: { day: number; meal_type: string; name: string; description?: string }[] }; start_date?: string } | null | undefined) {
  if (!plan?.plan_data?.meals || !plan.start_date) return [];
  const start = new Date(plan.start_date);
  return plan.plan_data.meals.map((m) => {
    const d = new Date(start);
    d.setDate(d.getDate() + (m.day - 1));
    return {
      event_date: d.toISOString().split('T')[0],
      event_type: 'meal',
      title: `${m.meal_type}: ${m.name}`,
      description: m.description,
      completed: false,
    };
  });
}
