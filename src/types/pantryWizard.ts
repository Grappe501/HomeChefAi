/**
 * Pantry Wizard — per-item unit config (Level 1 quick capture).
 * See develop_notes/PANTRY_WIZARD_UNITS_1_0.md for full audit.
 */

export type WizardUnitCategory = 'count' | 'weight' | 'package' | 'volume' | 'produce' | 'spice';

export interface WizardQuantityOption {
  /** User-facing tap label */
  label: string;
  quantity: number;
  /** Stored in inventory_items.unit */
  unit: string;
}

export interface WizardItemConfig {
  unitCategory: WizardUnitCategory;
  packageLabel: string;
  defaultUnit: string;
  inventoryUnit: string;
  level1Options: WizardQuantityOption[];
  /** Future L2 — optional subtypes (not shown in wizard yet) */
  subtypes?: string[];
}

function cans(max = 4): WizardQuantityOption[] {
  return [1, 2, 3, max].filter((v, i, a) => a.indexOf(v) === i).sort().map((n) => ({
    label: n === 1 ? '1 can' : `${n} cans`,
    quantity: n,
    unit: 'can',
  }));
}

function jars(max = 3): WizardQuantityOption[] {
  return [1, 2, max].filter((v, i, a) => a.indexOf(v) === i).sort().map((n) => ({
    label: n === 1 ? '1 jar' : `${n} jars`,
    quantity: n,
    unit: 'jar',
  }));
}

function boxes(max = 3): WizardQuantityOption[] {
  return [1, 2, max].map((n) => ({
    label: n === 1 ? '1 box' : `${n} boxes`,
    quantity: n,
    unit: 'box',
  }));
}

function lbBags(sizes: number[]): WizardQuantityOption[] {
  return sizes.map((lb) => ({
    label: lb === 1 ? '1 lb' : `${lb} lb bag`,
    quantity: lb,
    unit: 'lb',
  }));
}

function bottles(max = 2): WizardQuantityOption[] {
  return [1, 2].slice(0, max).map((n) => ({
    label: n === 1 ? '1 bottle' : `${n} bottles`,
    quantity: n,
    unit: 'bottle',
  }));
}

function bags(max = 2): WizardQuantityOption[] {
  return [1, 2].slice(0, max).map((n) => ({
    label: n === 1 ? '1 bag' : `${n} bags`,
    quantity: n,
    unit: 'bag',
  }));
}

function countOptions(counts: number[], unit = 'each'): WizardQuantityOption[] {
  return counts.map((n) => ({
    label: `${n}`,
    quantity: n,
    unit,
  }));
}

function heads(max = 3): WizardQuantityOption[] {
  return [1, 2, max].filter((v, i, a) => a.indexOf(v) === i).sort().map((n) => ({
    label: n === 1 ? '1 head' : `${n} heads`,
    quantity: n,
    unit: 'head',
  }));
}

const CANNED_VEG = cans();
const CANNED_FRUIT = cans(3);
const PASTA = boxes();
const RICE = lbBags([1, 2, 5, 10]);
const FLOUR_BAG = lbBags([2, 5, 10]);
const SUGAR_BAG = lbBags([4, 5, 10]);

export const WIZARD_ITEM_CONFIG: Record<string, WizardItemConfig> = {
  // — Canned Vegetables —
  'Sweet Peas': { unitCategory: 'count', packageLabel: 'can', defaultUnit: 'can', inventoryUnit: 'can', level1Options: CANNED_VEG },
  'Green Beans': { unitCategory: 'count', packageLabel: 'can', defaultUnit: 'can', inventoryUnit: 'can', level1Options: CANNED_VEG },
  Corn: { unitCategory: 'count', packageLabel: 'can', defaultUnit: 'can', inventoryUnit: 'can', level1Options: CANNED_VEG },
  'Diced Tomatoes': { unitCategory: 'count', packageLabel: 'can', defaultUnit: 'can', inventoryUnit: 'can', level1Options: CANNED_VEG },
  'Black Beans': { unitCategory: 'count', packageLabel: 'can', defaultUnit: 'can', inventoryUnit: 'can', level1Options: CANNED_VEG },
  'Kidney Beans': { unitCategory: 'count', packageLabel: 'can', defaultUnit: 'can', inventoryUnit: 'can', level1Options: CANNED_VEG },
  Chickpeas: { unitCategory: 'count', packageLabel: 'can', defaultUnit: 'can', inventoryUnit: 'can', level1Options: CANNED_VEG },
  'Mixed Vegetables': { unitCategory: 'count', packageLabel: 'can', defaultUnit: 'can', inventoryUnit: 'can', level1Options: CANNED_VEG },

  // — Canned Fruits —
  Peaches: { unitCategory: 'count', packageLabel: 'can', defaultUnit: 'can', inventoryUnit: 'can', level1Options: CANNED_FRUIT },
  Pears: { unitCategory: 'count', packageLabel: 'can', defaultUnit: 'can', inventoryUnit: 'can', level1Options: CANNED_FRUIT },
  Pineapple: { unitCategory: 'count', packageLabel: 'can', defaultUnit: 'can', inventoryUnit: 'can', level1Options: CANNED_FRUIT },
  'Fruit Cocktail': { unitCategory: 'count', packageLabel: 'can', defaultUnit: 'can', inventoryUnit: 'can', level1Options: CANNED_FRUIT },
  Applesauce: { unitCategory: 'count', packageLabel: 'jar', defaultUnit: 'jar', inventoryUnit: 'jar', level1Options: jars() },

  // — Grains & Pasta —
  'White Rice': { unitCategory: 'weight', packageLabel: 'bag', defaultUnit: 'lb', inventoryUnit: 'lb', level1Options: RICE },
  'Brown Rice': { unitCategory: 'weight', packageLabel: 'bag', defaultUnit: 'lb', inventoryUnit: 'lb', level1Options: RICE },
  Spaghetti: { unitCategory: 'package', packageLabel: 'box', defaultUnit: 'box', inventoryUnit: 'box', level1Options: PASTA },
  Penne: { unitCategory: 'package', packageLabel: 'box', defaultUnit: 'box', inventoryUnit: 'box', level1Options: PASTA },
  Macaroni: { unitCategory: 'package', packageLabel: 'box', defaultUnit: 'box', inventoryUnit: 'box', level1Options: PASTA },
  Oats: {
    unitCategory: 'weight',
    packageLabel: 'container',
    defaultUnit: 'oz',
    inventoryUnit: 'oz',
    level1Options: [
      { label: 'Small canister (18 oz)', quantity: 18, unit: 'oz' },
      { label: 'Large canister (42 oz)', quantity: 42, unit: 'oz' },
      { label: 'Bulk bag (2 lb)', quantity: 2, unit: 'lb' },
    ],
  },
  Flour: { unitCategory: 'weight', packageLabel: 'bag', defaultUnit: 'lb', inventoryUnit: 'lb', level1Options: FLOUR_BAG },
  'Bread Crumbs': {
    unitCategory: 'package',
    packageLabel: 'canister',
    defaultUnit: 'canister',
    inventoryUnit: 'canister',
    level1Options: [
      { label: '1 canister', quantity: 1, unit: 'canister' },
      { label: '2 canisters', quantity: 2, unit: 'canister' },
    ],
  },
  Quinoa: { unitCategory: 'weight', packageLabel: 'bag', defaultUnit: 'lb', inventoryUnit: 'lb', level1Options: lbBags([1, 2]) },

  // — Baking —
  Sugar: { unitCategory: 'weight', packageLabel: 'bag', defaultUnit: 'lb', inventoryUnit: 'lb', level1Options: SUGAR_BAG },
  'Brown Sugar': { unitCategory: 'weight', packageLabel: 'bag', defaultUnit: 'lb', inventoryUnit: 'lb', level1Options: lbBags([2, 4]) },
  'Baking Powder': {
    unitCategory: 'package',
    packageLabel: 'can',
    defaultUnit: 'can',
    inventoryUnit: 'can',
    level1Options: [
      { label: '1 can', quantity: 1, unit: 'can' },
      { label: '2 cans', quantity: 2, unit: 'can' },
    ],
  },
  'Baking Soda': {
    unitCategory: 'package',
    packageLabel: 'box',
    defaultUnit: 'box',
    inventoryUnit: 'box',
    level1Options: [
      { label: '1 box', quantity: 1, unit: 'box' },
      { label: '2 boxes', quantity: 2, unit: 'box' },
    ],
  },
  'Vanilla Extract': { unitCategory: 'volume', packageLabel: 'bottle', defaultUnit: 'bottle', inventoryUnit: 'bottle', level1Options: bottles() },
  'Chocolate Chips': { unitCategory: 'package', packageLabel: 'bag', defaultUnit: 'bag', inventoryUnit: 'bag', level1Options: bags() },
  'Cocoa Powder': {
    unitCategory: 'package',
    packageLabel: 'container',
    defaultUnit: 'container',
    inventoryUnit: 'container',
    level1Options: [
      { label: '1 container', quantity: 1, unit: 'container' },
      { label: '2 containers', quantity: 2, unit: 'container' },
    ],
  },

  // — Condiments & Sauces —
  Ketchup: { unitCategory: 'volume', packageLabel: 'bottle', defaultUnit: 'bottle', inventoryUnit: 'bottle', level1Options: bottles() },
  Mustard: { unitCategory: 'volume', packageLabel: 'bottle', defaultUnit: 'bottle', inventoryUnit: 'bottle', level1Options: bottles() },
  Mayonnaise: { unitCategory: 'volume', packageLabel: 'jar', defaultUnit: 'jar', inventoryUnit: 'jar', level1Options: jars(2) },
  'Soy Sauce': { unitCategory: 'volume', packageLabel: 'bottle', defaultUnit: 'bottle', inventoryUnit: 'bottle', level1Options: bottles() },
  'Hot Sauce': { unitCategory: 'volume', packageLabel: 'bottle', defaultUnit: 'bottle', inventoryUnit: 'bottle', level1Options: bottles() },
  'BBQ Sauce': { unitCategory: 'volume', packageLabel: 'bottle', defaultUnit: 'bottle', inventoryUnit: 'bottle', level1Options: bottles() },
  'Olive Oil': { unitCategory: 'volume', packageLabel: 'bottle', defaultUnit: 'bottle', inventoryUnit: 'bottle', level1Options: bottles() },
  'Vegetable Oil': { unitCategory: 'volume', packageLabel: 'bottle', defaultUnit: 'bottle', inventoryUnit: 'bottle', level1Options: bottles() },
  Vinegar: { unitCategory: 'volume', packageLabel: 'bottle', defaultUnit: 'bottle', inventoryUnit: 'bottle', level1Options: bottles() },

  // — Spices —
  Salt: {
    unitCategory: 'spice',
    packageLabel: 'container',
    defaultUnit: 'container',
    inventoryUnit: 'container',
    level1Options: [
      { label: '1 box', quantity: 1, unit: 'box' },
      { label: '1 container', quantity: 1, unit: 'container' },
    ],
  },
  'Black Pepper': { unitCategory: 'spice', packageLabel: 'jar', defaultUnit: 'jar', inventoryUnit: 'jar', level1Options: jars(2) },
  'Garlic Powder': { unitCategory: 'spice', packageLabel: 'jar', defaultUnit: 'jar', inventoryUnit: 'jar', level1Options: jars(2) },
  'Onion Powder': { unitCategory: 'spice', packageLabel: 'jar', defaultUnit: 'jar', inventoryUnit: 'jar', level1Options: jars(2) },
  Paprika: { unitCategory: 'spice', packageLabel: 'jar', defaultUnit: 'jar', inventoryUnit: 'jar', level1Options: jars(2) },
  Cumin: { unitCategory: 'spice', packageLabel: 'jar', defaultUnit: 'jar', inventoryUnit: 'jar', level1Options: jars(2) },
  Oregano: { unitCategory: 'spice', packageLabel: 'jar', defaultUnit: 'jar', inventoryUnit: 'jar', level1Options: jars(2) },
  Basil: { unitCategory: 'spice', packageLabel: 'jar', defaultUnit: 'jar', inventoryUnit: 'jar', level1Options: jars(2) },
  Cinnamon: { unitCategory: 'spice', packageLabel: 'jar', defaultUnit: 'jar', inventoryUnit: 'jar', level1Options: jars(2) },
  'Chili Powder': { unitCategory: 'spice', packageLabel: 'jar', defaultUnit: 'jar', inventoryUnit: 'jar', level1Options: jars(2) },
  'Italian Seasoning': { unitCategory: 'spice', packageLabel: 'jar', defaultUnit: 'jar', inventoryUnit: 'jar', level1Options: jars(2) },
  'Red Pepper Flakes': { unitCategory: 'spice', packageLabel: 'jar', defaultUnit: 'jar', inventoryUnit: 'jar', level1Options: jars(2) },

  // — Dairy & Eggs —
  Milk: {
    unitCategory: 'volume',
    packageLabel: 'gallon',
    defaultUnit: 'gallon',
    inventoryUnit: 'gallon',
    level1Options: [
      { label: 'Half gallon', quantity: 0.5, unit: 'gallon' },
      { label: 'Full gallon', quantity: 1, unit: 'gallon' },
      { label: 'Quart', quantity: 1, unit: 'quart' },
    ],
    subtypes: ['Whole', '2%', '1%', 'Skim', 'Lactose Free', 'Almond', 'Oat'],
  },
  Eggs: {
    unitCategory: 'count',
    packageLabel: 'carton',
    defaultUnit: 'eggs',
    inventoryUnit: 'eggs',
    level1Options: [
      { label: 'Half dozen (6)', quantity: 6, unit: 'eggs' },
      { label: '1 dozen (12)', quantity: 12, unit: 'eggs' },
      { label: '18 count', quantity: 18, unit: 'eggs' },
    ],
  },
  Butter: {
    unitCategory: 'weight',
    packageLabel: 'stick',
    defaultUnit: 'stick',
    inventoryUnit: 'stick',
    level1Options: [
      { label: '1 stick', quantity: 1, unit: 'stick' },
      { label: '2 sticks', quantity: 2, unit: 'sticks' },
      { label: '1 lb box', quantity: 1, unit: 'lb' },
    ],
  },
  Cheese: {
    unitCategory: 'weight',
    packageLabel: 'block',
    defaultUnit: 'oz',
    inventoryUnit: 'oz',
    level1Options: [
      { label: 'Small', quantity: 4, unit: 'oz' },
      { label: 'Medium', quantity: 8, unit: 'oz' },
      { label: 'Large', quantity: 16, unit: 'oz' },
    ],
    subtypes: ['Mild Cheddar', 'Sharp Cheddar', 'Extra Sharp', 'Shredded', 'Block', 'Mozzarella', 'Swiss', 'Pepper Jack', 'Parmesan'],
  },
  Yogurt: {
    unitCategory: 'package',
    packageLabel: 'cup',
    defaultUnit: 'cup',
    inventoryUnit: 'cup',
    level1Options: [
      { label: 'Single cup', quantity: 1, unit: 'cup' },
      { label: '4-pack', quantity: 4, unit: 'cups' },
      { label: '6-pack', quantity: 6, unit: 'cups' },
    ],
  },
  'Sour Cream': {
    unitCategory: 'package',
    packageLabel: 'container',
    defaultUnit: 'container',
    inventoryUnit: 'container',
    level1Options: [
      { label: '1 container', quantity: 1, unit: 'container' },
      { label: '2 containers', quantity: 2, unit: 'container' },
    ],
  },
  'Cream Cheese': {
    unitCategory: 'package',
    packageLabel: 'block',
    defaultUnit: 'block',
    inventoryUnit: 'block',
    level1Options: [
      { label: '1 block', quantity: 1, unit: 'block' },
      { label: '2 blocks', quantity: 2, unit: 'block' },
    ],
  },
  'Heavy Cream': {
    unitCategory: 'volume',
    packageLabel: 'pint',
    defaultUnit: 'pint',
    inventoryUnit: 'pint',
    level1Options: [
      { label: '1 pint', quantity: 1, unit: 'pint' },
      { label: '2 pints', quantity: 2, unit: 'pint' },
    ],
  },

  // — Fresh Produce —
  Bananas: {
    unitCategory: 'produce',
    packageLabel: 'bunch',
    defaultUnit: 'each',
    inventoryUnit: 'each',
    level1Options: [
      { label: '3 bananas', quantity: 3, unit: 'each' },
      { label: '6 bananas', quantity: 6, unit: 'each' },
      { label: 'Bunch (9+)', quantity: 9, unit: 'each' },
    ],
  },
  Apples: {
    unitCategory: 'produce',
    packageLabel: 'bag',
    defaultUnit: 'lb',
    inventoryUnit: 'lb',
    level1Options: [
      { label: '3 count', quantity: 3, unit: 'each' },
      { label: '1 lb bag', quantity: 1, unit: 'lb' },
      { label: '3 lb bag', quantity: 3, unit: 'lb' },
    ],
  },
  Onions: {
    unitCategory: 'produce',
    packageLabel: 'bag',
    defaultUnit: 'each',
    inventoryUnit: 'each',
    level1Options: [
      { label: '1 onion', quantity: 1, unit: 'each' },
      { label: '3 lb bag', quantity: 3, unit: 'lb' },
    ],
  },
  Garlic: { unitCategory: 'produce', packageLabel: 'head', defaultUnit: 'head', inventoryUnit: 'head', level1Options: heads(3) },
  Potatoes: { unitCategory: 'produce', packageLabel: 'bag', defaultUnit: 'lb', inventoryUnit: 'lb', level1Options: lbBags([1, 5, 10]) },
  Carrots: {
    unitCategory: 'produce',
    packageLabel: 'bunch',
    defaultUnit: 'bunch',
    inventoryUnit: 'bunch',
    level1Options: [
      { label: '1 bunch', quantity: 1, unit: 'bunch' },
      { label: '2 bunches', quantity: 2, unit: 'bunch' },
      { label: '1 lb bag', quantity: 1, unit: 'lb' },
    ],
  },
  Celery: {
    unitCategory: 'produce',
    packageLabel: 'bunch',
    defaultUnit: 'bunch',
    inventoryUnit: 'bunch',
    level1Options: [
      { label: '1 bunch', quantity: 1, unit: 'bunch' },
      { label: '2 bunches', quantity: 2, unit: 'bunch' },
    ],
  },
  Lettuce: { unitCategory: 'produce', packageLabel: 'head', defaultUnit: 'head', inventoryUnit: 'head', level1Options: heads(2) },
  Tomatoes: {
    unitCategory: 'produce',
    packageLabel: 'lb',
    defaultUnit: 'lb',
    inventoryUnit: 'lb',
    level1Options: [
      { label: '1 lb', quantity: 1, unit: 'lb' },
      { label: '4 count', quantity: 4, unit: 'each' },
    ],
  },
  Lemons: { unitCategory: 'produce', packageLabel: 'count', defaultUnit: 'each', inventoryUnit: 'each', level1Options: countOptions([1, 3, 6]) },
  Limes: { unitCategory: 'produce', packageLabel: 'count', defaultUnit: 'each', inventoryUnit: 'each', level1Options: countOptions([1, 3, 6]) },

  // — Meat & Protein —
  'Chicken Breast': {
    unitCategory: 'weight',
    packageLabel: 'pack',
    defaultUnit: 'lb',
    inventoryUnit: 'lb',
    level1Options: [
      { label: '1 lb pack', quantity: 1, unit: 'lb' },
      { label: '2 lb pack', quantity: 2, unit: 'lb' },
      { label: 'Family pack (3 lb)', quantity: 3, unit: 'lb' },
    ],
  },
  'Ground Beef': { unitCategory: 'weight', packageLabel: 'pack', defaultUnit: 'lb', inventoryUnit: 'lb', level1Options: lbBags([1, 2, 3]) },
  Bacon: { unitCategory: 'package', packageLabel: 'pack', defaultUnit: 'pack', inventoryUnit: 'pack', level1Options: [
    { label: '1 pack', quantity: 1, unit: 'pack' },
    { label: '2 packs', quantity: 2, unit: 'pack' },
  ] },
  Sausage: { unitCategory: 'package', packageLabel: 'pack', defaultUnit: 'pack', inventoryUnit: 'pack', level1Options: [
    { label: '1 pack', quantity: 1, unit: 'pack' },
    { label: '2 packs', quantity: 2, unit: 'pack' },
  ] },
  'Deli Meat': {
    unitCategory: 'weight',
    packageLabel: 'lb',
    defaultUnit: 'lb',
    inventoryUnit: 'lb',
    level1Options: [
      { label: '1/2 lb', quantity: 0.5, unit: 'lb' },
      { label: '1 lb', quantity: 1, unit: 'lb' },
    ],
  },
  Tofu: {
    unitCategory: 'package',
    packageLabel: 'block',
    defaultUnit: 'block',
    inventoryUnit: 'block',
    level1Options: [
      { label: '1 block', quantity: 1, unit: 'block' },
      { label: '2 blocks', quantity: 2, unit: 'block' },
    ],
  },

  // — Frozen —
  'Frozen Vegetables': { unitCategory: 'package', packageLabel: 'bag', defaultUnit: 'bag', inventoryUnit: 'bag', level1Options: bags() },
  'Frozen Fruit': { unitCategory: 'package', packageLabel: 'bag', defaultUnit: 'bag', inventoryUnit: 'bag', level1Options: bags() },
  'Ice Cream': {
    unitCategory: 'package',
    packageLabel: 'container',
    defaultUnit: 'pint',
    inventoryUnit: 'pint',
    level1Options: [
      { label: '1 pint', quantity: 1, unit: 'pint' },
      { label: '1/2 gallon', quantity: 0.5, unit: 'gallon' },
    ],
  },
  'Frozen Pizza': {
    unitCategory: 'count',
    packageLabel: 'pizza',
    defaultUnit: 'each',
    inventoryUnit: 'each',
    level1Options: [
      { label: '1 pizza', quantity: 1, unit: 'each' },
      { label: '2 pizzas', quantity: 2, unit: 'each' },
      { label: '3 pizzas', quantity: 3, unit: 'each' },
    ],
  },
  'Frozen Chicken': { unitCategory: 'package', packageLabel: 'bag', defaultUnit: 'bag', inventoryUnit: 'bag', level1Options: bags() },
  'Frozen Fish': { unitCategory: 'package', packageLabel: 'bag', defaultUnit: 'bag', inventoryUnit: 'bag', level1Options: bags() },
  'Frozen Fries': { unitCategory: 'package', packageLabel: 'bag', defaultUnit: 'bag', inventoryUnit: 'bag', level1Options: bags() },
};

const FALLBACK_CONFIG: WizardItemConfig = {
  unitCategory: 'package',
  packageLabel: 'package',
  defaultUnit: 'package',
  inventoryUnit: 'package',
  level1Options: [
    { label: '1 package', quantity: 1, unit: 'package' },
    { label: '2 packages', quantity: 2, unit: 'package' },
  ],
};

export function getWizardItemConfig(itemName: string): WizardItemConfig {
  return WIZARD_ITEM_CONFIG[itemName] ?? FALLBACK_CONFIG;
}

/** Validate every pantry wizard item has a config (dev/test helper). */
export function auditWizardItemCoverage(itemNames: string[]): string[] {
  return itemNames.filter((name) => !WIZARD_ITEM_CONFIG[name]);
}
