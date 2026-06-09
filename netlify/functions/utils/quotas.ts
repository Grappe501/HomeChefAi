import { getSupabaseAdmin, useDevStore, billingEnabled } from './supabase.js';
import { loadStore, saveStore } from './devStore.js';
import {
  type CreditAction,
  type CreditChargeResult,
  type CreditStatus,
  CREDIT_COSTS,
  creditPoolForTier,
  normalizeTier,
  legacyActionToCredit,
  isBasicAssistantMessage,
} from '../../src/types/credits.js'; = { receipt_scans: 5, meal_plans: 3, assistant_messages: 50 } as const;

export type QuotaAction = 'receipt_scans' | 'meal_plans' | 'assistant_messages';

function monthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export async function getSubscription(userId: string) {
  if (useDevStore()) {
    const store = loadStore();
    const sub = (store as { subscriptions?: Record<string, unknown>[] }).subscriptions?.find(
      (s) => s.user_id === userId,
    );
    return sub ?? {
      user_id: userId,
      tier: 'trial',
      status: 'trialing',
      trial_ends_at: new Date(Date.now() + 30 * 86400000).toISOString(),
    };
  }
  const db = getSupabaseAdmin();
  const { data } = await db.from('subscriptions').select('*').eq('user_id', userId).single();
  return data;
}

export function hasProAccess(sub: { tier?: string; status?: string; trial_ends_at?: string } | null): boolean {
  if (!sub) return false;
  const tier = sub.tier ?? 'free';
  if (tier === 'pro' || tier === 'plus' || tier === 'family') {
    return sub.status === 'active' || sub.status === 'trialing';
  }
  if (tier === 'trial' && sub.trial_ends_at) {
    return new Date(sub.trial_ends_at) > new Date();
  }
  return false;
}

export async function getUsage(userId: string) {
  const mk = monthKey();
  if (useDevStore()) {
    const store = loadStore() as {
      usage_quotas?: {
        user_id: string;
        month_key: string;
        receipt_scans: number;
        meal_plans: number;
        assistant_messages: number;
        ai_credits_used?: number;
      }[];
    };
    if (!store.usage_quotas) store.usage_quotas = [];
    let q = store.usage_quotas.find((u) => u.user_id === userId && u.month_key === mk);
    if (!q) {
      q = {
        user_id: userId,
        month_key: mk,
        receipt_scans: 0,
        meal_plans: 0,
        assistant_messages: 0,
        ai_credits_used: 0,
      };
      store.usage_quotas.push(q);
      saveStore(store as never);
    }
    if (q.ai_credits_used === undefined) q.ai_credits_used = 0;
    return q;
  }
  const db = getSupabaseAdmin();
  const { data } = await db.from('usage_quotas').select('*').eq('user_id', userId).eq('month_key', mk).maybeSingle();
  if (data) return data;
  const { data: created } = await db
    .from('usage_quotas')
    .insert({ user_id: userId, month_key: mk, ai_credits_used: 0 })
    .select()
    .single();
  return created;
}

export async function getCreditStatus(userId: string): Promise<CreditStatus> {
  const sub = await getSubscription(userId);
  const usage = await getUsage(userId);
  const tier = normalizeTier(sub?.tier as string | undefined);
  const pool = creditPoolForTier(sub?.tier as string | undefined);
  const used = Number((usage as { ai_credits_used?: number }).ai_credits_used ?? 0);
  return {
    tier: (sub?.tier as CreditStatus['tier']) ?? 'free',
    pool,
    used,
    remaining: Math.max(0, pool - used),
    month_key: monthKey(),
    billing_enabled: billingEnabled(),
  };
}

export async function chargeCredits(userId: string, action: CreditAction): Promise<CreditChargeResult> {
  const cost = CREDIT_COSTS[action];
  const status = await getCreditStatus(userId);

  if (!billingEnabled()) {
    return { allowed: true, cost: 0, status: { ...status, pool: 999999, remaining: 999999 } };
  }

  if (cost === 0) {
    return { allowed: true, cost: 0, status };
  }

  if (status.used + cost > status.pool) {
    return { allowed: false, cost, status, upgrade_required: true };
  }

  const mk = monthKey();
  const usage = await getUsage(userId);
  const newUsed = Number((usage as { ai_credits_used?: number }).ai_credits_used ?? 0) + cost;

  if (useDevStore()) {
    const store = loadStore() as { usage_quotas?: Record<string, unknown>[] };
    const idx = store.usage_quotas!.findIndex((u) => u.user_id === userId && u.month_key === mk);
    if (idx >= 0) (store.usage_quotas![idx] as { ai_credits_used: number }).ai_credits_used = newUsed;
    saveStore(store as never);
  } else {
    const db = getSupabaseAdmin();
    await db.from('usage_quotas').update({ ai_credits_used: newUsed }).eq('user_id', userId).eq('month_key', mk);
  }

  const updated = await getCreditStatus(userId);
  return { allowed: true, cost, status: updated };
}

/** Legacy per-action quota — increments counter + charges credits when billing on */
export async function checkAndIncrementQuota(
  userId: string,
  action: QuotaAction,
  options?: { message?: string; planDays?: number; skipCredit?: boolean },
): Promise<{
  allowed: boolean;
  usage: Record<string, number>;
  limits: Record<string, number>;
  upgrade_required?: boolean;
  credits?: CreditStatus;
  credit_cost?: number;
}> {
  let creditAction: CreditAction = legacyActionToCredit(action);
  if (action === 'assistant_messages' && options?.message && isBasicAssistantMessage(options.message)) {
    creditAction = 'assistant_basic';
  }
  if (action === 'meal_plans' && options?.planDays) {
    creditAction = options.planDays <= 3 ? 'meal_plan_3day' : options.planDays <= 7 ? 'meal_plan_7day' : 'meal_plan_long';
  }

  if (!options?.skipCredit) {
    const creditResult = await chargeCredits(userId, creditAction);
    const status = creditResult.status;

    if (!creditResult.allowed) {
      return {
        allowed: false,
        usage: { ai_credits_used: status.used, ...((await getUsage(userId)) as Record<string, number>) },
        limits: { ai_credits_used: status.pool } as Record<string, number>,
        upgrade_required: true,
        credits: status,
        credit_cost: creditResult.cost,
      };
    }
  }

  const status = await getCreditStatus(userId);

  if (!billingEnabled()) {
    return {
      allowed: true,
      usage: {},
      limits: { receipt_scans: 999999, meal_plans: 999999, assistant_messages: 999999 },
      credits: status,
      credit_cost: options?.skipCredit ? 0 : CREDIT_COSTS[creditAction],
    };
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
      upgrade_required: !pro,
      credits: status,
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
    credits: await getCreditStatus(userId),
    credit_cost: options?.skipCredit ? 0 : CREDIT_COSTS[creditAction],
  };
}

export function quotaErrorResponse(
  limits: Record<string, number>,
  usage: Record<string, number>,
  credits?: CreditStatus,
) {
  const msg = credits
    ? `AI credits exhausted (${credits.used}/${credits.pool} this month). Your pantry and kitchen data still work. Upgrade to Plus for more credits.`
    : 'Usage limit reached. Upgrade to Plus for more access.';
  return {
    statusCode: 402,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({
      error: msg,
      upgrade_required: true,
      limits,
      usage,
      credits,
    }),
  };
}

export { isBasicAssistantMessage, chargeCredits };
