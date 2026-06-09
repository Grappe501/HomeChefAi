import type { Handler } from '@netlify/functions';
import { withCors, jsonResponse, errorResponse, parseBody, requireAuth } from './utils/response.js';
import { useDevStore, loadStore } from './utils/db.js';
import { getSupabaseUserClient } from './utils/supabase.js';
import { checkAndIncrementQuota, quotaErrorResponse, chargeCredits } from './utils/quotas.js';
import type { InventoryItem, Profile } from '../../src/types/index';
import type { CreditAction } from '../../src/types/credits.js';
import { isBasicAssistantMessage } from '../../src/types/credits.js';
import { formatInventoryForAI } from './utils/inventoryContext.js';
import {
  wantsDirectionsFirst,
  buildDirectionsResponse,
  formatDirectionsReply,
  classifyIntent,
} from './utils/ai/orchestrator.js';
import { buildExperiencePlan, type ExperienceType } from './utils/ai/experienceTimeline.js';
import { logGenerationToLedger } from './utils/ai/ledgerStore.js';
import { buildClaraContext, formatClaraContextForPrompt } from './utils/ai/buildClaraContext.js';
import { runSubstitutionPipeline } from './utils/ai/substitutionPipeline.js';
import { expertsForIntent } from './utils/ai/brainRegistry.js';

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

  const ctx = await buildClaraContext(
    profile.user_id,
    token,
    inventory,
    profile,
    intent === 'general' ? 'chat' : intent,
  );
  const contextBlock = formatClaraContextForPrompt(ctx);
  const experts = expertsForIntent(intent === 'general' ? 'chat' : intent);
  const expertBrief = experts
    .filter((e) => e.id !== 'sous_chef')
    .map((e) => `${e.displayName}: ${e.role}`)
    .join('; ');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `${experts.find((e) => e.id === 'sous_chef')?.systemPromptPrefix ?? 'You are Clara, a kitchen sous chef.'}
User dietary: ${profile.dietary_restrictions.join(', ') || 'none'}. Cuisines: ${profile.cuisine_preferences.join(', ') || 'any'}. Allergies: ${profile.allergies.join(', ') || 'none'}.
Expert advisors active: ${expertBrief}.
Pantry — each line includes knowledge_id in brackets:
${inventoryBlock}
${contextBlock ? `\nKitchen context:\n${contextBlock}` : ''}
When user asks what to cook, offer 2–3 distinct flavor directions unless they picked one.
When user says they cooked something, suggest ingredients used and ask for confirmation.
For substitutions, prefer pantry items with matching knowledge ids.
Return JSON: {"reply":"string","suggested_items":[{"name":"string","quantity":number,"unit":"string"}],"action":"confirm_usage|suggest_meal|pick_direction|general"}
Be concise, warm, evidence-based. Never invent cook history not in context.`,
        },
        ...history.slice(-6),
        { role: 'user', content: message },
      ],
      max_tokens: 500,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) throw new Error('Assistant failed');
  const data = (await response.json()) as { choices: { message: { content: string } }[] };
  const parsed = JSON.parse(data.choices[0].message.content) as {
    reply: string;
    suggested_items?: { name: string; quantity: number; unit: string }[];
    action?: string;
  };

  await logGenerationToLedger(
    profile.user_id,
    token,
    `generation:chat:${Date.now()}`,
    {
      domain: 'chat',
      recommendation: parsed.reply.slice(0, 200),
      why: `Assistant reply for intent: ${intent}`,
      evidence: ctx.evidence,
      confidence: 0.65,
      expert_ids: ctx.expert_ids,
      metadata: { intent, action: parsed.action },
    },
    profile.household_id,
  );

  return {
    ...parsed,
    intent,
    evidence: ctx.evidence,
    expert_ids: ctx.expert_ids,
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
    let creditAction: CreditAction = 'assistant_complex';
    if (isBasicAssistantMessage(body.message)) creditAction = 'assistant_basic';
    else if (intent === 'substitution') creditAction = 'assistant_basic';
    else if (intent === 'hosting') creditAction = 'hosting_plan';
    else if (intent === 'suggestion' || wantsDirectionsFirst(body.message)) creditAction = 'suggestion';

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

    let inventory: InventoryItem[] = [];
    let profile: Profile;

    if (useDevStore()) {
      const store = loadStore();
      inventory = store.inventory_items.filter((i) => i.user_id === userId);
      profile = store.profiles.find((p) => p.user_id === userId)!;
    } else if (user.token) {
      const db = getSupabaseUserClient(user.token);
      const { data: items } = await db.from('inventory_items').select('*').eq('user_id', userId);
      inventory = (items ?? []) as InventoryItem[];
      const { data: prof } = await db.from('profiles').select('*').eq('user_id', userId).single();
      profile = prof as Profile;
    } else {
      return errorResponse('Missing token', 401);
    }

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
