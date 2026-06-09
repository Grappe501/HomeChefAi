/**
 * Brain 4.0 — Clara Tool Router: deterministic tools before GPT synthesis.
 */

import type { InventoryItem, Profile } from '../../../../src/types/index.js';
import type { MealDirection } from '../../../../src/types/mealDirections.js';
import { formatInventoryForAI, formatInventorySummary } from '../inventoryContext.js';
import { runSubstitutionPipeline } from './substitutionPipeline.js';
import { buildDirectionsResponse, classifyIntent, type ClassifiedIntent } from './orchestrator.js';
import { buildClaraContext, formatClaraContextForPrompt } from './buildClaraContext.js';
import { buildKitchenPredictions } from './kitchenPredictions.js';
import { expertsForIntent } from './brainRegistry.js';
import {
  needsExpertSynthesis,
  runExpertSynthesis,
  synthesizeClaraReply,
  type ExpertOutput,
} from './expertSynthesis.js';

export interface ClaraToolBundle {
  tools_used: string[];
  tool_context: string;
  evidence: string[];
  expert_ids: string[];
  intent: ClassifiedIntent;
}

export interface ClaraRoutedReply {
  reply: string;
  suggested_items?: { name: string; quantity: number; unit: string }[];
  action?: string;
  directions?: MealDirection[];
  intent?: string;
  evidence?: string[];
  expert_ids?: string[];
  expert_outputs?: ExpertOutput[];
  tools_used?: string[];
  synthesis?: boolean;
}

function expiringBlock(inventory: InventoryItem[], withinDays = 7): string {
  const now = Date.now();
  const cutoff = now + withinDays * 86400000;
  const expiring = inventory.filter((i) => {
    if (!i.expiration_date) return false;
    const t = new Date(i.expiration_date).getTime();
    return !Number.isNaN(t) && t <= cutoff && t >= now - 86400000;
  });
  if (!expiring.length) return '';
  return `Expiring soon: ${expiring.slice(0, 8).map((i) => i.name).join(', ')}.`;
}

export async function executeClaraTools(
  userId: string,
  token: string | undefined,
  message: string,
  inventory: InventoryItem[],
  profile: Profile,
): Promise<ClaraToolBundle> {
  const intent = classifyIntent(message);
  const domain = intent === 'general' ? 'chat' : intent;
  const tools_used: string[] = [];
  const parts: string[] = [];
  const evidence: string[] = [];

  tools_used.push('lookup_pantry');
  parts.push(`Pantry summary: ${formatInventorySummary(inventory)}`);
  const exp = expiringBlock(inventory);
  if (exp) {
    parts.push(exp);
    evidence.push(`expiring:${exp.split(': ')[1]?.split(',')[0] ?? 'items'}`);
  }

  const ctx = await buildClaraContext(userId, token, inventory, profile, domain);
  tools_used.push('get_ledger_context');
  const ctxBlock = formatClaraContextForPrompt(ctx);
  if (ctxBlock) parts.push(ctxBlock);
  evidence.push(...ctx.evidence);

  if (intent === 'substitution' || /\bsubstitut/i.test(message)) {
    tools_used.push('find_substitutes');
    const sub = runSubstitutionPipeline(message, inventory, profile);
    if (sub.handled && sub.reply) {
      parts.push(`Substitution engine: ${sub.reply}`);
      if (sub.evidence) evidence.push(...sub.evidence);
    }
  }

  if (/\bwhat (can|should)|dinner|tonight|directions\b/i.test(message)) {
    tools_used.push('suggest_directions');
    const dirs = buildDirectionsResponse(inventory, profile, message);
    if (dirs.directions.length) {
      parts.push(
        `Three directions: ${dirs.directions.map((d, i) => `${i + 1}. ${d.title} (${d.cuisine_label})`).join('; ')}`,
      );
      evidence.push(...dirs.directions.flatMap((d) => d.evidence).slice(0, 6));
    }
  }

  tools_used.push('query_brain');
  try {
    const predictions = await buildKitchenPredictions(userId, token);
    const top = predictions.predictions.slice(0, 3);
    if (top.length) {
      parts.push(
        `Proactive signals: ${top.map((p) => `${p.title} — ${p.message.slice(0, 80)}`).join(' | ')}`,
      );
      for (const p of top) evidence.push(...p.evidence.slice(0, 2));
    }
  } catch {
    /* brain predictions optional */
  }

  return {
    tools_used,
    tool_context: parts.filter(Boolean).join('\n'),
    evidence: [...new Set(evidence)].slice(0, 12),
    expert_ids: ctx.expert_ids,
    intent,
  };
}

export async function routeClaraReply(
  message: string,
  inventory: InventoryItem[],
  profile: Profile,
  history: { role: string; content: string }[] = [],
  token?: string,
): Promise<ClaraRoutedReply> {
  const apiKey = process.env.OPENAI_API_KEY;
  const inventoryBlock = formatInventoryForAI(inventory);
  const bundle = await executeClaraTools(profile.user_id, token, message, inventory, profile);
  const intent = bundle.intent;
  const domain = intent === 'general' ? 'chat' : intent;
  const experts = expertsForIntent(domain as import('./brainRegistry.js').IntentDomain);

  if (!apiKey) {
    return {
      reply: `Hi Chef! I'm ${profile.assistant_name}. Add OPENAI_API_KEY for full AI.\n\n${bundle.tool_context}\n\nPantry:\n${inventoryBlock}`,
      intent,
      evidence: bundle.evidence,
      expert_ids: bundle.expert_ids,
      tools_used: bundle.tools_used,
    };
  }

  const useSynthesis = needsExpertSynthesis(message, intent);

  if (useSynthesis) {
    const expertOutputs = await runExpertSynthesis(
      message,
      experts,
      bundle.tool_context,
      inventoryBlock,
      profile,
    );
    const merged = await synthesizeClaraReply(
      message,
      expertOutputs,
      bundle.tool_context,
      inventoryBlock,
      profile,
      history,
    );
    return {
      ...merged,
      intent,
      evidence: [
        ...bundle.evidence,
        ...expertOutputs.flatMap((o) => o.evidence).slice(0, 6),
      ],
      expert_ids: expertOutputs.map((o) => o.expert_id),
      expert_outputs: expertOutputs,
      tools_used: bundle.tools_used,
      synthesis: true,
    };
  }

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
          content: `${experts.find((e) => e.id === 'sous_chef')?.systemPromptPrefix ?? 'You are Clara.'}
User dietary: ${profile.dietary_restrictions.join(', ') || 'none'}. Allergies: ${profile.allergies.join(', ') || 'none'}.
Tools executed: ${bundle.tools_used.join(', ')}.
Expert advisors: ${expertBrief}.
Pantry — knowledge_id in brackets:
${inventoryBlock}
Kitchen context (from tools):
${bundle.tool_context}
When user asks what to cook, offer 2–3 distinct flavor directions unless they picked one.
Return JSON: {"reply":"string","suggested_items":[{"name":"string","quantity":number,"unit":"string"}],"action":"confirm_usage|suggest_meal|pick_direction|general"}
Be concise, warm, evidence-based. Never invent cook history.`,
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

  return {
    ...parsed,
    intent,
    evidence: bundle.evidence,
    expert_ids: bundle.expert_ids,
    tools_used: bundle.tools_used,
    synthesis: false,
  };
}
