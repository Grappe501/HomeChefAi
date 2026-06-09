/**
 * Pure knowledge id helpers — safe for Netlify functions (no React/taxonomy deps).
 */

export const WIZARD_KNOWLEDGE_OVERRIDES: Record<string, string> = {
  Tomatoes: 'ingredient.tomato',
  Onions: 'ingredient.onion',
  Garlic: 'ingredient.garlic',
  Potatoes: 'ingredient.potato',
  Milk: 'ingredient.milk',
  Flour: 'ingredient.flour',
  Cheese: 'ingredient.cheese',
  Paprika: 'ingredient.paprika',
  Cumin: 'ingredient.cumin',
  'Chili Powder': 'ingredient.chili.powder',
  'White Rice': 'ingredient.rice.white',
  'Brown Rice': 'ingredient.rice.brown',
  'Black Beans': 'ingredient.beans.black',
  'Kidney Beans': 'ingredient.beans.kidney',
  Chickpeas: 'ingredient.beans.chickpea',
  'Ground Beef': 'ingredient.ground_beef',
  'Chicken Breast': 'ingredient.chicken.breast',
  'Diced Tomatoes': 'ingredient.tomato.diced',
};

export function wizardItemToSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

export function taxonomySelectionToKnowledgeId(selection: {
  family: string;
  variant?: string;
  form?: string;
}): string {
  const base = `ingredient.${selection.family}`;
  if (selection.variant) return `${base}.${selection.variant}`;
  if (selection.form) return `${base}.${selection.form}`;
  return base;
}

/** Walk up variant chain: ingredient.paprika.smoked → ingredient.paprika → … */
export function knowledgeIdParentChain(id: string): string[] {
  const chain: string[] = [id];
  const parts = id.split('.');
  while (parts.length > 2) {
    parts.pop();
    chain.push(parts.join('.'));
  }
  return chain;
}

export function resolveWizardKnowledgeIdSimple(wizardItemName: string): string {
  return (
    WIZARD_KNOWLEDGE_OVERRIDES[wizardItemName] ??
    `ingredient.${wizardItemToSlug(wizardItemName)}`
  );
}
