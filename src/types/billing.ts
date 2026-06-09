export type SubscriptionTier = 'free' | 'trial' | 'pro' | 'family';

export interface Subscription {
  user_id: string;
  tier: SubscriptionTier;
  status: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  trial_ends_at?: string;
  current_period_end?: string;
}

export interface UsageQuota {
  receipt_scans: number;
  meal_plans: number;
  assistant_messages: number;
  limits: {
    receipt_scans: number;
    meal_plans: number;
    assistant_messages: number;
  };
  has_pro_access: boolean;
  trial_ends_at?: string;
  tier: SubscriptionTier;
}

export interface Recipe {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  ingredients: { name: string; quantity: number; unit: string }[];
  instructions?: string;
  prep_time_minutes?: number;
  is_public: boolean;
  likes_count: number;
  created_at?: string;
  author_name?: string;
  saved?: boolean;
  liked?: boolean;
}

export const FREE_LIMITS = {
  receipt_scans: 5,
  meal_plans: 3,
  assistant_messages: 50,
  pantry_items: 100,
} as const;

export const PRO_LIMITS = {
  receipt_scans: Infinity,
  meal_plans: Infinity,
  assistant_messages: Infinity,
  pantry_items: Infinity,
} as const;

export function hasProAccess(sub: Subscription | null): boolean {
  if (!sub) return false;
  if (sub.tier === 'pro' || sub.tier === 'family') return sub.status === 'active' || sub.status === 'trialing';
  if (sub.tier === 'trial' && sub.trial_ends_at) {
    return new Date(sub.trial_ends_at) > new Date();
  }
  return false;
}
