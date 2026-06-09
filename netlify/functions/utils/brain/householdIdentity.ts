/**
 * Household identity inference — "This kitchen leans Cajun comfort"
 */

import type { KitchenIdentity } from '../../../../src/types/platform.js';
import type { InferredCookingStyle, HouseholdGraphEdge } from '../../../../src/types/householdGraph.js';
import type { DetectedPattern } from '../../../../src/types/householdGraph.js';
import { listKnowledgeNodes } from '../ai/knowledgeLoader.js';

const STYLE_LABELS: Record<string, string> = {
  cajun: 'Cajun / Creole',
  southern: 'Southern comfort',
  comfort: 'Comfort food',
  italian: 'Italian home cooking',
  mexican: 'Mexican',
  asian: 'Asian-inspired',
  bbq: 'BBQ & smoked',
  mediterranean: 'Mediterranean',
  indian: 'Indian',
  tex_mex: 'Tex-Mex',
};

export function inferHouseholdIdentity(input: {
  cuisinePreferences: string[];
  graphEdges: HouseholdGraphEdge[];
  patterns: DetectedPattern[];
  ledgerKeptCount: number;
}): { kitchen_identity: KitchenIdentity; inferred_cooking_style: InferredCookingStyle } {
  const scores = new Map<string, number>();
  const evidence: string[] = [];

  for (const pref of input.cuisinePreferences) {
    const tag = pref.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    scores.set(tag, (scores.get(tag) ?? 0) + 2);
    evidence.push(`profile:cuisine:${tag}`);
  }

  for (const edge of input.graphEdges.filter((e) => e.edge_type === 'PREFERS')) {
    const tag = edge.to_key;
    scores.set(tag, (scores.get(tag) ?? 0) + edge.weight);
    evidence.push(...edge.evidence.slice(0, 1));
  }

  for (const edge of input.graphEdges.filter((e) => e.edge_type === 'COOKED')) {
    const meal = edge.to_key;
    for (const [tag, keywords] of Object.entries(CUISINE_KEYWORDS)) {
      if (keywords.some((kw) => meal.includes(kw))) {
        scores.set(tag, (scores.get(tag) ?? 0) + edge.weight * 0.5);
      }
    }
  }

  const sorted = [...scores.entries()].sort((a, b) => b[1] - a[1]);
  const primary = sorted[0];
  const secondary = sorted[1];

  const primaryTag = primary?.[0] ?? 'comfort';
  const primaryLabel = STYLE_LABELS[primaryTag] ?? formatTag(primaryTag);
  const secondaryLabel = secondary ? (STYLE_LABELS[secondary[0]] ?? formatTag(secondary[0])) : undefined;

  const staplePatterns = input.patterns.filter((p) => p.type === 'staple_identity');
  const leftoverPattern = input.patterns.find((p) => p.type === 'leftover_frequency');

  let summaryLabel = primaryLabel;
  if (secondaryLabel && (primary?.[1] ?? 0) - (secondary?.[1] ?? 0) < 1.5) {
    summaryLabel = `${primaryLabel} with ${secondaryLabel.toLowerCase()} touches`;
  } else if (leftoverPattern) {
    summaryLabel = `${primaryLabel} · batch-cook friendly`;
  }

  const confidence = Math.min(0.95, 0.45 + (primary?.[1] ?? 0) * 0.08 + (input.ledgerKeptCount > 0 ? 0.05 : 0));

  const cuisineNodes = listKnowledgeNodes('cuisine');
  const computedArchetypes = sorted.slice(0, 4).map(([id, weight]) => {
    const node = cuisineNodes.find((c) => c.id.includes(id));
    return { id: node?.id ?? `cuisine.${id}`, weight: Math.round(weight * 10) / 10 };
  });

  const kitchen_identity: KitchenIdentity = {
    cooking_styles: sorted.slice(0, 3).map(([tag]) => STYLE_LABELS[tag] ?? formatTag(tag)),
    computed_archetypes: computedArchetypes,
    storage_habits: leftoverPattern ? ['leftover_forward'] : undefined,
  };

  if (staplePatterns.length) {
    evidence.push(...staplePatterns.slice(0, 2).flatMap((p) => p.evidence.slice(0, 1)));
  }

  const inferred_cooking_style: InferredCookingStyle = {
    primary_label: summaryLabel,
    secondary_label: secondaryLabel,
    cuisine_tags: sorted.slice(0, 3).map(([t]) => t),
    confidence: Math.round(confidence * 100) / 100,
    evidence: [...new Set(evidence)].slice(0, 8),
    updated_at: new Date().toISOString(),
  };

  return { kitchen_identity, inferred_cooking_style };
}

const CUISINE_KEYWORDS: Record<string, string[]> = {
  cajun: ['cajun', 'jambalaya', 'gumbo', 'etouffee', 'creole'],
  southern: ['southern', 'biscuit', 'grits', 'fried'],
  comfort: ['mac', 'meatloaf', 'casserole', 'mashed'],
  italian: ['pasta', 'risotto', 'marinara', 'parmesan'],
  mexican: ['taco', 'burrito', 'salsa', 'tortilla'],
  bbq: ['bbq', 'barbecue', 'smoked', 'brisket'],
  asian: ['stir', 'rice bowl', 'soy', 'noodle'],
};

function formatTag(tag: string): string {
  return tag.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
