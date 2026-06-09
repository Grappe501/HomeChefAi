/**
 * Structured dish nodes in data/ai/dishes/ — reusable recipe templates.
 */

export interface DishIngredient {
  name: string;
  quantity: number;
  unit: string;
  knowledge_id?: string;
}

export interface DishMatch {
  id: string;
  title: string;
  description?: string;
  cuisine_id: string;
  cuisine_label: string;
  course: string;
  occasions: string[];
  meal_types: string[];
  prep_time_minutes: number;
  tags: string[];
  ingredients: DishIngredient[];
  steps: string[];
  ingredients_in_pantry: string[];
  ingredients_missing: string[];
  pantry_match: number;
  score: number;
}

export function dishIngredientsFromNode(attrs: Record<string, unknown> | undefined): DishIngredient[] {
  const raw = attrs?.ingredients;
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((i): i is Record<string, unknown> => !!i && typeof i === 'object')
    .map((i) => ({
      name: String(i.name ?? ''),
      quantity: Number(i.quantity ?? 1),
      unit: String(i.unit ?? 'each'),
      ...(i.knowledge_id ? { knowledge_id: String(i.knowledge_id) } : {}),
    }))
    .filter((i) => i.name.length > 0);
}

export function dishStepsFromNode(attrs: Record<string, unknown> | undefined): string[] {
  const raw = attrs?.steps;
  if (!Array.isArray(raw)) return [];
  return raw.map((s) => String(s)).filter(Boolean);
}

export function dishKeywordsFromNode(attrs: Record<string, unknown> | undefined): string[] {
  const raw = attrs?.match_keywords;
  if (!Array.isArray(raw)) return [];
  return raw.map((k) => String(k).toLowerCase()).filter(Boolean);
}
