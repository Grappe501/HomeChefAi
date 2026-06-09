/**
 * Deterministic ingredient trivia for meal cards — grounded in knowledge graph when possible.
 */

import type { InventoryItem, PlannedMeal } from '../../../../src/types/index.js';
import type { KnowledgeNode } from '../../../../src/types/knowledge.js';
import { getKnowledgeNode } from './knowledgeLoader.js';
import { resolveIngredientKnowledgeId } from '../inventoryContext.js';

const CURATED: Record<string, string[]> = {
  quinoa: [
    'Quinoa isn\'t a grain — it\'s a seed. NASA studied it as a space crop because it\'s protein-dense.',
    'Rinse quinoa before cooking unless the package says pre-washed — saponins can taste soapy.',
  ],
  'black bean': [
    'Black beans are also called turtle beans — same legume, different nickname.',
    'A cup of cooked black beans packs about 15g of fiber. Your gut sends thanks.',
  ],
  'bbq sauce': [
    'Most BBQ sauces are Kansas City sweet, Carolina vinegar, or Texas bold — this meal leans bowl, not pit.',
    'BBQ sauce often starts with ketchup, vinegar, and molasses — three pantry MVPs in one bottle.',
  ],
  rice: [
    'White rice has been cultivated for roughly 8,000 years — still undefeated as a blank canvas.',
  ],
  garlic: [
    'Crushing garlic releases allicin — that\'s the sharp bite. Mince early, cook gently for sweetness.',
  ],
  chicken: [
    'Dark meat stays juicier than breast because it has more fat and collagen — science, not opinion.',
  ],
};

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function triviaFromNode(node: KnowledgeNode, ingredientName: string): string | null {
  const attrs = node.attributes ?? {};
  const name = node.display_name || ingredientName;

  const regional = attrs.regional_uses as string[] | undefined;
  if (regional?.[0]) {
    return `Did you know? ${name} is classic in ${regional[0].toLowerCase()}.`;
  }

  const micro = attrs.micro_lesson as string | undefined;
  if (micro) {
    return `Chef note: ${micro}`;
  }

  const compounds = attrs.flavor_compounds as string[] | undefined;
  if (compounds?.[0]) {
    return `Trivia: ${name} owes part of its flavor to ${compounds[0]} — chemistry you can taste.`;
  }

  const pairings = attrs.pairings as string[] | undefined;
  if (pairings?.[0]) {
    const partner = getKnowledgeNode(pairings[0]);
    if (partner) {
      return `Fun fact: ${name} and ${partner.display_name} are a classic pairing in the graph.`;
    }
  }

  const cuisines = attrs.cuisine_tags as string[] | undefined;
  if (cuisines?.[0]) {
    return `Did you know? ${name} shows up constantly in ${cuisines[0]} home cooking.`;
  }

  return null;
}

function curatedTrivia(ingredientName: string, mealName: string): string | null {
  const lower = ingredientName.toLowerCase();
  for (const [key, lines] of Object.entries(CURATED)) {
    if (lower.includes(key)) {
      return lines[hashString(mealName + key) % lines.length];
    }
  }
  return null;
}

function fallbackTrivia(meal: PlannedMeal): string {
  const name = meal.name.toLowerCase();
  if (name.includes('leftover')) {
    return 'Chef note: Repurposing dinner into lunch is how restaurants stay profitable — you\'re running a pro kitchen.';
  }
  if (name.includes('bowl')) {
    return 'Trivia: Bowl meals became a thing because everything tastes better when the fork path is shorter.';
  }
  if (name.includes('casserole')) {
    return 'Did you know? "Casserole" comes from the French word for saucepan — one dish, zero drama.';
  }
  return 'Chef note: The best meal is the one that matches what\'s actually in your pantry tonight.';
}

/** One small-print trivia line per meal — deterministic for the same meal name. */
export function buildIngredientTrivia(meal: PlannedMeal, inventory: InventoryItem[]): string {
  const resolved = meal.ingredients.map((ing) => {
    const knowledgeId = resolveIngredientKnowledgeId(ing.name, inventory);
    const node = knowledgeId ? getKnowledgeNode(knowledgeId) : null;
    return { ing, node };
  });

  const withNode = resolved.filter((r) => r.node);
  const pool = withNode.length ? withNode : resolved;

  const pick = pool[hashString(meal.name) % pool.length];
  const ingredientName = pick.ing.name;

  if (pick.node) {
    const fromNode = triviaFromNode(pick.node, ingredientName);
    if (fromNode) return fromNode;
  }

  const curated = curatedTrivia(ingredientName, meal.name);
  if (curated) return curated;

  return fallbackTrivia(meal);
}
