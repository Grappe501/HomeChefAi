/** Client-side inventory unit labels — mirrors server normalize logic for display. */

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
  cans: 'can',
  bottles: 'bottle',
  bags: 'bag',
  boxes: 'box',
  jars: 'jar',
};

export function inferDisplayUnit(name: string, rawUnit?: string): string {
  const lower = (rawUnit ?? '').toLowerCase().trim();
  if (lower && !GENERIC_UNITS.has(lower)) {
    return UNIT_ALIASES[lower] ?? lower;
  }

  const n = name.toLowerCase();
  if (/powder|spice|seasoning|paprika|cumin|oregano|basil|thyme|curry|chili|cinnamon|nutmeg|clove|allspice|turmeric|coriander|garlic powder|onion powder/.test(n)) {
    return 'jar';
  }
  if (/salt|pepper flakes|crushed red/.test(n)) return 'container';
  if (/milk|juice|cream|broth|stock|water|soda/.test(n)) return 'bottle';
  if (/egg/.test(n)) return 'dozen';
  if (/flour|sugar|rice|pasta|beans|lentils|oats|quinoa|cereal/.test(n)) return 'bag';
  if (/ground beef|chicken|pork|steak|fish|salmon|shrimp|bacon|sausage/.test(n)) return 'lb';
  return 'each';
}

export function formatQuantityLabel(quantity: number, unit: string, name?: string): string {
  const u = inferDisplayUnit(name ?? '', unit);
  const q = Number(quantity) > 0 ? Number(quantity) : 1;
  if (q === 1 && ['jar', 'bag', 'box', 'bottle', 'can', 'dozen', 'gallon', 'container'].includes(u)) {
    return `1 ${u}`;
  }
  return `${q} ${u}`;
}

export const INVENTORY_UNITS = [
  'each', 'jar', 'container', 'bag', 'box', 'bottle', 'can', 'lb', 'oz', 'gallon', 'dozen', 'cup', 'tbsp', 'tsp',
] as const;
