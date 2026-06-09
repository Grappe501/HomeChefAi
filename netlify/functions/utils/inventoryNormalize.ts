/**
 * Normalize pantry/receipt scan rows before inventory insert.
 */

import { searchKnowledge } from './ai/knowledgeLoader.js';
import { resolveWizardKnowledgeIdSimple } from '../../../src/types/knowledgeIdCore.js';

const VALID_CATEGORIES = new Set([
  'produce', 'dairy', 'meat', 'pantry', 'frozen', 'beverage', 'other', 'spice',
]);
const VALID_LOCATIONS = new Set(['pantry', 'fridge', 'freezer']);

const GENERIC_UNITS = new Set([
  'unit', 'units', 'item', 'items', 'count', 'piece', 'pieces', 'container', 'containers',
]);

const UNIT_ALIASES: Record<string, string> = {
  lbs: 'lb',
  pound: 'lb',
  pounds: 'lb',
  ounces: 'oz',
  ounce: 'oz',
  gallons: 'gallon',
  gal: 'gallon',
  dozen: 'dozen',
  cans: 'can',
  bottles: 'bottle',
  bags: 'bag',
  boxes: 'box',
  jars: 'jar',
  tbsp: 'tbsp',
  tsp: 'tsp',
  cups: 'cup',
  cup: 'cup',
};

export function sanitizeExpirationDate(value: unknown): string | null {
  if (value == null || value === '' || value === 'null' || value === 'undefined') return null;
  const s = String(value).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y, m, d] = s.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
  return s;
}

export function normalizeInventoryName(name: string): string {
  const trimmed = name.trim().replace(/\s+/g, ' ');
  if (!trimmed) return 'Unknown item';
  return trimmed
    .split(' ')
    .map((w) => (w.length <= 2 && w === w.toUpperCase() ? w : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
    .join(' ');
}

export function inferInventoryUnit(name: string, rawUnit?: string): string {
  const lower = (rawUnit ?? '').toLowerCase().trim();
  if (lower && !GENERIC_UNITS.has(lower)) {
    return UNIT_ALIASES[lower] ?? lower;
  }

  const n = name.toLowerCase();
  if (/powder|spice|seasoning|paprika|cumin|oregano|basil|thyme|curry|chili|cinnamon|nutmeg|clove|allspice|turmeric|coriander|garlic powder|onion powder/.test(n)) {
    return 'jar';
  }
  if (/salt|pepper flakes|crushed red/.test(n)) return 'container';
  if (/milk|juice|cream|broth|stock|water|soda|tea|coffee/.test(n)) return 'bottle';
  if (/egg/.test(n)) return 'dozen';
  if (/butter|cheese|yogurt|sour cream/.test(n)) return 'each';
  if (/flour|sugar|rice|pasta|beans|lentils|oats|quinoa|cereal/.test(n)) return 'bag';
  if (/ground beef|chicken|pork|steak|fish|salmon|shrimp|bacon|sausage/.test(n)) return 'lb';
  if (/apple|banana|onion|tomato|potato|lemon|lime|avocado|pepper|carrot/.test(n)) return 'each';
  if (/can|soup|tomatoes|beans|tuna|corn/.test(n) && !/fresh/.test(n)) return 'can';

  return 'each';
}

export function normalizeCategory(category: unknown, name: string): string {
  const raw = String(category ?? 'other').toLowerCase().trim();
  if (VALID_CATEGORIES.has(raw)) return raw === 'spice' ? 'pantry' : raw;
  if (/powder|spice|seasoning|herb/.test(name.toLowerCase())) return 'pantry';
  return 'other';
}

export function normalizeLocation(location: unknown, name: string, category: string): 'pantry' | 'fridge' | 'freezer' {
  const raw = String(location ?? '').toLowerCase().trim();
  if (VALID_LOCATIONS.has(raw)) return raw as 'pantry' | 'fridge' | 'freezer';

  const n = name.toLowerCase();
  if (/frozen|ice cream|frozen/.test(n) || category === 'frozen') return 'freezer';
  if (/milk|egg|cheese|yogurt|butter|meat|chicken|fish|produce|lettuce|vegetable|fruit/.test(n) || category === 'dairy' || category === 'meat' || category === 'produce') {
    return 'fridge';
  }
  return 'pantry';
}

export function normalizeQuantity(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return 1;
  return Math.round(n * 100) / 100;
}

export function resolveKnowledgeId(name: string, existing?: string): string | undefined {
  if (existing && String(existing).startsWith('ingredient.')) return existing;
  const hits = searchKnowledge(name, 'ingredient', 2);
  if (hits[0]?.id) return hits[0].id;
  const resolved = resolveWizardKnowledgeIdSimple(name);
  return resolved.startsWith('ingredient.') ? resolved : undefined;
}

export interface NormalizedInventoryRow {
  name: string;
  category: string;
  quantity: number;
  unit: string;
  expiration_date: string | null;
  location: 'pantry' | 'fridge' | 'freezer';
  knowledge_id?: string;
  added_via: string;
  notes?: string;
}

export function normalizeScanItem(
  item: {
    name?: string;
    quantity?: number;
    unit?: string;
    category?: string;
    location?: string;
    knowledge_id?: string;
    suggested_expiration?: string | null;
    needs_expiration?: boolean;
  },
  addedVia: string,
): NormalizedInventoryRow {
  const name = normalizeInventoryName(item.name ?? 'Unknown item');
  const category = normalizeCategory(item.category, name);
  const unit = inferInventoryUnit(name, item.unit);
  const location = normalizeLocation(item.location, name, category);
  const expiration = sanitizeExpirationDate(item.suggested_expiration ?? (item as { expiration_date?: string }).expiration_date);

  return {
    name,
    category,
    quantity: normalizeQuantity(item.quantity),
    unit,
    expiration_date: expiration,
    location,
    knowledge_id: resolveKnowledgeId(name, item.knowledge_id),
    added_via: addedVia,
  };
}

export function formatQuantityLabel(quantity: number, unit: string, name?: string): string {
  const u = inferInventoryUnit(name ?? '', unit);
  const q = normalizeQuantity(quantity);
  if (q === 1 && ['jar', 'bag', 'box', 'bottle', 'can', 'dozen', 'gallon'].includes(u)) {
    return `1 ${u}`;
  }
  return `${q} ${u}`;
}
