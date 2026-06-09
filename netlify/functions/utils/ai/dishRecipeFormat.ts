/**
 * Format structured dish recipes from the knowledge corpus for Clara (0 credits).
 */

import { getKnowledgeNode } from './knowledgeLoader.js';
import { getDishFromCatalog } from './dishCatalog.js';
import {
  dishIngredientsFromNode,
  dishStepsFromNode,
} from '../../../../src/types/dish.js';

export function formatDishRecipeReply(dishId: string): { reply: string; evidence: string[] } | null {
  const node = getDishFromCatalog(dishId) ?? getKnowledgeNode(dishId);
  if (!node || node.type !== 'dish') return null;

  const attrs = node.attributes ?? {};
  const ingredients = dishIngredientsFromNode(attrs);
  const steps = dishStepsFromNode(attrs);
  const prep = Number(attrs.prep_time_minutes ?? 30);
  const cuisine = String(attrs.cuisine_id ?? '').replace(/^cuisine\./, '');

  const ingLines = ingredients.map((i) => `• ${i.quantity} ${i.unit} ${i.name}`).join('\n');
  const stepLines = steps.map((s, i) => `${i + 1}. ${s}`).join('\n');

  const reply = [
    `**${node.display_name}** (~${prep} min${cuisine ? ` · ${cuisine}` : ''})`,
    node.description ?? '',
    '',
    '**Ingredients**',
    ingLines || 'Use pantry staples you have on hand.',
    '',
    '**Steps**',
    stepLines || 'Prep, cook, and season to taste.',
    '',
    'Want a full week built around this? Say "plan my week starting with this recipe."',
  ]
    .filter(Boolean)
    .join('\n');

  return {
    reply,
    evidence: [dishId, ...(attrs.required_staples as string[] | undefined)?.slice(0, 3) ?? []],
  };
}

export function parseDishRecipeRequest(message: string): string | null {
  const trimmed = message.trim();
  const direct = trimmed.match(/^recipe:(dish\.[^\s]+)/i);
  if (direct) return direct[1];
  const inline = trimmed.match(/\bdish\.[a-z0-9_.]+\b/i);
  if (inline && /\b(recipe|steps|how to make|show me)\b/i.test(trimmed)) return inline[0];
  return null;
}
