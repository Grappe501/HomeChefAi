import type { Handler } from '@netlify/functions';
import Stripe from 'stripe';
import { jsonResponse, errorResponse } from './utils/response.js';
import { getSupabaseAdmin } from './utils/supabase.js';

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return errorResponse('Method not allowed', 405);
  if (!stripe) return errorResponse('Stripe not configured', 503);

  const sig = event.headers['stripe-signature'];
  if (!sig || !event.body) return errorResponse('Missing signature', 400);

  let stripeEvent: Stripe.Event;
  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (err) {
    return errorResponse(`Webhook error: ${err instanceof Error ? err.message : 'invalid'}`, 400);
  }

  const db = getSupabaseAdmin();

  switch (stripeEvent.type) {
    case 'checkout.session.completed': {
      const session = stripeEvent.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id;
      const tier = session.metadata?.tier || 'pro';
      if (userId && session.subscription) {
        await db.from('subscriptions').upsert({
          user_id: userId,
          tier,
          status: 'active',
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string,
          updated_at: new Date().toISOString(),
        });
      }
      break;
    }
    case 'customer.subscription.updated': {
      const sub = stripeEvent.data.object as Stripe.Subscription;
      const userId = sub.metadata?.user_id;
      if (userId) {
        const tier = sub.metadata?.tier || 'pro';
        await db.from('subscriptions').upsert({
          user_id: userId,
          tier,
          status: sub.status,
          stripe_subscription_id: sub.id,
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
      break;
    }
    case 'customer.subscription.deleted': {
      const sub = stripeEvent.data.object as Stripe.Subscription;
      const userId = sub.metadata?.user_id;
      if (userId) {
        await db.from('subscriptions').upsert({
          user_id: userId,
          tier: 'free',
          status: 'canceled',
          updated_at: new Date().toISOString(),
        });
      }
      break;
    }
  }

  return jsonResponse({ received: true });
};
