/**
 * Agent Suite v6 — unified dish search (shard hybrid Phase 4, hybrid Phase 3, else BM25).
 */

import type { InventoryItem, Profile } from '../../../../src/types/index.js';
import type { DishMatch } from '../../../../src/types/dish.js';
import { searchDishesBm25 } from './dishBm25.js';
import { isHybridSearchEnabled, isPhase4ShardHybrid, searchDishesHybrid } from './dishHybridSearch.js';

export type DishSearchMode = 'shard_hybrid' | 'hybrid' | 'bm25' | 'pantry';

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
  if (options.mode === 'bm25' || options.mode === 'pantry') {
    const matches = await searchDishesBm25(query, inventory, profile, options);
    return { matches, mode: 'bm25' };
  }

  if (isPhase4ShardHybrid()) {
    const matches = await searchDishesHybrid(query, inventory, profile, options);
    return { matches, mode: 'shard_hybrid' };
  }

  if (isHybridSearchEnabled()) {
    const matches = await searchDishesHybrid(query, inventory, profile, options);
    return { matches, mode: 'hybrid' };
  }

  const matches = await searchDishesBm25(query, inventory, profile, options);
  return { matches, mode: 'bm25' };
}
