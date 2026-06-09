/** Estimated nutrition — not medical advice; USDA-inspired reference servings */

export interface MacroFacts {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g?: number;
  sodium_mg?: number;
}

export interface IngredientNutritionEstimate extends MacroFacts {
  ingredient_name: string;
  quantity: number;
  unit: string;
  /** Human label e.g. "½ cup cooked" */
  portion_label: string;
  knowledge_id?: string;
  /** Reference serving this estimate scaled from */
  reference_serving?: string;
  confidence: 'high' | 'medium' | 'low';
  /** True when quantity/unit could not be parsed — used default portion */
  estimated_portion?: boolean;
}

export interface MealNutritionEstimate extends MacroFacts {
  /** Per person when household_size > 1 */
  per_serving: MacroFacts;
  servings: number;
  ingredients: IngredientNutritionEstimate[];
  /** Short disclaimer */
  disclaimer: string;
  confidence: 'high' | 'medium' | 'low';
  /** Ingredients we could not estimate */
  unknown_ingredients: string[];
}
