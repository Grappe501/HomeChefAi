/**
 * Agent Suite v6 — unified dish search (hybrid when Phase 3 enabled, else BM25).
 */

import type { InventoryItem, Profile } from '../../../../src/types/index.js';
import type { DishMatch } from '../../../../src/types/dish.js';
import { searchDishesBm25 } from './dishBm25.js';
import { isHybridSearchEnabled, searchDishesHybrid } from './dishHybridSearch.js';

export type DishSearchMode = 'hybrid' | 'bm25' | 'pantry';

export async function searchDishes(
  query: string,
  inventory: InventoryItem[],
  profile: Profile,
  options: {
    limit?: number;
    meal_type?: string;
    course?: string;
    min_pantry_match?: number;
    mode?: DishSearchMode;
  } = {},
): Promise<{ matches: DishMatch[]; mode: DishSearchMode }> {
  const mode = options.mode ?? (isHybridSearchEnabled() ? 'hybrid' : 'bm25');

  if (mode === 'hybrid') {
    const matches = await searchDishesHybrid(query, inventory, profile, options);
    return { matches, mode: 'hybrid' };
  }

  const matches = searchDishesBm25(query, inventory, profile, options);
  return { matches, mode: 'bm25' };
}
