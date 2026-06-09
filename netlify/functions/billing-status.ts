import type { Handler } from '@netlify/functions';
import Stripe from 'stripe';
import { withCors, jsonResponse, errorResponse, requireAuth } from './utils/response.js';
import { getSupabaseAdmin, useDevStore } from './utils/supabase.js';
import { getSubscription, getUsage, hasProAccess, getCreditStatus } from './utils/quotas.js';
import { CREDIT_POOLS, normalizeTier } from '../../src/types/credits.js';

const FREE_LIMITS = { receipt_scans: 5, meal_plans: 3, assistant_messages: 50 };

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

export const handler: Handler = withCors(async (event) => {
  const user = await requireAuth(event);
  if (!user) return errorResponse('Unauthorized', 401);

  if (event.httpMethod === 'GET') {
    const sub = await getSubscription(user.id);
    const usage = await getUsage(user.id);
    const pro = hasProAccess(sub);
    const credits = await getCreditStatus(user.id);
    const tier = normalizeTier(sub?.tier as string | undefined);

    return jsonResponse({
      subscription: sub,
      usage: {
        receipt_scans: usage.receipt_scans ?? 0,
        meal_plans: usage.meal_plans ?? 0,
        assistant_messages: usage.assistant_messages ?? 0,
        ai_credits_used: credits.used,
      },
      limits: pro
        ? { receipt_scans: 999999, meal_plans: 999999, assistant_messages: 999999 }
        : FREE_LIMITS,
      credits: {
        pool: credits.pool,
        used: credits.used,
        remaining: credits.remaining,
        month_key: credits.month_key,
        tier_label: tier,
        pools: CREDIT_POOLS,
      },
      has_pro_access: pro,
      trial_ends_at: sub?.trial_ends_at,
      tier: sub?.tier ?? 'free',
    });
  }

  if (event.httpMethod === 'POST') {
    if (!stripe) return errorResponse('Stripe not configured', 503);

    const body = JSON.parse(event.body || '{}') as { action?: string; tier?: string };
    const appUrl = process.env.URL || process.env.DEPLOY_PRIME_URL || 'http://localhost:8888';

    if (body.action === 'portal') {
      const sub = await getSubscription(user.id);
      if (!sub?.stripe_customer_id) return errorResponse('No billing account', 404);
      const session = await stripe.billingPortal.sessions.create({
        customer: sub.stripe_customer_id as string,
        return_url: `${appUrl}/settings`,
      });
      return jsonResponse({ url: session.url });
    }

    const tier = body.tier === 'family' ? 'family' : 'plus';
    const priceId =
      tier === 'family' ? process.env.STRIPE_PRICE_FAMILY : process.env.STRIPE_PRICE_PRO;
    if (!priceId) return errorResponse('Stripe price not configured', 503);

    let customerId: string | undefined;
    if (!useDevStore()) {
      const db = getSupabaseAdmin();
      const { data: sub } = await db.from('subscriptions').select('stripe_customer_id').eq('user_id', user.id).single();
      customerId = sub?.stripe_customer_id ?? undefined;
    }

    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email, metadata: { user_id: user.id } });
      customerId = customer.id;
      if (!useDevStore()) {
        const db = getSupabaseAdmin();
        await db.from('subscriptions').upsert({ user_id: user.id, stripe_customer_id: customerId });
      }
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/settings?upgraded=1`,
      cancel_url: `${appUrl}/settings`,
      subscription_data: {
        trial_period_days: 0,
        metadata: { user_id: user.id, tier },
      },
      metadata: { user_id: user.id, tier },
    });

    return jsonResponse({ url: session.url });
  }

  return errorResponse('Method not allowed', 405);
});
