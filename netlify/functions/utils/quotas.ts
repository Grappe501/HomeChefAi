import { getSupabaseAdmin, useDevStore, billingEnabled } from './supabase.js';
import { loadStore, saveStore } from './devStore.js';

const FREE_LIMITS = { receipt_scans: 5, meal_plans: 3, assistant_messages: 50 } as const;

export type QuotaAction = 'receipt_scans' | 'meal_plans' | 'assistant_messages';

function monthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export async function getSubscription(userId: string) {
  if (useDevStore()) {
    const store = loadStore();
    const sub = (store as { subscriptions?: Record<string, unknown>[] }).subscriptions?.find(
      (s) => s.user_id === userId
    );
    return sub ?? { user_id: userId, tier: 'trial', status: 'trialing', trial_ends_at: new Date(Date.now() + 30 * 86400000).toISOString() };
  }
  const db = getSupabaseAdmin();
  const { data } = await db.from('subscriptions').select('*').eq('user_id', userId).single();
  return data;
}

export function hasProAccess(sub: { tier?: string; status?: string; trial_ends_at?: string } | null): boolean {
  if (!sub) return false;
  if (sub.tier === 'pro' || sub.tier === 'family') {
    return sub.status === 'active' || sub.status === 'trialing';
  }
  if (sub.tier === 'trial' && sub.trial_ends_at) {
    return new Date(sub.trial_ends_at) > new Date();
  }
  return false;
}

export async function getUsage(userId: string) {
  const mk = monthKey();
  if (useDevStore()) {
    const store = loadStore() as { usage_quotas?: { user_id: string; month_key: string; receipt_scans: number; meal_plans: number; assistant_messages: number }[] };
    if (!store.usage_quotas) store.usage_quotas = [];
    let q = store.usage_quotas.find((u) => u.user_id === userId && u.month_key === mk);
    if (!q) {
      q = { user_id: userId, month_key: mk, receipt_scans: 0, meal_plans: 0, assistant_messages: 0 };
      store.usage_quotas.push(q);
      saveStore(store as never);
    }
    return q;
  }
  const db = getSupabaseAdmin();
  const { data } = await db.from('usage_quotas').select('*').eq('user_id', userId).eq('month_key', mk).maybeSingle();
  if (data) return data;
  const { data: created } = await db.from('usage_quotas').insert({ user_id: userId, month_key: mk }).select().single();
  return created;
}

export async function checkAndIncrementQuota(userId: string, action: QuotaAction): Promise<{ allowed: boolean; usage: Record<string, number>; limits: Record<string, number>; upgrade_required?: boolean }> {
  if (!billingEnabled()) {
    return { allowed: true, usage: {}, limits: { receipt_scans: 999999, meal_plans: 999999, assistant_messages: 999999 } };
  }
  const sub = await getSubscription(userId);
  const pro = hasProAccess(sub);

  const limits = pro
    ? { receipt_scans: 999999, meal_plans: 999999, assistant_messages: 999999 }
    : { ...FREE_LIMITS };

  const usage = await getUsage(userId);
  const current = (usage as Record<string, number>)[action] ?? 0;
  const limit = limits[action as keyof typeof limits] as number;

  if (current >= limit) {
    return {
      allowed: false,
      usage: usage as Record<string, number>,
      limits: limits as Record<string, number>,
      upgrade_required: true,
    };
  }

  const mk = monthKey();
  const newVal = current + 1;

  if (useDevStore()) {
    const store = loadStore() as { usage_quotas?: Record<string, unknown>[] };
    const idx = store.usage_quotas!.findIndex((u) => u.user_id === userId && u.month_key === mk);
    if (idx >= 0) (store.usage_quotas![idx] as Record<string, number>)[action] = newVal;
    saveStore(store as never);
  } else {
    const db = getSupabaseAdmin();
    await db.from('usage_quotas').update({ [action]: newVal }).eq('user_id', userId).eq('month_key', mk);
  }

  return {
    allowed: true,
    usage: { ...(usage as Record<string, number>), [action]: newVal },
    limits: limits as Record<string, number>,
  };
}

export function quotaErrorResponse(limits: Record<string, number>, usage: Record<string, number>) {
  return {
    statusCode: 402,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({
      error: 'Usage limit reached. Upgrade to Pro for unlimited access.',
      upgrade_required: true,
      limits,
      usage,
    }),
  };
}
