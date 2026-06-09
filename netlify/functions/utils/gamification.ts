import type { SupabaseClient } from '@supabase/supabase-js';
import type { DevStore } from './types.js';

const LEVEL_THRESHOLDS = [
  { level: 1, xp: 0 },
  { level: 2, xp: 100 },
  { level: 3, xp: 300 },
  { level: 4, xp: 600 },
  { level: 5, xp: 1000 },
];

export const XP_AWARDS = {
  cook_log: 25,
  receipt_verify: 30,
  meal_plan: 50,
  pantry_wizard: 15,
} as const;

export function levelForXp(xp: number): number {
  let level = 1;
  for (const row of LEVEL_THRESHOLDS) {
    if (xp >= row.xp) level = row.level;
  }
  return level;
}

export async function awardXpSupabase(
  db: SupabaseClient,
  userId: string,
  amount: number,
  extra?: Record<string, unknown>
) {
  const { data: profile } = await db
    .from('profiles')
    .select('gamification_xp, gamification_level')
    .eq('user_id', userId)
    .single();

  const newXp = (profile?.gamification_xp ?? 0) + amount;
  const newLevel = levelForXp(newXp);

  await db
    .from('profiles')
    .update({
      gamification_xp: newXp,
      gamification_level: newLevel,
      updated_at: new Date().toISOString(),
      ...extra,
    })
    .eq('user_id', userId);

  return { xp: newXp, level: newLevel, gained: amount };
}

export function awardXpDevStore(store: DevStore, userId: string, amount: number, extra?: Record<string, unknown>) {
  const pIdx = store.profiles.findIndex((p) => p.user_id === userId);
  if (pIdx < 0) return null;
  const newXp = (store.profiles[pIdx].gamification_xp ?? 0) + amount;
  store.profiles[pIdx] = {
    ...store.profiles[pIdx],
    gamification_xp: newXp,
    gamification_level: levelForXp(newXp),
    ...extra,
  };
  return { xp: newXp, level: store.profiles[pIdx].gamification_level, gained: amount };
}
