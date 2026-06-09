/**
 * Clara Context Assembler — Brain 3.0 Phase 9
 * Bundles pantry, expiring items, brain hints, and ledger signals for one GPT call.
 */

import type { InventoryItem, Profile } from '../../../../src/types/index.js';
import type { IntentDomain } from './brainRegistry.js';
import { expertIdsForIntent } from './orchestrator.js';
import { formatInventorySummary } from '../inventoryContext.js';
import { getRecentLedger } from './ledgerStore.js';
import { formatRejectHistoryForAssistant, processLedgerOutcomes } from './outcomeProcessor.js';
import { buildKitchenBrainContext, formatKitchenBrainContextForPrompt } from './kitchenBrainContext.js';

export interface ClaraContextBundle {
  pantry_summary: string;
  expiring_block: string;
  memory_block: string;
  ledger_hint: string;
  expert_ids: string[];
  evidence: string[];
}

function expiringItems(inventory: InventoryItem[], withinDays = 7): InventoryItem[] {
  const now = Date.now();
  const cutoff = now + withinDays * 86400000;
  return inventory.filter((i) => {
    const exp = (i as { expiration_date?: string }).expiration_date;
    if (!exp) return false;
    const t = new Date(exp).getTime();
    return !Number.isNaN(t) && t <= cutoff && t >= now - 86400000;
  });
}

function lastMealBlock(profile: Profile): string {
  const mem = profile.last_meal_memory as { meal?: string; date?: string; items?: string[] } | undefined;
  if (!mem?.meal) return '';
  const items = mem.items?.slice(0, 5).join(', ') ?? '';
  return `Last cooked: ${mem.meal}${items ? ` (${items})` : ''}.`;
}

export async function buildClaraContext(
  userId: string,
  token: string | undefined,
  inventory: InventoryItem[],
  profile: Profile,
  intent: IntentDomain | 'general',
): Promise<ClaraContextBundle> {
  const domain = intent === 'general' ? 'chat' : intent;
  const expert_ids = expertIdsForIntent(domain as IntentDomain);

  const expiring = expiringItems(inventory);
  const expiring_block =
    expiring.length > 0
      ? `Use soon: ${expiring
          .slice(0, 8)
          .map((i) => i.name)
          .join(', ')}.`
      : '';

  const brainCtx = await buildKitchenBrainContext(userId, token, inventory, profile);
  const brainBlock = formatKitchenBrainContextForPrompt(brainCtx);
  const memory_block = [lastMealBlock(profile), brainBlock].filter(Boolean).join('\n');

  let ledger_hint = '';
  const evidence: string[] = [...brainCtx.evidence];
  if (domain === 'meal_plan' || domain === 'suggestion' || domain === 'chat') {
    const ledger = await getRecentLedger(userId, token, 'meal_plan', 10);
    const processed = processLedgerOutcomes(ledger, 'meal_plan');
    ledger_hint = formatRejectHistoryForAssistant(processed);
    if (processed.prefers_tags.length) {
      ledger_hint += `\nPrefer: ${processed.prefers_tags.join(', ')}.`;
    }
    if (processed.avoids_tags.length) {
      ledger_hint += `\nAvoid: ${processed.avoids_tags.join(', ')}.`;
    }
    if (processed.kept_meals.length) evidence.push(`kept:${processed.kept_meals[0]}`);
    if (processed.replaced_meals.length) evidence.push(`replaced:${processed.replaced_meals[0]}`);
  }

  if (expiring.length) evidence.push(`expiring:${expiring[0].name}`);
  if (memory_block) evidence.push('memory:last_meal');

  return {
    pantry_summary: formatInventorySummary(inventory),
    expiring_block,
    memory_block,
    ledger_hint,
    expert_ids,
    evidence,
  };
}

export function formatClaraContextForPrompt(ctx: ClaraContextBundle): string {
  const parts = [
    ctx.pantry_summary ? `Pantry: ${ctx.pantry_summary}` : '',
    ctx.expiring_block,
    ctx.memory_block,
    ctx.ledger_hint,
  ].filter(Boolean);
  return parts.join('\n');
}
