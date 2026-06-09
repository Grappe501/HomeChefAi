/**
 * Food Taxonomy 1.1 — hierarchy metadata for pantry wizard + future Brain.
 * See develop_notes/FOOD_TAXONOMY_1_0.md
 */

import type { WizardQuantityOption } from './pantryWizard';
import { getWizardItemConfig } from './pantryWizard';

export type KitchenDetailLevel =
  | 'quick_start'
  | 'home_kitchen'
  | 'enthusiast_kitchen'
  | 'chef_mode';

export interface FoodTaxonomySelection {
  taxonomy_id: string;
  family: string;
  form?: string;
  variant?: string;
  detail_level: KitchenDetailLevel;
}

export interface TaxonomyFormOption {
  id: string;
  label: string;
  /** Saved inventory name (defaults to wizard item + form label) */
  inventoryName?: string;
  form?: string;
  variant?: string;
  location?: 'pantry' | 'fridge' | 'freezer';
  quantityOptions: WizardQuantityOption[];
}

export interface FoodTaxonomyFamily {
  id: string;
  displayName: string;
  category: string;
  wizardItemName: string;
  /** Show form/type picker before size in pantry wizard */
  formFirst: boolean;
  formOptions?: TaxonomyFormOption[];
  variants: { id: string; label: string }[];
  forms: { id: string; label: string }[];
  commonUnits: string[];
  /** Other family ids that can substitute in recipes */
  substitutes: string[];
  cuisineStapleTags: string[];
  supportedDetailLevels: KitchenDetailLevel[];
}

const TAXONOMY_NOTE_PREFIX = 'taxonomy:';

function cans(max = 4): WizardQuantityOption[] {
  return [1, 2, 3, max]
    .filter((v, i, a) => a.indexOf(v) === i)
    .sort()
    .map((n) => ({
      label: n === 1 ? '1 can' : `${n} cans`,
      quantity: n,
      unit: 'can',
    }));
}

function jars(max = 2): WizardQuantityOption[] {
  return [1, 2, max]
    .filter((v, i, a) => a.indexOf(v) === i)
    .sort()
    .map((n) => ({
      label: n === 1 ? '1 jar' : `${n} jars`,
      quantity: n,
      unit: 'jar',
    }));
}

function cheeseSizes(): WizardQuantityOption[] {
  return getWizardItemConfig('Cheese').level1Options;
}

function freshTomatoSizes(): WizardQuantityOption[] {
  return getWizardItemConfig('Tomatoes').level1Options;
}

function lbBags(sizes: number[]): WizardQuantityOption[] {
  return sizes.map((lb) => ({
    label: lb === 1 ? '1 lb' : `${lb} lb bag`,
    quantity: lb,
    unit: 'lb',
  }));
}

function leanPacks(): WizardQuantityOption[] {
  return getWizardItemConfig('Ground Beef').level1Options;
}

function milkSizes(): WizardQuantityOption[] {
  return getWizardItemConfig('Milk').level1Options;
}

export const FOOD_TAXONOMY: Record<string, FoodTaxonomyFamily> = {
  cheese: {
    id: 'cheese',
    displayName: 'Cheese',
    category: 'dairy',
    wizardItemName: 'Cheese',
    formFirst: true,
    formOptions: [
      { id: 'shredded', label: 'Shredded', form: 'shredded', inventoryName: 'Shredded Cheese', quantityOptions: cheeseSizes() },
      { id: 'block', label: 'Block', form: 'block', inventoryName: 'Cheese (Block)', quantityOptions: cheeseSizes() },
      { id: 'sliced', label: 'Sliced', form: 'sliced', inventoryName: 'Sliced Cheese', quantityOptions: cheeseSizes() },
      { id: 'parmesan', label: 'Parmesan', variant: 'parmesan', inventoryName: 'Parmesan Cheese', quantityOptions: cheeseSizes() },
      { id: 'mozzarella', label: 'Mozzarella', variant: 'mozzarella', inventoryName: 'Mozzarella Cheese', quantityOptions: cheeseSizes() },
      { id: 'cheddar', label: 'Cheddar', variant: 'cheddar', form: 'block', inventoryName: 'Cheddar Cheese', quantityOptions: cheeseSizes() },
      { id: 'pepper_jack', label: 'Pepper Jack', variant: 'pepper_jack', inventoryName: 'Pepper Jack Cheese', quantityOptions: cheeseSizes() },
    ],
    variants: [
      { id: 'cheddar', label: 'Cheddar' },
      { id: 'mozzarella', label: 'Mozzarella' },
      { id: 'parmesan', label: 'Parmesan' },
      { id: 'pepper_jack', label: 'Pepper Jack' },
      { id: 'swiss', label: 'Swiss' },
    ],
    forms: [
      { id: 'shredded', label: 'Shredded' },
      { id: 'block', label: 'Block' },
      { id: 'sliced', label: 'Sliced' },
    ],
    commonUnits: ['oz', 'block', 'bag'],
    substitutes: ['dairy_cream_cheese'],
    cuisineStapleTags: ['american', 'comfort', 'italian', 'mexican'],
    supportedDetailLevels: ['quick_start', 'home_kitchen', 'enthusiast_kitchen', 'chef_mode'],
  },

  tomato: {
    id: 'tomato',
    displayName: 'Tomatoes',
    category: 'produce',
    wizardItemName: 'Tomatoes',
    formFirst: true,
    formOptions: [
      { id: 'fresh', label: 'Fresh', form: 'fresh', inventoryName: 'Tomatoes', location: 'fridge', quantityOptions: freshTomatoSizes() },
      { id: 'diced_can', label: 'Diced Can', form: 'diced', variant: 'diced', inventoryName: 'Diced Tomatoes', location: 'pantry', quantityOptions: cans() },
      { id: 'crushed', label: 'Crushed', form: 'crushed', inventoryName: 'Crushed Tomatoes', location: 'pantry', quantityOptions: cans() },
      { id: 'sauce', label: 'Sauce', form: 'sauce', inventoryName: 'Tomato Sauce', location: 'pantry', quantityOptions: jars(3) },
      { id: 'paste', label: 'Paste', form: 'paste', inventoryName: 'Tomato Paste', location: 'pantry', quantityOptions: cans(3) },
    ],
    variants: [
      { id: 'fresh', label: 'Fresh' },
      { id: 'diced', label: 'Diced' },
      { id: 'crushed', label: 'Crushed' },
      { id: 'sauce', label: 'Sauce' },
      { id: 'paste', label: 'Paste' },
    ],
    forms: [
      { id: 'fresh', label: 'Fresh' },
      { id: 'diced', label: 'Diced (canned)' },
      { id: 'crushed', label: 'Crushed (canned)' },
      { id: 'sauce', label: 'Sauce (canned)' },
      { id: 'paste', label: 'Paste (canned)' },
    ],
    commonUnits: ['lb', 'each', 'can', 'jar'],
    substitutes: ['tomato'],
    cuisineStapleTags: ['italian', 'mexican', 'mediterranean', 'american'],
    supportedDetailLevels: ['quick_start', 'home_kitchen', 'enthusiast_kitchen', 'chef_mode'],
  },

  potato: {
    id: 'potato',
    displayName: 'Potatoes',
    category: 'produce',
    wizardItemName: 'Potatoes',
    formFirst: false,
    variants: [
      { id: 'russet', label: 'Russet' },
      { id: 'red', label: 'Red' },
      { id: 'yukon_gold', label: 'Yukon Gold' },
      { id: 'sweet', label: 'Sweet' },
    ],
    forms: [],
    commonUnits: ['lb', 'each'],
    substitutes: ['potato'],
    cuisineStapleTags: ['american', 'comfort', 'southern'],
    supportedDetailLevels: ['quick_start', 'home_kitchen', 'enthusiast_kitchen', 'chef_mode'],
  },

  beans: {
    id: 'beans',
    displayName: 'Beans',
    category: 'legumes',
    wizardItemName: 'Black Beans',
    formFirst: false,
    variants: [
      { id: 'black', label: 'Black' },
      { id: 'kidney', label: 'Kidney' },
      { id: 'pinto', label: 'Pinto' },
      { id: 'chickpea', label: 'Chickpea' },
    ],
    forms: [
      { id: 'dry', label: 'Dry' },
      { id: 'canned', label: 'Canned' },
      { id: 'refried', label: 'Refried' },
    ],
    commonUnits: ['can', 'lb', 'oz'],
    substitutes: ['beans'],
    cuisineStapleTags: ['mexican', 'southern', 'comfort'],
    supportedDetailLevels: ['quick_start', 'home_kitchen', 'enthusiast_kitchen', 'chef_mode'],
  },

  milk: {
    id: 'milk',
    displayName: 'Milk',
    category: 'dairy',
    wizardItemName: 'Milk',
    formFirst: false,
    variants: [
      { id: 'whole', label: 'Whole' },
      { id: 'two_percent', label: '2%' },
      { id: 'one_percent', label: '1%' },
      { id: 'skim', label: 'Skim' },
      { id: 'lactose_free', label: 'Lactose Free' },
      { id: 'almond', label: 'Almond' },
      { id: 'oat', label: 'Oat' },
    ],
    forms: [],
    commonUnits: ['gallon', 'quart', 'half_gallon'],
    substitutes: ['milk_oat', 'milk_almond'],
    cuisineStapleTags: ['american', 'comfort'],
    supportedDetailLevels: ['quick_start', 'home_kitchen', 'enthusiast_kitchen', 'chef_mode'],
  },

  rice: {
    id: 'rice',
    displayName: 'Rice',
    category: 'grains',
    wizardItemName: 'White Rice',
    formFirst: false,
    variants: [
      { id: 'white', label: 'White' },
      { id: 'jasmine', label: 'Jasmine' },
      { id: 'basmati', label: 'Basmati' },
      { id: 'brown', label: 'Brown' },
      { id: 'wild', label: 'Wild' },
    ],
    forms: [],
    commonUnits: ['lb', 'bag'],
    substitutes: ['rice'],
    cuisineStapleTags: ['asian', 'mexican', 'indian', 'american'],
    supportedDetailLevels: ['quick_start', 'home_kitchen', 'enthusiast_kitchen', 'chef_mode'],
  },

  flour: {
    id: 'flour',
    displayName: 'Flour',
    category: 'grains',
    wizardItemName: 'Flour',
    formFirst: false,
    variants: [
      { id: 'all_purpose', label: 'All Purpose' },
      { id: 'bread', label: 'Bread Flour' },
      { id: 'self_rising', label: 'Self Rising' },
      { id: 'cake', label: 'Cake Flour' },
      { id: 'whole_wheat', label: 'Whole Wheat' },
    ],
    forms: [],
    commonUnits: ['lb', 'bag'],
    substitutes: ['flour'],
    cuisineStapleTags: ['american', 'comfort', 'southern'],
    supportedDetailLevels: ['quick_start', 'home_kitchen', 'enthusiast_kitchen', 'chef_mode'],
  },

  ground_beef: {
    id: 'ground_beef',
    displayName: 'Ground Beef',
    category: 'meat',
    wizardItemName: 'Ground Beef',
    formFirst: false,
    variants: [
      { id: '80_20', label: '80/20' },
      { id: '85_15', label: '85/15' },
      { id: '90_10', label: '90/10' },
      { id: '93_7', label: '93/7' },
    ],
    forms: [],
    commonUnits: ['lb', 'pack'],
    substitutes: ['ground_turkey', 'ground_chicken'],
    cuisineStapleTags: ['american', 'comfort', 'mexican'],
    supportedDetailLevels: ['quick_start', 'home_kitchen', 'enthusiast_kitchen', 'chef_mode'],
  },
};

/** Wizard item name → taxonomy family id */
const WIZARD_ITEM_TO_FAMILY: Record<string, string> = {
  Cheese: 'cheese',
  Tomatoes: 'tomato',
  Potatoes: 'potato',
  'Black Beans': 'beans',
  'Kidney Beans': 'beans',
  Chickpeas: 'beans',
  Milk: 'milk',
  'White Rice': 'rice',
  'Brown Rice': 'rice',
  Flour: 'flour',
  'Ground Beef': 'ground_beef',
};

export function getTaxonomyFamilyByWizardItem(itemName: string): FoodTaxonomyFamily | null {
  const familyId = WIZARD_ITEM_TO_FAMILY[itemName];
  return familyId ? FOOD_TAXONOMY[familyId] ?? null : null;
}

export function isFormFirstWizardItem(itemName: string): boolean {
  return getTaxonomyFamilyByWizardItem(itemName)?.formFirst === true;
}

export function getFormOptions(itemName: string): TaxonomyFormOption[] {
  return getTaxonomyFamilyByWizardItem(itemName)?.formOptions ?? [];
}

export function buildTaxonomyId(familyId: string, formOption: TaxonomyFormOption): string {
  const parts = [familyId];
  if (formOption.variant) parts.push(formOption.variant);
  else if (formOption.form) parts.push(formOption.form);
  else parts.push(formOption.id);
  return parts.join('.');
}

export function buildTaxonomySelection(
  family: FoodTaxonomyFamily,
  formOption: TaxonomyFormOption,
  detailLevel: KitchenDetailLevel = 'quick_start',
): FoodTaxonomySelection {
  return {
    taxonomy_id: buildTaxonomyId(family.id, formOption),
    family: family.id,
    form: formOption.form,
    variant: formOption.variant,
    detail_level: detailLevel,
  };
}

export function encodeTaxonomyNotes(selection: FoodTaxonomySelection): string {
  return `${TAXONOMY_NOTE_PREFIX}${JSON.stringify(selection)}`;
}

export function decodeTaxonomyNotes(notes?: string | null): FoodTaxonomySelection | null {
  if (!notes?.startsWith(TAXONOMY_NOTE_PREFIX)) return null;
  try {
    return JSON.parse(notes.slice(TAXONOMY_NOTE_PREFIX.length)) as FoodTaxonomySelection;
  } catch {
    return null;
  }
}

export function resolveInventoryName(
  wizardItemName: string,
  formOption: TaxonomyFormOption,
): string {
  return formOption.inventoryName ?? wizardItemName;
}

export function resolveInventoryLocation(
  defaultLocation: 'pantry' | 'fridge' | 'freezer',
  formOption: TaxonomyFormOption,
): 'pantry' | 'fridge' | 'freezer' {
  return formOption.location ?? defaultLocation;
}

/** Display label under a selected wizard tile */
export function formatSelectedLabel(
  formOption: TaxonomyFormOption,
  quantityLabel: string,
): string {
  return `${formOption.label} · ${quantityLabel}`;
}

/** Metadata helpers for non-form-first families (future wizard passes) */
export function getFamilyMetadata(familyId: string): FoodTaxonomyFamily | null {
  return FOOD_TAXONOMY[familyId] ?? null;
}

export function getSubstituteFamilies(familyId: string): FoodTaxonomyFamily[] {
  const family = FOOD_TAXONOMY[familyId];
  if (!family) return [];
  return family.substitutes
    .map((id) => FOOD_TAXONOMY[id])
    .filter((f): f is FoodTaxonomyFamily => !!f);
}

export function getQuantityOptionsForFamily(familyId: string): WizardQuantityOption[] {
  const family = FOOD_TAXONOMY[familyId];
  if (!family) return [];
  switch (familyId) {
    case 'potato':
      return lbBags([1, 5, 10]);
    case 'milk':
      return milkSizes();
    case 'rice':
      return lbBags([1, 2, 5, 10]);
    case 'flour':
      return lbBags([2, 5, 10]);
    case 'ground_beef':
      return leanPacks();
    case 'beans':
      return cans();
    default:
      return [];
  }
}
