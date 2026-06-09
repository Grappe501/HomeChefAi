/**
 * Agent Suite v6 Phase 2 — OpenAI function definitions + deterministic executors.
 */

import type { InventoryItem, Profile } from '../../../../src/types/index.js';
import { formatInventorySummary } from '../inventoryContext.js';
import { runSubstitutionPipeline } from './substitutionPipeline.js';
import { buildDirectionsResponse } from './orchestrator.js';
import { buildClaraContext, formatClaraContextForPrompt } from './buildClaraContext.js';
import { buildKitchenPredictions } from './kitchenPredictions.js';
import { searchDishes } from './dishSearch.js';
import { matchDishesForPantry } from './dishMatcher.js';
import { buildSkillCoaching } from './skills.js';
import { buildLocalFoodContext, lookupSourcingFromMessage } from './localFoodContext.js';
import { searchKnowledge, getKnowledgeNode, formatIngredientDepth } from './knowledgeLoader.js';
import { getDeepByKnowledgeId, searchDeep } from './deepLoader.js';
import { getTasteProfileSummary } from '../learning/tasteStore.js';
import { formatTasteProfileForPrompt } from '../learning/tasteProfileEngine.js';
import { getRhythmBundle } from '../learning/behaviorStore.js';
import { ensureSearchPack } from './dishSearchPack.js';
import type { PendingPreference, PreferenceKind } from '../../../../src/types/tasteLearning.js';
import type { InventoryDelta, PendingInventoryDelta } from '../../../../src/types/inventorySteward.js';
import { buildStewardPreview, findLowStock } from '../inventory/stewardEngine.js';

export type AgentToolName =
  | 'lookup_pantry'
  | 'search_dishes'
  | 'lookup_knowledge'
  | 'find_substitutes'
  | 'suggest_directions'
  | 'get_brain_context'
  | 'skill_coach'
  | 'local_sourcing'
  | 'get_taste_profile'
  | 'remember_preference'
  | 'get_kitchen_rhythm'
  | 'reconcile_inventory'
  | 'audit_pantry'
  | 'apply_inventory_delta';

export interface AgentToolContext {
  userId: string;
  token?: string;
  message: string;
  inventory: InventoryItem[];
  profile: Profile;
}

export interface AgentToolResult {
  tool: AgentToolName;
  output: string;
  evidence: string[];
  search_mode?: 'hybrid' | 'bm25' | 'pantry';
  pending_preference?: PendingPreference;
  pending_inventory_deltas?: PendingInventoryDelta;
}

export const CLARA_AGENT_TOOLS = [
  {
    type: 'function' as const,
    function: {
      name: 'lookup_pantry',
      description: 'Summarize current pantry inventory, expiring items, and preferred store context.',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'search_dishes',
      description: 'Hybrid BM25 + semantic search over 280k+ recipe library; re-ranks by pantry match. Use for recipe ideas and mood queries.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query — dish name, ingredients, cuisine, or mood' },
          limit: { type: 'number', description: 'Max results (default 8)' },
        },
        required: ['query'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'lookup_knowledge',
      description: 'Search knowledge graph and Kitchen Academy for techniques, ingredients, taste profiles, culture.',
      parameters: {
        type: 'object',
        properties: { query: { type: 'string' } },
        required: ['query'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'find_substitutes',
      description: 'Find ingredient substitutions from pantry and knowledge graph.',
      parameters: {
        type: 'object',
        properties: { ingredient: { type: 'string' } },
        required: ['ingredient'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'suggest_directions',
      description: 'Three distinct cooking directions from current pantry.',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_brain_context',
      description: 'Household brain memories, ledger learning, and proactive kitchen signals.',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'skill_coach',
      description: 'Technique micro-lessons inferred from user message and ingredients.',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'local_sourcing',
      description: 'Grocery chain and farmers market sourcing tips from profile and message.',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_taste_profile',
      description: 'Read learned household taste profile — flavor axes, prefers, avoids, drift notes.',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'remember_preference',
      description:
        'Stage a household food preference for user confirmation — avoid, prefer, allergy, or household member note. Does not save until user confirms.',
      parameters: {
        type: 'object',
        properties: {
          subject: { type: 'string', description: 'Ingredient, dish, or cuisine — e.g. cilantro, mushrooms' },
          kind: { type: 'string', enum: ['avoid', 'prefer', 'allergy', 'household'] },
          reason: { type: 'string', description: 'Optional short reason from user message' },
          member_label: { type: 'string', description: 'Optional household member — e.g. kids, partner' },
        },
        required: ['subject', 'kind'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_kitchen_rhythm',
      description:
        'Read learned household rhythm — cook nights, shop day, leftover style, budget band, weeknight time budget.',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'reconcile_inventory',
      description: 'Find duplicate pantry items, unit mismatches, and mislocated items. Returns merge suggestions (0 credits).',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'audit_pantry',
      description: 'Run pantry audit — expiring, low stock, duplicates, mislocated items.',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'apply_inventory_delta',
      description:
        'Stage pantry quantity changes for user confirmation — add, subtract, set, or remove items. Does not apply until confirmed.',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['add', 'subtract', 'set', 'remove'] },
          name: { type: 'string' },
          quantity: { type: 'number' },
          unit: { type: 'string' },
          reason: { type: 'string' },
        },
        required: ['action', 'name'],
        additionalProperties: false,
      },
    },
  },
];

function knowledgeSnippet(node: import('../../../../src/types/knowledge.js').KnowledgeNode): string {
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

export async function executeAgentTool(
  name: AgentToolName,
  args: Record<string, unknown>,
  ctx: AgentToolContext,
): Promise<AgentToolResult> {
  const evidence: string[] = [];

  switch (name) {
    case 'lookup_pantry': {
      const parts = [`Pantry: ${formatInventorySummary(ctx.inventory)}`];
      const local = buildLocalFoodContext(ctx.profile);
      if (local.text) {
        parts.push(local.text);
        evidence.push(...local.evidence);
      }
      const expiring = ctx.inventory.filter((i) => {
        if (!i.expiration_date) return false;
        const days = (new Date(i.expiration_date).getTime() - Date.now()) / 86400000;
        return days >= 0 && days <= 7;
      });
      if (expiring.length) {
        parts.push(`Expiring soon: ${expiring.slice(0, 6).map((i) => i.name).join(', ')}`);
      }
      return { tool: name, output: parts.join('\n'), evidence };
    }

    case 'search_dishes': {
      const query = String(args.query ?? ctx.message).slice(0, 120);
      const limit = Math.min(Number(args.limit) || 8, 15);
      const { matches: hits, mode } = await searchDishes(query, ctx.inventory, ctx.profile, { limit });
      if (!hits.length) {
        return { tool: name, output: 'No dish matches for that query.', evidence: [], search_mode: mode };
      }
      const lines = hits.map(
        (m) => `${m.title} (${m.cuisine_label}, ${m.pantry_match}% pantry · ${m.id})`,
      );
      evidence.push(...hits.slice(0, 5).map((m) => m.id));
      return {
        tool: name,
        output: `Dish search (${hits.length}, ${mode}):\n${lines.join('\n')}`,
        evidence,
        search_mode: mode,
      };
    }

    case 'lookup_knowledge': {
      const q = String(args.query ?? ctx.message).slice(0, 80);
      const parts: string[] = [];
      for (const h of searchKnowledge(q, undefined, 5)) {
        const node = getKnowledgeNode(h.id);
        const deep = node ? getDeepByKnowledgeId(h.id) : undefined;
        if (node) {
          parts.push(deep?.summary ? `${knowledgeSnippet(node)} — ${deep.summary.slice(0, 100)}` : knowledgeSnippet(node));
          evidence.push(deep?.id ?? h.id);
        }
      }
      for (const deep of searchDeep(q, 2)) {
        parts.push(`${deep.title}: ${deep.summary.slice(0, 120)}`);
        evidence.push(deep.id);
      }
      return { tool: name, output: parts.length ? parts.join(' | ') : 'No knowledge hits.', evidence };
    }

    case 'find_substitutes': {
      const ing = String(args.ingredient ?? ctx.message);
      const sub = runSubstitutionPipeline(`substitute for ${ing}`, ctx.inventory, ctx.profile);
      return {
        tool: name,
        output: sub.reply ?? 'No substitution found.',
        evidence: sub.evidence ?? [],
      };
    }

    case 'suggest_directions': {
      const dirs = buildDirectionsResponse(ctx.inventory, ctx.profile, ctx.message);
      const text = dirs.directions.length
        ? dirs.directions.map((d, i) => `${i + 1}. ${d.title} (${d.cuisine_label})`).join('; ')
        : 'No directions available.';
      evidence.push(...dirs.directions.flatMap((d) => d.evidence).slice(0, 6));
      return { tool: name, output: text, evidence };
    }

    case 'get_brain_context': {
      const bundle = await buildClaraContext(ctx.userId, ctx.token, ctx.inventory, ctx.profile, 'chat');
      const block = formatClaraContextForPrompt(bundle);
      try {
        const preds = await buildKitchenPredictions(ctx.userId, ctx.token);
        const predText = preds.predictions
          .slice(0, 3)
          .map((p) => `${p.title}: ${p.message.slice(0, 80)}`)
          .join(' | ');
        evidence.push(...bundle.evidence, ...preds.predictions.flatMap((p) => p.evidence).slice(0, 4));
        return { tool: name, output: [block, predText ? `Proactive: ${predText}` : ''].filter(Boolean).join('\n'), evidence };
      } catch {
        return { tool: name, output: block || 'No brain context.', evidence: bundle.evidence };
      }
    }

    case 'skill_coach': {
      const coach = buildSkillCoaching(ctx.message, ctx.inventory.map((i) => i.name));
      const text = coach.tips.map((t) => `${t.technique_name}: ${t.micro_lesson}`).join(' | ');
      return { tool: name, output: text || 'No technique tips.', evidence: coach.inferred_technique_ids };
    }

    case 'local_sourcing': {
      const local = buildLocalFoodContext(ctx.profile);
      const msg = lookupSourcingFromMessage(ctx.message);
      const parts = [local.text, msg.text].filter(Boolean);
      evidence.push(...local.evidence, ...msg.evidence);
      return { tool: name, output: parts.join('\n') || 'Set preferred store in profile for sourcing tips.', evidence };
    }

    case 'get_taste_profile': {
      const profile = await getTasteProfileSummary(ctx.userId, ctx.token);
      const block = formatTasteProfileForPrompt(profile);
      evidence.push('taste_profile:v7');
      if (profile.preferences[0]) evidence.push(`pref:${profile.preferences[0].id}`);
      return {
        tool: name,
        output: block || 'No taste profile yet — ratings and preferences will build it over time.',
        evidence,
      };
    }

    case 'remember_preference': {
      const subject = String(args.subject ?? '').trim();
      const kind = String(args.kind ?? 'avoid') as PreferenceKind;
      if (!subject) {
        return { tool: name, output: 'Need a subject (ingredient, dish, or cuisine) to remember.', evidence: [] };
      }
      const pending: PendingPreference = {
        subject,
        kind,
        reason: args.reason ? String(args.reason).slice(0, 240) : undefined,
        member_label: args.member_label ? String(args.member_label).slice(0, 60) : undefined,
      };
      const label =
        kind === 'avoid'
          ? `avoid ${subject}`
          : kind === 'prefer'
            ? `prefer ${subject}`
            : kind === 'allergy'
              ? `allergy: ${subject}`
              : `household note: ${subject}`;
      return {
        tool: name,
        output: `Staged preference — ask Chef to confirm saving "${label}" for future plans.`,
        evidence: [`pending_pref:${kind}:${subject}`],
        pending_preference: pending,
      };
    }

    case 'get_kitchen_rhythm': {
      const bundle = await getRhythmBundle(ctx.userId, ctx.token);
      evidence.push('behavior_profile:v7');
      if (bundle.behavior_profile.shop_day) evidence.push(`shop_day:${bundle.behavior_profile.shop_day.day_name}`);
      if (bundle.behavior_profile.cook_nights[0]) {
        evidence.push(`cook_night:${bundle.behavior_profile.cook_nights[0].day_name}`);
      }
      return {
        tool: name,
        output: bundle.summary || 'No rhythm profile yet — cook logs and receipts will build it over time.',
        evidence,
      };
    }

    case 'reconcile_inventory': {
      const preview = buildStewardPreview(ctx.inventory);
      const lines: string[] = ['Pantry reconcile:'];
      if (preview.duplicates.length) {
        lines.push(
          `Duplicates (${preview.duplicates.length}): ${preview.duplicates
            .slice(0, 3)
            .map((d) => `${d.names.join(' / ')} → keep ${d.names[0]}`)
            .join('; ')}`,
        );
        evidence.push(...preview.duplicates.slice(0, 3).map((d) => `dup:${d.id}`));
      }
      if (preview.mislocated.length) {
        lines.push(
          `Mislocated: ${preview.mislocated
            .slice(0, 4)
            .map((m) => `${m.name} (${m.current}→${m.suggested})`)
            .join(', ')}`,
        );
      }
      if (!preview.duplicates.length && !preview.mislocated.length) {
        lines.push('No duplicates or location fixes needed.');
      }
      return { tool: name, output: lines.join('\n'), evidence };
    }

    case 'audit_pantry': {
      const preview = buildStewardPreview(ctx.inventory);
      const low = findLowStock(ctx.inventory);
      const lines = preview.findings.map((f) => `${f.title}: ${f.message}`);
      if (!lines.length) lines.push('Pantry looks healthy — no urgent audit items.');
      evidence.push(...preview.findings.slice(0, 4).map((f) => `audit:${f.id}`));
      if (low.length) evidence.push(`low_stock:${low.length}`);
      return { tool: name, output: lines.join('\n'), evidence };
    }

    case 'apply_inventory_delta': {
      const action = String(args.action ?? 'subtract') as InventoryDelta['action'];
      const itemName = String(args.name ?? '').trim();
      if (!itemName) {
        return { tool: name, output: 'Need an item name for the pantry change.', evidence: [] };
      }
      const delta: InventoryDelta = {
        action,
        name: itemName,
        quantity: args.quantity != null ? Number(args.quantity) : 1,
        unit: args.unit ? String(args.unit) : undefined,
        reason: args.reason ? String(args.reason).slice(0, 120) : undefined,
      };
      const summary = `${action} ${delta.quantity ?? 1}${delta.unit ? ` ${delta.unit}` : ''} ${itemName}`;
      return {
        tool: name,
        output: `Staged pantry change — ask Chef to confirm: ${summary}`,
        evidence: [`pending_delta:${action}:${itemName}`],
        pending_inventory_deltas: { deltas: [delta], summary },
      };
    }

    default:
      return { tool: 'lookup_pantry', output: 'Unknown tool.', evidence: [] };
  }
}

/** Pantry-only match for agent fallback */
export async function matchDishesPantryOnly(ctx: AgentToolContext, limit = 6): Promise<AgentToolResult> {
  await ensureSearchPack();
  const hits = matchDishesForPantry(ctx.inventory, ctx.profile, { limit });
  const lines = hits.map((m) => `${m.title} (${m.pantry_match}% pantry · ${m.id})`);
  return {
    tool: 'search_dishes',
    output: lines.length ? lines.join('\n') : 'No pantry matches.',
    evidence: hits.slice(0, 4).map((m) => m.id),
  };
}
