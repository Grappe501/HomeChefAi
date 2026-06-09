/**
 * Deterministic expiration inference when scan/receipt has no date.
 */

import { sanitizeExpirationDate } from '../inventoryNormalize.js';

type Storage = 'pantry' | 'fridge' | 'freezer';

/** Approximate shelf life in days from purchase/today */
const SHELF_DAYS: { pattern: RegExp; fridge?: number; pantry?: number; freezer?: number }[] = [
  { pattern: /\bmilk\b/i, fridge: 7 },
  { pattern: /\begg/i, fridge: 21 },
  { pattern: /\bchicken|poultry\b/i, fridge: 2, freezer: 90 },
  { pattern: /\bground beef|beef\b/i, fridge: 3, freezer: 120 },
  { pattern: /\bpork\b/i, fridge: 3, freezer: 120 },
  { pattern: /\bfish|salmon|shrimp|seafood\b/i, fridge: 2, freezer: 90 },
  { pattern: /\bbacon\b/i, fridge: 7, freezer: 30 },
  { pattern: /\byogurt|sour cream\b/i, fridge: 14 },
  { pattern: /\bcheese\b/i, fridge: 21 },
  { pattern: /\bbutter\b/i, fridge: 30, freezer: 180 },
  { pattern: /\blettuce|spinach|salad|greens\b/i, fridge: 5 },
  { pattern: /\bberr(y|ies)|strawberr|blueberr|raspberr\b/i, fridge: 5 },
  { pattern: /\bbanana\b/i, pantry: 5 },
  { pattern: /\bavocado\b/i, pantry: 4 },
  { pattern: /\btomato|pepper|cucumber\b/i, fridge: 7 },
  { pattern: /\bonion|potato\b/i, pantry: 21 },
  { pattern: /\bbread\b/i, pantry: 5, freezer: 90 },
  { pattern: /\bdeli|lunch meat|ham\b/i, fridge: 5 },
  { pattern: /\bfresh herb|parsley|cilantro|basil\b/i, fridge: 5 },
];

function addDays(from: Date, days: number): string {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function predictExpirationDate(
  name: string,
  location: Storage = 'pantry',
  purchaseDate: Date = new Date(),
): string | null {
  const n = name.toLowerCase();
  for (const rule of SHELF_DAYS) {
    if (!rule.pattern.test(n)) continue;
    const days = rule[location] ?? rule.fridge ?? rule.pantry ?? rule.freezer;
    if (!days) continue;
    return sanitizeExpirationDate(addDays(purchaseDate, days));
  }

  if (location === 'fridge' && /\bproduce|meat|dairy\b/i.test(n)) {
    return sanitizeExpirationDate(addDays(purchaseDate, 7));
  }
  if (location === 'freezer') {
    return sanitizeExpirationDate(addDays(purchaseDate, 90));
  }
  return null;
}

export function shouldInferExpiration(name: string, needsExpiration?: boolean): boolean {
  if (needsExpiration) return true;
  const n = name.toLowerCase();
  return /\bmilk|egg|meat|chicken|fish|produce|lettuce|berry|cheese|yogurt|deli|fresh\b/i.test(n);
}
