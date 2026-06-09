/**
 * Local food + grocery sourcing context for Clara — ties profile prefs to knowledge graph.
 */

import type { Profile } from '../../../../src/types/index.js';
import type { LocalFoodPreference } from '../../../../src/types/platform.js';
import { getKnowledgeNode, listKnowledgeNodes, searchKnowledge } from './knowledgeLoader.js';

const PREF_TO_SOURCE: Partial<Record<LocalFoodPreference, string>> = {
  farmers_market: 'food_source.farmers_market',
  local_butcher: 'food_source.local_butcher',
  grow_garden: 'food_source.home_garden',
  seasonal_produce: 'food_source.seasonal_produce',
  local_dairy: 'food_source.local_dairy',
  community_supported_ag: 'food_source.csa',
};

const STORE_ALIASES: Record<string, string> = {
  walmart: 'food_source.walmart',
  kroger: 'food_source.kroger',
  costco: 'food_source.costco',
  target: 'food_source.target',
  'whole foods': 'food_source.whole_foods',
  wholefoods: 'food_source.whole_foods',
  "trader joe's": 'food_source.trader_joes',
  'trader joes': 'food_source.trader_joes',
  aldi: 'food_source.aldi',
  publix: 'food_source.publix',
  'h-e-b': 'food_source.heb',
  heb: 'food_source.heb',
  safeway: 'food_source.safeway',
  albertsons: 'food_source.safeway',
  wegmans: 'food_source.wegmans',
  sprouts: 'food_source.sprouts',
};

function formatFoodSource(id: string): string | null {
  const node = getKnowledgeNode(id);
  if (!node) return null;
  const tips = (node.attributes?.shopping_tips as string[] | undefined) ?? [];
  const seasonal = node.attributes?.seasonal_notes as string | undefined;
  const parts = [node.display_name, node.description?.slice(0, 120)];
  if (tips[0]) parts.push(tips[0]);
  if (seasonal) parts.push(seasonal.slice(0, 100));
  return parts.filter(Boolean).join(' — ');
}

export function resolvePreferredStoreId(storeName: string): string | null {
  const lower = storeName.toLowerCase().trim();
  if (!lower) return null;
  for (const [alias, id] of Object.entries(STORE_ALIASES)) {
    if (lower.includes(alias)) return id;
  }
  const hit = searchKnowledge(lower, 'food_source', 1)[0];
  return hit?.id ?? null;
}

export function buildLocalFoodContext(profile: Profile): { text: string; evidence: string[] } {
  const parts: string[] = [];
  const evidence: string[] = [];

  const store = profile.preferred_store?.trim();
  if (store) {
    const storeId = resolvePreferredStoreId(store);
    if (storeId) {
      const formatted = formatFoodSource(storeId);
      if (formatted) {
        parts.push(`Preferred store (${store}): ${formatted}`);
        evidence.push(storeId);
      }
    } else {
      parts.push(`Preferred store: ${store} — set a known chain in profile for aisle-specific tips.`);
    }
  }

  const prefs = profile.culinary_profile?.local_food ?? [];
  for (const pref of prefs) {
    const sourceId = PREF_TO_SOURCE[pref];
    if (!sourceId) continue;
    const formatted = formatFoodSource(sourceId);
    if (formatted) {
      parts.push(formatted);
      evidence.push(sourceId);
    }
  }

  if (prefs.includes('seasonal_produce') || prefs.includes('farmers_market')) {
    const seasonal = formatFoodSource('food_source.seasonal_produce');
    if (seasonal && !evidence.includes('food_source.seasonal_produce')) {
      parts.push(seasonal);
      evidence.push('food_source.seasonal_produce');
    }
  }

  if (!parts.length) {
    const defaults = listKnowledgeNodes('food_source').slice(0, 2);
    for (const n of defaults) {
      const tip = (n.attributes?.shopping_tips as string[] | undefined)?.[0];
      if (tip) parts.push(`${n.display_name}: ${tip}`);
    }
  }

  return {
    text: parts.length ? `Local sourcing: ${parts.join(' | ')}` : '',
    evidence,
  };
}

export function lookupSourcingFromMessage(message: string): { text: string; evidence: string[] } {
  const m = message.toLowerCase();
  const parts: string[] = [];
  const evidence: string[] = [];

  for (const [alias, id] of Object.entries(STORE_ALIASES)) {
    if (m.includes(alias)) {
      const formatted = formatFoodSource(id);
      if (formatted) {
        parts.push(formatted);
        evidence.push(id);
      }
    }
  }

  const localTerms: { term: string; id: string }[] = [
    { term: 'farmers market', id: 'food_source.farmers_market' },
    { term: "farmers' market", id: 'food_source.farmers_market' },
    { term: 'csa', id: 'food_source.csa' },
    { term: 'butcher', id: 'food_source.local_butcher' },
    { term: 'fish monger', id: 'food_source.fish_monger' },
    { term: 'u-pick', id: 'food_source.u_pick' },
    { term: 'co-op', id: 'food_source.food_coop' },
    { term: 'garden', id: 'food_source.home_garden' },
  ];

  for (const { term, id } of localTerms) {
    if (m.includes(term)) {
      const formatted = formatFoodSource(id);
      if (formatted && !evidence.includes(id)) {
        parts.push(formatted);
        evidence.push(id);
      }
    }
  }

  if (/\b(grocery|shop|store|market|where to buy|shopping)\b/i.test(message) && !parts.length) {
    for (const hit of searchKnowledge(message.replace(/\b(where|buy|find|get)\b/gi, '').trim(), 'food_source', 3)) {
      const formatted = formatFoodSource(hit.id);
      if (formatted) {
        parts.push(formatted);
        evidence.push(hit.id);
      }
    }
  }

  return {
    text: parts.length ? `Sourcing: ${parts.join(' | ')}` : '',
    evidence,
  };
}
