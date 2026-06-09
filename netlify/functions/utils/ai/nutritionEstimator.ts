/**
 * Deterministic meal nutrition estimates from reference servings + quantity parsing.
 * Not medical advice — USDA-inspired defaults when exact data unavailable.
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import type { InventoryItem, PlannedMeal } from '../../../../src/types/index.js';
import type {
  IngredientNutritionEstimate,
  MacroFacts,
  MealNutritionEstimate,
} from '../../../../src/types/mealNutrition.js';
import { resolveIngredientKnowledgeId } from '../inventoryContext.js';
import { getKnowledgeNode } from './knowledgeLoader.js';
import { resolveKnowledgeRoot } from './knowledgeLoader.js';

interface ReferenceServing extends MacroFacts {
  reference_serving: string;
  serving_grams: number;
}

let cachedRefs: Record<string, ReferenceServing> | null = null;

function loadReferenceServings(): Record<string, ReferenceServing> {
  if (cachedRefs) return cachedRefs;
  try {
    const path = join(resolveKnowledgeRoot(), 'nutrition', 'per_serving.json');
    cachedRefs = JSON.parse(readFileSync(path, 'utf8')) as Record<string, ReferenceServing>;
  } catch {
    cachedRefs = {};
  }
  return cachedRefs;
}

/** Keyword → knowledge_id for ingredients without graph match */
const KEYWORD_REF: [string, string][] = [
  ['chicken breast', 'ingredient.chicken.breast'],
  ['chicken', 'ingredient.chicken.breast'],
  ['ground beef', 'ingredient.ground_beef'],
  ['beef', 'ingredient.ground_beef'],
  ['black bean', 'ingredient.beans.black'],
  ['rice', 'ingredient.rice.white'],
  ['quinoa', 'ingredient.quinoa'],
  ['bbq sauce', 'ingredient.bbq_sauce'],
  ['barbecue sauce', 'ingredient.bbq_sauce'],
  ['garlic', 'ingredient.garlic'],
  ['olive oil', 'ingredient.olive_oil'],
  ['butter', 'ingredient.butter'],
  ['cheddar', 'ingredient.cheese.cheddar'],
  ['cheese', 'ingredient.cheese.cheddar'],
  ['egg', 'ingredient.egg'],
  ['tomato', 'ingredient.tomato'],
  ['onion', 'ingredient.onion'],
  ['bell pepper', 'ingredient.bell_pepper'],
  ['pepper', 'ingredient.bell_pepper'],
  ['spinach', 'ingredient.spinach'],
  ['pasta', 'ingredient.pasta'],
  ['spaghetti', 'ingredient.pasta'],
  ['bread', 'ingredient.bread'],
  ['salmon', 'ingredient.salmon'],
  ['tofu', 'ingredient.tofu'],
  ['avocado', 'ingredient.avocado'],
  ['yogurt', 'ingredient.greek_yogurt'],
  ['milk', 'ingredient.milk'],
  ['potato', 'ingredient.potato'],
  ['broccoli', 'ingredient.broccoli'],
  ['corn', 'ingredient.corn'],
];

function resolveRefKey(name: string, knowledgeId?: string): string | undefined {
  const refs = loadReferenceServings();
  if (knowledgeId && refs[knowledgeId]) return knowledgeId;
  if (knowledgeId) {
    const parent = knowledgeId.replace(/\.[^.]+$/, '');
    if (refs[parent]) return parent;
  }
  const lower = name.toLowerCase();
  for (const [kw, id] of KEYWORD_REF) {
    if (lower.includes(kw) && refs[id]) return id;
  }
  return undefined;
}

function refFromNode(knowledgeId: string): ReferenceServing | undefined {
  const node = getKnowledgeNode(knowledgeId);
  const raw = node?.attributes?.nutrition_per_serving as ReferenceServing | undefined;
  if (raw?.calories != null) return raw;
  return loadReferenceServings()[knowledgeId];
}

function parseToServingMultiplier(quantity: number, unit: string, ref: ReferenceServing): { mult: number; label: string; estimated: boolean } {
  const u = unit.toLowerCase().trim() || 'each';
  const q = quantity > 0 ? quantity : 1;

  if (u === 'g' || u === 'gram' || u === 'grams') {
    const mult = q / ref.serving_grams;
    return { mult, label: `${q}g`, estimated: false };
  }
  if (u === 'oz' || u === 'ounce' || u === 'ounces') {
    const mult = (q * 28.35) / ref.serving_grams;
    return { mult, label: `${q} oz`, estimated: false };
  }
  if (u === 'lb' || u === 'lbs' || u === 'pound') {
    const mult = (q * 453.6) / ref.serving_grams;
    return { mult, label: `${q} lb`, estimated: false };
  }
  if (u === 'cup' || u === 'cups') {
    return { mult: q, label: `${q} cup${q !== 1 ? 's' : ''}`, estimated: u === 'cup' };
  }
  if (u === 'tbsp' || u === 'tablespoon' || u === 'tablespoons') {
    const mult = (q * 15) / ref.serving_grams;
    return { mult, label: `${q} tbsp`, estimated: false };
  }
  if (u === 'tsp' || u === 'teaspoon' || u === 'teaspoons') {
    const mult = (q * 5) / ref.serving_grams;
    return { mult, label: `${q} tsp`, estimated: false };
  }
  if (u === 'clove' || u === 'cloves') {
    return { mult: q, label: `${q} clove${q !== 1 ? 's' : ''}`, estimated: false };
  }
  if (u === 'slice' || u === 'slices') {
    return { mult: q, label: `${q} slice${q !== 1 ? 's' : ''}`, estimated: false };
  }
  if (u === 'can' || u === 'cans') {
    return { mult: q * 2, label: `${q} can${q !== 1 ? 's' : ''} (~2 servings)`, estimated: true };
  }
  if (u === 'package' || u === 'pkg') {
    return { mult: q * 2, label: `${q} pkg (~2 servings)`, estimated: true };
  }
  // each, piece, whole, default
  return { mult: q, label: `${q} serving${q !== 1 ? 's' : ''}`, estimated: q !== 1 || u === 'each' };
}

function scaleMacros(ref: ReferenceServing, mult: number): MacroFacts {
  return {
    calories: Math.round(ref.calories * mult),
    protein_g: Math.round(ref.protein_g * mult * 10) / 10,
    carbs_g: Math.round(ref.carbs_g * mult * 10) / 10,
    fat_g: Math.round(ref.fat_g * mult * 10) / 10,
    fiber_g: ref.fiber_g != null ? Math.round(ref.fiber_g * mult * 10) / 10 : undefined,
    sodium_mg: ref.sodium_mg != null ? Math.round(ref.sodium_mg * mult) : undefined,
  };
}

function sumMacros(items: MacroFacts[]): MacroFacts {
  return items.reduce(
    (acc, m) => ({
      calories: acc.calories + m.calories,
      protein_g: Math.round((acc.protein_g + m.protein_g) * 10) / 10,
      carbs_g: Math.round((acc.carbs_g + m.carbs_g) * 10) / 10,
      fat_g: Math.round((acc.fat_g + m.fat_g) * 10) / 10,
      fiber_g: Math.round(((acc.fiber_g ?? 0) + (m.fiber_g ?? 0)) * 10) / 10,
      sodium_mg: Math.round((acc.sodium_mg ?? 0) + (m.sodium_mg ?? 0)),
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0, sodium_mg: 0 },
  );
}

function estimateIngredient(
  name: string,
  quantity: number,
  unit: string,
  inventory: InventoryItem[],
): IngredientNutritionEstimate | null {
  const knowledgeId = resolveIngredientKnowledgeId(name, inventory);
  const refKey = resolveRefKey(name, knowledgeId);
  if (!refKey) return null;

  const ref = refFromNode(refKey) ?? loadReferenceServings()[refKey];
  if (!ref) return null;

  const { mult, label, estimated } = parseToServingMultiplier(quantity, unit, ref);
  const scaled = scaleMacros(ref, mult);

  return {
    ingredient_name: name,
    quantity,
    unit,
    portion_label: label,
    knowledge_id: refKey,
    reference_serving: ref.reference_serving,
    estimated_portion: estimated,
    confidence: estimated ? 'medium' : knowledgeId === refKey ? 'high' : 'medium',
    ...scaled,
  };
}

export function buildMealNutrition(
  meal: PlannedMeal,
  inventory: InventoryItem[],
  householdSize = 2,
): MealNutritionEstimate | undefined {
  const ingredients = meal.ingredients ?? [];
  if (!ingredients.length) return undefined;

  const estimates: IngredientNutritionEstimate[] = [];
  const unknown: string[] = [];

  for (const ing of ingredients) {
    const est = estimateIngredient(ing.name, ing.quantity ?? 1, ing.unit ?? 'each', inventory);
    if (est) estimates.push(est);
    else unknown.push(ing.name);
  }

  if (!estimates.length) return undefined;

  const total = sumMacros(estimates);
  const servings = Math.max(1, householdSize);
  const perServing: MacroFacts = {
    calories: Math.round(total.calories / servings),
    protein_g: Math.round((total.protein_g / servings) * 10) / 10,
    carbs_g: Math.round((total.carbs_g / servings) * 10) / 10,
    fat_g: Math.round((total.fat_g / servings) * 10) / 10,
    fiber_g: total.fiber_g != null ? Math.round((total.fiber_g / servings) * 10) / 10 : undefined,
    sodium_mg: total.sodium_mg != null ? Math.round(total.sodium_mg / servings) : undefined,
  };

  const highCount = estimates.filter((e) => e.confidence === 'high').length;
  const confidence =
    highCount >= estimates.length * 0.6 ? 'high' : unknown.length ? 'medium' : 'medium';

  return {
    ...total,
    per_serving: perServing,
    servings,
    ingredients: estimates,
    unknown_ingredients: unknown,
    confidence,
    disclaimer:
      'Estimates from reference servings — not medical advice. Actual values vary by brand, prep, and portion size.',
  };
}

export function formatNutritionSummary(n: MealNutritionEstimate): string {
  const p = n.per_serving;
  const parts = [`~${p.calories} cal`, `${p.protein_g}g protein`, `${p.carbs_g}g carbs`, `${p.fat_g}g fat`];
  if (p.fiber_g != null && p.fiber_g > 0) parts.push(`${p.fiber_g}g fiber`);
  return `${parts.join(' · ')} per serving (${n.servings} ${n.servings === 1 ? 'person' : 'people'})`;
}
