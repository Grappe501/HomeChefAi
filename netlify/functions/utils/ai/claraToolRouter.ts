/**
 * Agent Suite v6 — Clara Tool Router: intent-selective tools before GPT synthesis.
 */

import type { InventoryItem, Profile } from '../../../../src/types/index.js';
import { formatInventoryForAI, formatInventorySummary } from '../inventoryContext.js';
import { runSubstitutionPipeline } from './substitutionPipeline.js';
import { buildDirectionsResponse, classifyIntent, type ClassifiedIntent } from './orchestrator.js';
import { buildClaraContext, formatClaraContextForPrompt } from './buildClaraContext.js';
import { buildKitchenPredictions } from './kitchenPredictions.js';
import { matchDishesForPantry } from './dishMatcher.js';
import { searchKnowledge, getKnowledgeNode, formatIngredientDepth } from './knowledgeLoader.js';
import { getDeepByKnowledgeId, searchDeep } from './deepLoader.js';
import { buildSkillCoaching } from './skills.js';
import { buildLocalFoodContext, lookupSourcingFromMessage } from './localFoodContext.js';
import { parseDishRecipeRequest, formatDishRecipeReply } from './dishRecipeFormat.js';
import { expertsForIntent } from './brainRegistry.js';
import { planClaraTools, needsDishSearch } from './claraToolPlan.js';
import {
  needsExpertSynthesis,
  runExpertSynthesis,
  synthesizeClaraReply,
} from './expertSynthesis.js';
import { needsAgentLoop, runClaraAgentLoop } from './claraAgentLoop.js';
import { searchDishes } from './dishSearch.js';
import type { ClaraRoutedReply } from './claraReplyTypes.js';

export type { ClaraRoutedReply } from './claraReplyTypes.js';

export interface ClaraToolBundle {
  tools_used: string[];
  tool_context: string;
  evidence: string[];
  expert_ids: string[];
  intent: ClassifiedIntent;
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

function formatKnowledgeSnippet(node: import('../../../../src/types/knowledge.js').KnowledgeNode): string {
  const lesson = (node.attributes?.micro_lesson as string | undefined) ?? node.description;
  if (node.type === 'technique' || node.type === 'flavor_profile' || node.type === 'culture') {
    return lesson ? `${node.display_name}: ${lesson.slice(0, 140)}` : node.display_name;
  }
  if (node.type === 'food_source') {
    const tip = (node.attributes?.shopping_tips as string[] | undefined)?.[0];
    return tip ? `${node.display_name}: ${tip.slice(0, 140)}` : node.display_name;
  }
  return formatIngredientDepth(node);
}

function runKnowledgeLookup(message: string): { text: string; evidence: string[] } {
  const q = message.replace(/\b(what is|how to|tell me about)\b/gi, '').trim().slice(0, 80);
  if (!q) return { text: '', evidence: [] };

  const parts: string[] = [];
  const evidence: string[] = [];
  const seen = new Set<string>();

  for (const h of searchKnowledge(q, undefined, 5)) {
    if (seen.has(h.id)) continue;
    seen.add(h.id);
    const node = getKnowledgeNode(h.id);
    const depth = node ? formatKnowledgeSnippet(node) : h.display_name;
    const deep = node ? getDeepByKnowledgeId(h.id) : undefined;
    if (deep?.summary) {
      parts.push(`${depth} — ${deep.summary.slice(0, 140)}`);
      evidence.push(deep.id);
    } else {
      const desc = node?.description?.slice(0, 100);
      parts.push(desc ? `${depth} — ${desc}` : depth);
      evidence.push(h.id);
    }
  }

  for (const deep of searchDeep(q, 2)) {
    if (seen.has(deep.id)) continue;
    seen.add(deep.id);
    parts.push(`${deep.title}: ${deep.summary.slice(0, 140)}`);
    evidence.push(deep.id);
  }

  return {
    text: parts.length ? `Knowledge lookup: ${parts.join(' | ')}` : '',
    evidence,
  };
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
  const toolPlan = planClaraTools(intent, message);
  const tools_used: string[] = [];
  const parts: string[] = [];
  const evidence: string[] = [];

  if (toolPlan.has('lookup_pantry')) {
    tools_used.push('lookup_pantry');
    parts.push(`Pantry summary: ${formatInventorySummary(inventory)}`);
    const exp = expiringBlock(inventory);
    if (exp) {
      parts.push(exp);
      evidence.push(`expiring:${exp.split(': ')[1]?.split(',')[0] ?? 'items'}`);
    }
    const localFood = buildLocalFoodContext(profile);
    if (localFood.text) {
      parts.push(localFood.text);
      evidence.push(...localFood.evidence);
    }
  }

  let ctx = {
    expert_ids: [] as string[],
    evidence: [] as string[],
  };

  if (toolPlan.has('get_ledger_context')) {
    tools_used.push('get_ledger_context');
    const bundle = await buildClaraContext(userId, token, inventory, profile, domain);
    ctx = bundle;
    const ctxBlock = formatClaraContextForPrompt(bundle);
    if (ctxBlock) parts.push(ctxBlock);
    evidence.push(...bundle.evidence);
    if (bundle.memory_block) tools_used.push('brain_memories');
  }

  if (toolPlan.has('find_substitutes')) {
    tools_used.push('find_substitutes');
    const sub = runSubstitutionPipeline(message, inventory, profile);
    if (sub.handled && sub.reply) {
      parts.push(`Substitution engine: ${sub.reply}`);
      if (sub.evidence) evidence.push(...sub.evidence);
    }
  }

  if (toolPlan.has('suggest_directions')) {
    tools_used.push('suggest_directions');
    const dirs = buildDirectionsResponse(inventory, profile, message);
    if (dirs.directions.length) {
      parts.push(
        `Three directions: ${dirs.directions.map((d, i) => `${i + 1}. ${d.title} (${d.cuisine_label}${d.dish_id ? ` · ${d.dish_id}` : ''})`).join('; ')}`,
      );
      evidence.push(...dirs.directions.flatMap((d) => d.evidence).slice(0, 6));
    }
  }

  if (toolPlan.has('match_dishes')) {
    const useSearch = needsDishSearch(message);
    tools_used.push(useSearch ? 'search_dishes' : 'match_dishes');
    let matches;
    let search_mode: ClaraRoutedReply['search_mode'];
    if (useSearch) {
      const result = await searchDishes(message, inventory, profile, { limit: 6 });
      matches = result.matches;
      search_mode = result.mode;
    } else {
      matches = matchDishesForPantry(inventory, profile, { limit: 6 });
      search_mode = 'pantry';
    }
    if (matches.length) {
      parts.push(
        `Dish library (${matches.length} matches${search_mode ? ` · ${search_mode}` : ''}): ${matches
          .slice(0, 5)
          .map((m) => `${m.title} (${m.pantry_match}% pantry · ${m.id})`)
          .join('; ')}`,
      );
      evidence.push(...matches.slice(0, 3).map((m) => m.id));
    }
  }

  if (toolPlan.has('lookup_knowledge')) {
    tools_used.push('lookup_knowledge');
    const lookup = runKnowledgeLookup(message);
    if (lookup.text) {
      parts.push(lookup.text);
      evidence.push(...lookup.evidence);
    }
    const sourcing = lookupSourcingFromMessage(message);
    if (sourcing.text) {
      parts.push(sourcing.text);
      evidence.push(...sourcing.evidence);
    }
  }

  if (toolPlan.has('skill_coach')) {
    tools_used.push('skill_coach');
    const coach = buildSkillCoaching(message, inventory.map((i) => i.name));
    if (coach.tips.length) {
      parts.push(
        `Skill coaching: ${coach.tips.map((t) => `${t.technique_name} — ${t.micro_lesson.slice(0, 120)}`).join(' | ')}`,
      );
      evidence.push(...coach.inferred_technique_ids);
    }
  }

  if (toolPlan.has('query_brain')) {
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
      /* optional */
    }
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
  const dishId = parseDishRecipeRequest(message);
  if (dishId) {
    const recipe = formatDishRecipeReply(dishId);
    if (recipe) {
      return {
        reply: recipe.reply,
        action: 'view_recipe',
        intent: 'suggestion',
        evidence: recipe.evidence,
        tools_used: ['match_dishes', 'lookup_knowledge'],
        synthesis: false,
      };
    }
  }

  const intent = classifyIntent(message);
  if (needsAgentLoop(message, intent)) {
    return runClaraAgentLoop(message, inventory, profile, history, intent, token);
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const inventoryBlock = formatInventoryForAI(inventory);
  const bundle = await executeClaraTools(profile.user_id, token, message, inventory, profile);
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
