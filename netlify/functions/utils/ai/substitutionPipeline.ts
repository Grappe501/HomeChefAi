/**
 * Substitution pipeline — graph-first, zero GPT when registry resolves.
 */

import type { InventoryItem, Profile } from '../../../../src/types/index.js';
import { findKnowledgeByWizardItem, getKnowledgeNode } from './knowledgeLoader.js';
import {
  parseSubstitutionReason,
  resolveSubstitutions,
  resolveSubstitutionsByWizardItem,
} from './substitutionEngine.js';
import { expertIdsForIntent } from './orchestrator.js';

export interface SubstitutionPipelineResult {
  handled: boolean;
  reply?: string;
  evidence?: string[];
  expert_ids?: string[];
  action?: string;
}

const INGREDIENT_PATTERNS = [
  /\bout of ([a-z0-9\s'-]+?)(?:\?|$|\.|,)/i,
  /\bdon't have ([a-z0-9\s'-]+?)(?:\?|$|\.|,)/i,
  /\bsubstitut(e|ion) (?:for )?([a-z0-9\s'-]+?)(?:\?|$|\.|,)/i,
  /\bcan i use .+ instead of ([a-z0-9\s'-]+?)(?:\?|$|\.|,)/i,
  /\breplace ([a-z0-9\s'-]+?) with/i,
  /\bno ([a-z0-9\s'-]+?)(?:\?|$|\.|,)/i,
];

function extractIngredient(message: string): string | null {
  for (const p of INGREDIENT_PATTERNS) {
    const m = message.match(p);
    const raw = m?.[2] ?? m?.[1];
    if (raw && raw.length > 1 && raw.length < 40) return raw.trim();
  }
  return null;
}

function matchInventoryIngredient(name: string, inventory: InventoryItem[]): string | null {
  const lower = name.toLowerCase();
  const hit = inventory.find((i) => i.name.toLowerCase().includes(lower) || lower.includes(i.name.toLowerCase()));
  return hit?.name ?? null;
}

export function runSubstitutionPipeline(
  message: string,
  inventory: InventoryItem[],
  profile: Profile,
): SubstitutionPipelineResult {
  const ingredient = extractIngredient(message);
  if (!ingredient) return { handled: false };

  const reason = parseSubstitutionReason(message);
  const expert_ids = expertIdsForIntent('substitution');
  const assistantName = profile.assistant_name ?? 'Clara';

  let fromId: string | undefined;
  const wizardHit = findKnowledgeByWizardItem(ingredient);
  if (wizardHit) fromId = wizardHit.id;

  if (!fromId) {
    const invName = matchInventoryIngredient(ingredient, inventory);
    if (invName) {
      const byWizard = resolveSubstitutionsByWizardItem(invName, { reason, limit: 5 });
      if (byWizard) {
        return formatSubstitutionReply(byWizard, assistantName, expert_ids, ingredient);
      }
    }
    const byName = resolveSubstitutionsByWizardItem(ingredient, { reason, limit: 5 });
    if (byName) return formatSubstitutionReply(byName, assistantName, expert_ids, ingredient);
    return {
      handled: true,
      reply: `${assistantName} couldn't find "${ingredient}" in the knowledge graph yet. Try the exact pantry name or add it to inventory first.`,
      evidence: [`query:${ingredient}`],
      expert_ids,
      action: 'substitution',
    };
  }

  const result = resolveSubstitutions(fromId, { reason, limit: 5 });
  if (!result) return { handled: false };
  return formatSubstitutionReply(result, assistantName, expert_ids, ingredient);
}

function formatSubstitutionReply(
  result: NonNullable<ReturnType<typeof resolveSubstitutions>>,
  assistantName: string,
  expert_ids: string[],
  query: string,
): SubstitutionPipelineResult {
  if (result.already_satisfies) {
    return {
      handled: true,
      reply: `${assistantName}: ${result.from_name} already works for this — you're good to go.`,
      evidence: [`node:${result.from_id}`, `query:${query}`],
      expert_ids,
      action: 'substitution',
    };
  }

  if (!result.suggestions.length) {
    const node = getKnowledgeNode(result.from_id);
    return {
      handled: true,
      reply: `${assistantName}: No registry substitutes for ${result.from_name} yet. Check your pantry for similar items or ask me to suggest a direction from what you have.`,
      evidence: [`node:${result.from_id}`, `query:${query}`],
      expert_ids,
      action: 'substitution',
    };
  }

  const picks = result.suggestions.slice(0, 3);
  const lines = picks.map((s) => `• ${s.display_name}${s.note ? ` — ${s.note}` : ''}`).join('\n');

  return {
    handled: true,
    reply: `${assistantName} found substitutes for ${result.from_name}:\n\n${lines}\n\nThese come from the knowledge graph — verify amounts for your recipe.`,
    evidence: [`node:${result.from_id}`, ...picks.map((s) => `sub:${s.id}`)],
    expert_ids,
    action: 'substitution',
  };
}
