import type { Handler } from '@netlify/functions';
import { withCors, jsonResponse, errorResponse, parseBody, requireAuth } from './utils/response.js';
import { useDevStore, loadStore } from './utils/db.js';
import { getSupabaseUserClient } from './utils/supabase.js';
import { chargeCredits, quotaErrorResponse } from './utils/quotas.js';
import type { InventoryItem, Profile } from '../src/types/index';
import {
  buildExperiencePlan,
  enrichExperiencePlanWithAI,
  type ExperienceType,
} from './utils/ai/experienceTimeline.js';
import { logGenerationToLedger } from './utils/ai/ledgerStore.js';

const VALID_TYPES = new Set<ExperienceType>(['potluck', 'dinner_party', 'game_day', 'holiday']);

async function loadContext(userId: string, token: string | undefined) {
  if (useDevStore()) {
    const store = loadStore();
    const inventory = store.inventory_items.filter((i) => i.user_id === userId);
    const raw = store.profiles.find((p) => p.user_id === userId);
    const profile: Profile = {
      user_id: userId,
      dietary_restrictions: raw?.dietary_restrictions ?? [],
      cuisine_preferences: raw?.cuisine_preferences ?? [],
      allergies: raw?.allergies ?? [],
      household_size: raw?.household_size ?? 2,
      preferred_store: raw?.preferred_store ?? '',
      gamification_level: raw?.gamification_level ?? 1,
      gamification_xp: raw?.gamification_xp ?? 0,
      onboarding_complete: raw?.onboarding_complete ?? false,
      assistant_name: raw?.assistant_name ?? 'Clara',
      last_meal_memory: raw?.last_meal_memory ?? {},
      household_id: raw?.household_id,
    };
    return { inventory, profile };
  }
  if (!token) throw new Error('Missing token');
  const db = getSupabaseUserClient(token);
  const { data: items } = await db.from('inventory_items').select('*').eq('user_id', userId);
  const { data: prof } = await db.from('profiles').select('*').eq('user_id', userId).single();
  return { inventory: (items ?? []) as InventoryItem[], profile: prof as Profile };
}

export const handler: Handler = withCors(async (event) => {
  const user = await requireAuth(event);
  if (!user) return errorResponse('Unauthorized', 401);

  if (event.httpMethod !== 'POST') return errorResponse('Method not allowed', 405);

  const body = parseBody<{
    experience_type?: ExperienceType;
    guest_count?: number;
    start_time?: string;
    cuisine_style?: string;
    message?: string;
    use_ai?: boolean;
  }>(event);

  if (!body?.experience_type || !VALID_TYPES.has(body.experience_type)) {
    return errorResponse('experience_type required: potluck | dinner_party | game_day | holiday', 400);
  }

  const credit = await chargeCredits(user.id, 'hosting_plan');
  if (!credit.allowed) {
    return quotaErrorResponse(
      { ai_credits_used: credit.status.pool },
      { ai_credits_used: credit.status.used },
      credit.status,
    );
  }

  const { inventory, profile } = await loadContext(user.id, user.token);
  const guestCount = Math.min(Math.max(body.guest_count ?? profile.household_size ?? 4, 2), 24);
  const startTime = body.start_time ?? '18:00';

  let plan = buildExperiencePlan({
    experience_type: body.experience_type,
    guest_count: guestCount,
    start_time: startTime,
    cuisine_style: body.cuisine_style,
    inventory,
    profile,
    message: body.message,
  });

  if (body.use_ai !== false) {
    plan = await enrichExperiencePlanWithAI(plan, inventory, profile, body.message);
  }

  await logGenerationToLedger(
    user.id,
    user.token,
    `generation:experience:${Date.now()}`,
    {
      domain: 'hosting',
      recommendation: `${plan.experience_type} for ${guestCount}`,
      why: plan.summary,
      evidence: plan.evidence,
      confidence: 0.8,
      expert_ids: plan.expert_ids,
      metadata: { experience_type: body.experience_type, guest_count: guestCount, start_time: startTime },
    },
    profile.household_id,
  );

  return jsonResponse({ plan }, 201);
});
