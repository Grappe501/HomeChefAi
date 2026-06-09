/**
 * Household suggestions — Brain 2.0 patterns + orchestrator (Phase 5)
 */

import type { Handler } from '@netlify/functions';
import { withCors, jsonResponse, errorResponse, requireAuth } from './utils/response.js';
import { useDevStore, loadStore } from './utils/db.js';
import { getSupabaseUserClient } from './utils/supabase.js';
import { buildHouseholdGraph } from './utils/ai/graphWriter.js';
import { detectHouseholdPatterns } from './utils/brain/patternDetectors.js';
import { getRecentLedgerDevStore, getRecentLedgerSupabase } from './utils/ai/ledgerStore.js';
import type { BrainContext } from './utils/brain/types.js';
import type { DecisionLedgerEntry } from './utils/ai/decisionLedger.js';

export interface HouseholdSuggestion {
  type: string;
  title: string;
  message: string;
  priority: number;
  evidence?: string[];
}

export const handler: Handler = withCors(async (event) => {
  const user = await requireAuth(event);
  if (!user) return errorResponse('Unauthorized', 401);

  if (event.httpMethod !== 'GET') return errorResponse('Method not allowed', 405);

  let ctx: BrainContext;
  let ledgerEntries: DecisionLedgerEntry[] = [];
  let inventory: { name: string; quantity: number; unit: string; knowledge_id?: string }[] = [];
  let memory: { meal?: string; date?: string } = {};
  let kitchenLabel: string | undefined;

  if (useDevStore()) {
    const store = loadStore();
    const profile = store.profiles.find((p) => p.user_id === user.id);
    memory = (profile?.last_meal_memory as typeof memory) || {};
    kitchenLabel = profile?.inferred_cooking_style?.primary_label;
    inventory = store.inventory_items
      .filter((i) => i.user_id === user.id)
      .map((i) => ({ name: i.name, quantity: Number(i.quantity), unit: i.unit, knowledge_id: i.knowledge_id }));

    ctx = {
      userId: user.id,
      householdId: profile?.household_id,
      receipts: store.receipts.filter((r) => r.user_id === user.id && r.verified).map((r) => ({
        id: r.id,
        verified: r.verified,
        created_at: r.created_at ?? '',
        items: (r.raw_parse as { items?: { name: string }[] })?.items ?? [],
      })),
      usageLogs: store.usage_logs.filter((l) => l.user_id === user.id).map((l) => ({
        id: l.id,
        meal_name: l.meal_name,
        items_used: l.items_used,
        created_at: l.created_at ?? '',
      })),
      wasteEvents: store.waste_events ?? [],
      cuisinePreferences: profile?.cuisine_preferences ?? [],
    };
    ledgerEntries = getRecentLedgerDevStore(store as never, user.id, undefined, 30);
  } else if (user.token) {
    const db = getSupabaseUserClient(user.token);
    const { data: profile } = await db.from('profiles').select('*').eq('user_id', user.id).single();
    memory = (profile?.last_meal_memory as typeof memory) || {};
    kitchenLabel = (profile?.inferred_cooking_style as { primary_label?: string })?.primary_label;
    const { data: items } = await db.from('inventory_items').select('name, quantity, unit, knowledge_id').eq('user_id', user.id);
    inventory = (items ?? []).map((i) => ({ name: i.name, quantity: Number(i.quantity), unit: i.unit, knowledge_id: i.knowledge_id ?? undefined }));

    const { data: receipts } = await db.from('receipts').select('id, verified, created_at, raw_parse').eq('user_id', user.id).eq('verified', true);
    const { data: logs } = await db.from('usage_logs').select('id, meal_name, items_used, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(30);
    ledgerEntries = await getRecentLedgerSupabase(db, user.id, undefined, 30);

    ctx = {
      userId: user.id,
      householdId: profile?.household_id,
      receipts: (receipts ?? []).map((r) => ({
        id: r.id,
        verified: r.verified,
        created_at: r.created_at,
        items: (r.raw_parse as { items?: { name: string }[] })?.items ?? [],
      })),
      usageLogs: logs ?? [],
      wasteEvents: [],
      cuisinePreferences: (profile?.cuisine_preferences as string[]) ?? [],
    };
  } else {
    return errorResponse('Missing token', 401);
  }

  const graphEdges = buildHouseholdGraph({
    userId: user.id,
    householdId: ctx.householdId,
    receipts: ctx.receipts,
    usageLogs: ctx.usageLogs,
    ledgerEntries,
    inventory,
    cuisinePreferences: ctx.cuisinePreferences,
  });

  const patterns = detectHouseholdPatterns({ ...ctx, graphEdges, ledgerEntries, inventory });
  const suggestions = buildSuggestionsFromPatterns(inventory, memory, ctx.usageLogs, patterns, kitchenLabel);

  return jsonResponse({ suggestions, kitchen_identity_label: kitchenLabel });
});

function buildSuggestionsFromPatterns(
  inventory: { name: string; quantity: number; unit: string }[],
  memory: { meal?: string; date?: string },
  logs: { meal_name?: string; created_at?: string }[],
  patterns: ReturnType<typeof detectHouseholdPatterns>,
  kitchenLabel?: string,
): HouseholdSuggestion[] {
  const out: HouseholdSuggestion[] = [];
  const names = inventory.map((i) => i.name.toLowerCase());

  if (kitchenLabel) {
    out.push({
      type: 'identity',
      title: 'Your kitchen style',
      message: `Clara reads this kitchen as ${kitchenLabel}. I'll steer suggestions that way.`,
      priority: 8,
    });
  }

  for (const p of patterns) {
    out.push({
      type: p.type,
      title: p.headline,
      message: p.action_prompt ?? p.insight,
      priority: Math.round(p.confidence * 12),
      evidence: p.evidence,
    });
  }

  const buyNeverUse = patterns.find((p) => p.type === 'buy_never_use');
  if (buyNeverUse && inventory.length > 0) {
    out.push({
      type: 'pantry_challenge',
      title: 'Use what you bought',
      message: buyNeverUse.action_prompt ?? buyNeverUse.insight,
      priority: 9,
      evidence: buyNeverUse.evidence,
    });
  }

  const tradition = patterns.find((p) => p.type === 'emerging_tradition');
  if (tradition) {
    out.push({
      type: 'tradition',
      title: tradition.headline,
      message: `Want ${tradition.headline.split('—')[0].trim()} again this week?`,
      priority: 7,
      evidence: tradition.evidence,
    });
  }

  if (memory.meal) {
    out.push({
      type: 'repeat',
      title: `Loved ${memory.meal}?`,
      message: `Last time you cooked ${memory.meal}. Want something similar tonight?`,
      priority: 3,
    });
  }

  const has = (...keywords: string[]) => keywords.some((k) => names.some((n) => n.includes(k)));
  if (has('chicken') && has('bbq', 'barbecue', 'sauce')) {
    const lastBbq = logs.find((l) => l.meal_name?.toLowerCase().includes('bbq'));
    const daysSince = lastBbq?.created_at
      ? Math.floor((Date.now() - new Date(lastBbq.created_at).getTime()) / 86400000)
      : 999;
    if (daysSince > 14) {
      out.push({
        type: 'memory',
        title: 'BBQ night?',
        message: `You haven't had barbecue in ${daysSince > 60 ? 'a while' : `${daysSince} days`} — you've got chicken and sauce ready.`,
        priority: 10,
      });
    }
  }

  if (inventory.length === 0) {
    out.push({
      type: 'onboard',
      title: 'Start your pantry',
      message: 'Scan your first grocery receipt — takes 30 seconds.',
      priority: 20,
    });
  }

  const seen = new Set<string>();
  return out
    .filter((s) => {
      const key = s.title;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 6);
}
