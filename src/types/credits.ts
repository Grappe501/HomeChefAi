/** Unified AI credit model — aligns with /legal/ai-usage.html v2.2 */

export type CreditAction =
  | 'assistant_basic'
  | 'assistant_complex'
  | 'receipt_ocr'
  | 'meal_plan_3day'
  | 'meal_plan_7day'
  | 'meal_plan_long'
  | 'suggestion'
  | 'meal_explain'
  | 'hosting_plan';

export const CREDIT_COSTS: Record<CreditAction, number> = {
  assistant_basic: 0,
  assistant_complex: 1,
  receipt_ocr: 1,
  meal_plan_3day: 1,
  meal_plan_7day: 2,
  meal_plan_long: 3,
  suggestion: 1,
  meal_explain: 1,
  hosting_plan: 5,
};

export type BillingTier = 'free' | 'trial' | 'plus' | 'pro' | 'family';

export const CREDIT_POOLS: Record<'free' | 'plus' | 'family', number> = {
  free: 30,
  plus: 150,
  family: 300,
};

export function normalizeTier(tier?: string): 'free' | 'plus' | 'family' {
  if (tier === 'family') return 'family';
  if (tier === 'plus' || tier === 'pro') return 'plus';
  if (tier === 'trial') return 'plus';
  return 'free';
}

export function creditPoolForTier(tier?: string): number {
  return CREDIT_POOLS[normalizeTier(tier)];
}

export function mealPlanCreditAction(planDays: number): CreditAction {
  if (planDays <= 3) return 'meal_plan_3day';
  if (planDays <= 7) return 'meal_plan_7day';
  return 'meal_plan_long';
}

export interface CreditStatus {
  tier: BillingTier;
  pool: number;
  used: number;
  remaining: number;
  month_key: string;
  billing_enabled: boolean;
}

export interface CreditChargeResult {
  allowed: boolean;
  cost: number;
  status: CreditStatus;
  upgrade_required?: boolean;
}

/** Legacy quota action → credit action */
export function legacyActionToCredit(action: 'receipt_scans' | 'meal_plans' | 'assistant_messages'): CreditAction {
  switch (action) {
    case 'receipt_scans':
      return 'receipt_ocr';
    case 'meal_plans':
      return 'meal_plan_7day';
    case 'assistant_messages':
      return 'assistant_complex';
  }
}

export function isBasicAssistantMessage(message: string): boolean {
  const m = message.trim().toLowerCase();
  if (!m) return true;
  if (m.length > 80) return false;
  return (
    /^(hi|hello|hey|thanks|thank you|ok|okay|yes|no)\b/.test(m) ||
    /\bwhat('s| is) in (my )?pantry\b/.test(m) ||
    /\bhow many items\b/.test(m) ||
    /\blist (my )?pantry\b/.test(m) ||
    /\bwhat do i have\b/.test(m)
  );
}
