/**
 * Brain 4.0 — Graph-first cook log ingredient inference (0 credits when confident).
 */

import type { InventoryItem } from '../../../../src/types/index.js';
import { resolveWizardKnowledgeIdSimple } from '../../../../src/types/knowledgeIdCore.js';
import type { CookInferResult } from '../../../../src/types/kitchenPredictions.js';
import { matchDishByDescription } from './dishMatcher.js';

interface MealTemplate {
  keywords: RegExp[];
  items: { name: string; quantity: number; unit: string }[];
}

const MEAL_TEMPLATES: MealTemplate[] = [
  {
    keywords: [/grilled\s+cheese/i, /\bgrilled cheese sandwich\b/i],
    items: [
      { name: 'Bread', quantity: 2, unit: 'slices' },
      { name: 'Cheese', quantity: 2, unit: 'slices' },
      { name: 'Butter', quantity: 1, unit: 'tbsp' },
    ],
  },
  {
    keywords: [/scrambled\s+eggs?/i, /\beggs?\s+scrambled\b/i],
    items: [
      { name: 'Eggs', quantity: 2, unit: 'each' },
      { name: 'Butter', quantity: 1, unit: 'tbsp' },
    ],
  },
  {
    keywords: [/\bpasta\b/i, /\bspaghetti\b/i, /\bpenne\b/i],
    items: [
      { name: 'Pasta', quantity: 8, unit: 'oz' },
      { name: 'Tomato sauce', quantity: 1, unit: 'cup' },
    ],
  },
  {
    keywords: [/\bpb&?j\b/i, /peanut butter.*jelly/i, /peanut butter and jelly/i],
    items: [
      { name: 'Bread', quantity: 2, unit: 'slices' },
      { name: 'Peanut butter', quantity: 2, unit: 'tbsp' },
      { name: 'Jelly', quantity: 1, unit: 'tbsp' },
    ],
  },
  {
    keywords: [/\bsalad\b/i],
    items: [
      { name: 'Lettuce', quantity: 2, unit: 'cups' },
      { name: 'Tomato', quantity: 1, unit: 'each' },
    ],
  },
  {
    keywords: [/\btacos?\b/i],
    items: [
      { name: 'Tortillas', quantity: 4, unit: 'each' },
      { name: 'Ground beef', quantity: 1, unit: 'lb' },
    ],
  },
  {
    keywords: [/\bchicken\s+rice\b/i, /\bchicken and rice\b/i],
    items: [
      { name: 'Chicken', quantity: 1, unit: 'lb' },
      { name: 'Rice', quantity: 1, unit: 'cup' },
    ],
  },
  {
    keywords: [/\bfried\s+rice\b/i],
    items: [
      { name: 'Rice', quantity: 2, unit: 'cups' },
      { name: 'Eggs', quantity: 2, unit: 'each' },
      { name: 'Soy sauce', quantity: 2, unit: 'tbsp' },
    ],
  },
];

function matchInventoryName(inventory: InventoryItem[], canonical: string): string {
  const lower = canonical.toLowerCase();
  for (const item of inventory) {
    const name = item.name.toLowerCase();
    if (name === lower || name.includes(lower) || lower.includes(name)) return item.name;
  }
  return canonical;
}

function mapToPantry(
  templateItems: { name: string; quantity: number; unit: string }[],
  inventory: InventoryItem[],
): { name: string; quantity: number; unit: string }[] {
  return templateItems.map((t) => ({
    name: matchInventoryName(inventory, t.name),
    quantity: t.quantity,
    unit: t.unit,
  }));
}

function scoreInventoryOverlap(
  items: { name: string }[],
  inventory: InventoryItem[],
): number {
  if (!inventory.length) return 0;
  let hits = 0;
  for (const item of items) {
    const lower = item.name.toLowerCase();
    if (inventory.some((i) => {
      const n = i.name.toLowerCase();
      return n === lower || n.includes(lower) || lower.includes(n);
    })) hits++;
  }
  return hits / items.length;
}

/** Extract ingredient-like tokens mentioned in the meal description */
function extractMentionedIngredients(
  description: string,
  inventory: InventoryItem[],
): { name: string; quantity: number; unit: string }[] {
  const lower = description.toLowerCase();
  const found: { name: string; quantity: number; unit: string }[] = [];
  const seen = new Set<string>();

  for (const item of inventory) {
    const name = item.name.toLowerCase();
    if (name.length < 3) continue;
    if (lower.includes(name) && !seen.has(name)) {
      seen.add(name);
      found.push({
        name: item.name,
        quantity: Math.min(Number(item.quantity) || 1, 2),
        unit: item.unit || 'each',
      });
    }
  }

  for (const word of lower.split(/\W+/)) {
    if (word.length < 4) continue;
    const kid = resolveWizardKnowledgeIdSimple(word);
    if (!kid.startsWith('ingredient.')) continue;
    const inv = inventory.find((i) => i.name.toLowerCase().includes(word));
    if (inv && !seen.has(inv.name.toLowerCase())) {
      seen.add(inv.name.toLowerCase());
      found.push({ name: inv.name, quantity: 1, unit: inv.unit || 'each' });
    }
  }

  return found.slice(0, 8);
}

export function inferCookLogIngredients(
  mealDescription: string,
  inventory: InventoryItem[],
): CookInferResult {
  const trimmed = mealDescription.trim();
  if (!trimmed) {
    return {
      reply: 'Tell me what you cooked and I will suggest ingredients to deduct.',
      suggested_items: [],
      confidence: 0,
      source: 'graph',
      credit_cost: 0,
    };
  }

  const dishHit = matchDishByDescription(trimmed, inventory);
  if (dishHit && dishHit.confidence >= 0.65) {
    const mapped = mapToPantry(
      dishHit.dish.ingredients.map((i) => ({ name: i.name, quantity: i.quantity, unit: i.unit })),
      inventory,
    );
    return {
      reply: `Matched "${dishHit.dish.title}" from the recipe library. Confirm these pantry deductions:`,
      suggested_items: mapped,
      confidence: dishHit.confidence,
      source: 'template',
      credit_cost: 0,
    };
  }

  for (const template of MEAL_TEMPLATES) {
    if (!template.keywords.some((re) => re.test(trimmed))) continue;
    const mapped = mapToPantry(template.items, inventory);
    const overlap = scoreInventoryOverlap(mapped, inventory);
    const confidence = 0.55 + overlap * 0.4;
    if (confidence >= 0.7) {
      return {
        reply: `Looks like ${trimmed} — I matched a known pattern. Confirm these pantry deductions:`,
        suggested_items: mapped,
        confidence,
        source: 'template',
        credit_cost: 0,
      };
    }
  }

  const mentioned = extractMentionedIngredients(trimmed, inventory);
  if (mentioned.length >= 2) {
    return {
      reply: `I found ${mentioned.length} pantry items mentioned in "${trimmed}". Confirm or adjust:`,
      suggested_items: mentioned,
      confidence: 0.72,
      source: 'inventory',
      credit_cost: 0,
    };
  }

  if (mentioned.length === 1) {
    return {
      reply: `I spotted ${mentioned[0].name} in your pantry for this meal. Add anything I missed:`,
      suggested_items: mentioned,
      confidence: 0.55,
      source: 'inventory',
      credit_cost: 0,
    };
  }

  return {
    reply: '',
    suggested_items: [],
    confidence: 0.2,
    source: 'graph',
    credit_cost: 0,
  };
}
