import type { Handler } from '@netlify/functions';
import { withCors, jsonResponse, errorResponse, parseBody, requireAuth } from './utils/response.js';
import { loadAssistantSession } from './utils/assistantContext.js';
import { checkAndIncrementQuota, quotaErrorResponse, chargeCredits } from './utils/quotas.js';
import type { InventoryItem, Profile } from '../../src/types/index';
import { formatInventoryForAI } from './utils/inventoryContext.js';
import {
  wantsDirectionsFirst,
  buildDirectionsResponse,
  formatDirectionsReply,
  classifyIntent,
} from './utils/ai/orchestrator.js';
import { buildExperiencePlan, type ExperienceType } from './utils/ai/experienceTimeline.js';
import { logGenerationToLedger } from './utils/ai/ledgerStore.js';
import { runSubstitutionPipeline } from './utils/ai/substitutionPipeline.js';
import { routeClaraReply } from './utils/ai/claraToolRouter.js';
import { resolveAssistantCreditAction } from './utils/ai/claraCredits.js';
import { parseDishRecipeRequest, formatDishRecipeReply } from './utils/ai/dishRecipeFormat.js';
import { buildSkillCoaching } from './utils/ai/skills.js';

function detectExperienceType(message: string): ExperienceType {
  if (/\bgame\s*day\b/i.test(message)) return 'game_day';
  if (/\bholiday|thanksgiving|christmas|easter\b/i.test(message)) return 'holiday';
  if (/\bpotluck\b/i.test(message)) return 'potluck';
  return 'dinner_party';
}

function extractGuestCount(message: string, defaultSize: number): number {
  const match = message.match(/(\d+)\s*(guests?|people|persons?)/i);
  if (!match) return Math.min(Math.max(defaultSize, 2), 24);
  return Math.min(Math.max(parseInt(match[1], 10), 2), 24);
}

async function assistantReply(
  message: string,
  inventory: InventoryItem[],
  profile: Profile,
  history: { role: string; content: string }[] = [],
  token?: string,
): Promise<{
  reply: string;
  suggested_items?: { name: string; quantity: number; unit: string }[];
  action?: string;
  directions?: import('../../src/types/mealDirections').MealDirection[];
  intent?: string;
  evidence?: string[];
  expert_ids?: string[];
  credit_cost?: number;
  credits_remaining?: number;
}> {
  const apiKey = process.env.OPENAI_API_KEY;
  const inventoryBlock = formatInventoryForAI(inventory);
  const intent = classifyIntent(message);

  const dishId = parseDishRecipeRequest(message);
  if (dishId) {
    const recipe = formatDishRecipeReply(dishId);
    if (recipe) {
      return {
        reply: recipe.reply,
        action: 'view_recipe',
        intent: 'suggestion',
        evidence: recipe.evidence,
        credit_cost: 0,
      };
    }
  }

  if (intent === 'skill') {
    const coach = buildSkillCoaching(message, inventory.map((i) => i.name));
    if (coach.tips.length) {
      const tips = coach.tips.map((t) => `**${t.technique_name}**\n${t.micro_lesson}`).join('\n\n');
      return {
        reply: `Chef, here's a quick coaching note:\n\n${tips}`,
        intent: 'skill',
        evidence: coach.inferred_technique_ids,
        credit_cost: 0,
      };
    }
  }

  if (intent === 'substitution') {
    const sub = runSubstitutionPipeline(message, inventory, profile);
    if (sub.handled && sub.reply) {
      await logGenerationToLedger(
        profile.user_id,
        token,
        `generation:substitution:${Date.now()}`,
        {
          domain: 'substitution',
          recommendation: message.slice(0, 120),
          why: sub.reply.slice(0, 200),
          evidence: sub.evidence ?? [],
          confidence: 0.85,
          expert_ids: sub.expert_ids ?? [],
          metadata: { source: 'substitution_pipeline' },
        },
        profile.household_id,
      );
      return {
        reply: sub.reply,
        action: sub.action,
        intent: 'substitution',
        evidence: sub.evidence,
        expert_ids: sub.expert_ids,
        credit_cost: 0,
      };
    }
  }

  if (intent === 'hosting') {
    const experienceType = detectExperienceType(message);
    const guestCount = extractGuestCount(message, profile.household_size ?? 4);
    const plan = buildExperiencePlan({
      experience_type: experienceType,
      guest_count: guestCount,
      start_time: '18:00',
      inventory,
      profile,
      message,
    });
    const menuPreview = plan.menu.map((m) => `• ${m.course}: ${m.name}`).join('\n');
    const timelinePreview = plan.timeline.slice(0, 5).map((s) => `• ${s.time} — ${s.task}`).join('\n');
    const reply = `${profile.assistant_name} sketched a ${experienceType.replace(/_/g, ' ')} for ${guestCount} guests.\n\n${plan.summary}\n\nMenu:\n${menuPreview}\n\nFirst timeline steps:\n${timelinePreview}\n\nWant me to refine the menu or build a shopping list?`;

    await logGenerationToLedger(
      profile.user_id,
      token,
      `generation:hosting:${Date.now()}`,
      {
        domain: 'hosting',
        recommendation: `${plan.experience_type} for ${guestCount}`,
        why: plan.summary,
        evidence: plan.evidence,
        confidence: 0.75,
        expert_ids: plan.expert_ids,
        metadata: { experience_type: experienceType, guest_count: guestCount, source: 'assistant' },
      },
      profile.household_id,
    );

    return {
      reply,
      action: 'hosting_plan',
      intent: 'hosting',
      evidence: plan.evidence,
      expert_ids: plan.expert_ids,
    };
  }

  if (wantsDirectionsFirst(message)) {
    const dirResult = buildDirectionsResponse(inventory, profile, message);
    await logGenerationToLedger(
      profile.user_id,
      token,
      `generation:chat_directions:${Date.now()}`,
      {
        domain: 'chat',
        recommendation: dirResult.directions.map((d) => d.title).join(' · ') || 'directions',
        why: dirResult.reasoning_note,
        evidence: dirResult.directions.flatMap((d) => d.evidence).slice(0, 12),
        confidence: dirResult.directions[0]?.confidence ?? 0.7,
        expert_ids: dirResult.expert_ids,
        metadata: { message_preview: message.slice(0, 120), mode: 'directions' },
      },
      profile.household_id,
    );
    return {
      reply: formatDirectionsReply(dirResult, profile.assistant_name ?? 'Clara'),
      action: 'pick_direction',
      directions: dirResult.directions,
      intent: dirResult.intent,
      evidence: dirResult.directions.flatMap((d) => d.evidence).slice(0, 8),
      expert_ids: dirResult.expert_ids,
      credit_cost: 0,
    };
  }

  if (!apiKey) {
    if (message.toLowerCase().includes('grilled cheese')) {
      return {
        reply: 'Did you use 2 slices of bread, 2 slices of cheese, and a little butter?',
        suggested_items: [
          { name: 'Bread', quantity: 2, unit: 'slices' },
          { name: 'Cheese', quantity: 2, unit: 'slices' },
          { name: 'Butter', quantity: 1, unit: 'tbsp' },
        ],
        action: 'confirm_usage',
      };
    }
    return {
      reply: `Hi! I'm ${profile.assistant_name}. Add your OPENAI_API_KEY for full AI assistant.\n\nPantry:\n${inventoryBlock}`,
    };
  }

  const routed = await routeClaraReply(message, inventory, profile, history, token);

  await logGenerationToLedger(
    profile.user_id,
    token,
    `generation:chat:${Date.now()}`,
    {
      domain: 'chat',
      recommendation: routed.reply.slice(0, 200),
      why: routed.synthesis ? 'Expert synthesis + tool router' : `Tool router · ${(routed.tools_used ?? []).join(', ')}`,
      evidence: routed.evidence ?? [],
      confidence: routed.synthesis ? 0.78 : 0.68,
      expert_ids: routed.expert_ids ?? [],
      metadata: {
        intent: routed.intent,
        action: routed.action,
        tools_used: routed.tools_used,
        synthesis: routed.synthesis,
      },
    },
    profile.household_id,
  );

  return {
    reply: routed.reply,
    suggested_items: routed.suggested_items,
    action: routed.action,
    pending_preference: routed.pending_preference,
    pending_inventory_deltas: routed.pending_inventory_deltas,
    pending_usage: routed.pending_usage,
    directions: routed.directions,
    intent: routed.intent,
    evidence: routed.evidence,
    expert_ids: routed.expert_ids,
  };
}

export const handler: Handler = withCors(async (event) => {
  const user = await requireAuth(event);
  if (!user) return errorResponse('Unauthorized', 401);
  const userId = user.id;

  if (event.httpMethod === 'POST') {
    const body = parseBody<{ message: string; history?: { role: string; content: string }[] }>(event);
    if (!body?.message) return errorResponse('Missing message');

    const intent = classifyIntent(body.message);
    const creditAction = resolveAssistantCreditAction(body.message, intent);

    const credit = await chargeCredits(userId, creditAction);
    if (!credit.allowed) {
      return quotaErrorResponse(
        { ai_credits_used: credit.status.pool },
        { ai_credits_used: credit.status.used },
        credit.status,
      );
    }

    // Legacy message counter for analytics
    await checkAndIncrementQuota(userId, 'assistant_messages', { message: body.message, skipCredit: true });

    const loaded = await loadAssistantSession(event);
    if ('error' in loaded) return loaded.error;
    const { inventory, profile } = loaded.session;

    const result = await assistantReply(body.message, inventory, profile, body.history || [], user.token);
    return jsonResponse({
      ...result,
      credit_cost: credit.cost,
      credits_remaining: credit.status.remaining,
      credits_used: credit.status.used,
      credits_pool: credit.status.pool,
    });
  }

  return errorResponse('Method not allowed', 405);
});
