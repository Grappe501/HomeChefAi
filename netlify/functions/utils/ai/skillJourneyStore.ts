/**
 * Skill journey progress — Supabase + dev store (Phase 7).
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { useDevStore, loadStore, saveStore } from '../db.js';
import type { DevStore } from '../types.js';
import { getKnowledgeNode } from '../ai/knowledgeLoader.js';
import { resolveSkillLevelFromCount } from '../ai/skills.js';

export interface SkillProgressRow {
  id: string;
  user_id: string;
  technique_id: string;
  practice_count: number;
  comfort_level: string;
  last_practiced_at: string;
  milestones_unlocked: string[];
  updated_at: string;
}

export async function recordSkillPracticeSupabase(
  db: SupabaseClient,
  userId: string,
  techniqueIds: string[],
): Promise<void> {
  const now = new Date().toISOString();
  for (const techniqueId of techniqueIds) {
    const { data: existing } = await db
      .from('skill_journey_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('technique_id', techniqueId)
      .maybeSingle();

    const count = (existing?.practice_count ?? 0) + 1;
    const comfort = resolveSkillLevelFromCount(count);

    await db.from('skill_journey_progress').upsert(
      {
        user_id: userId,
        technique_id: techniqueId,
        practice_count: count,
        comfort_level: comfort,
        last_practiced_at: now,
        updated_at: now,
        metadata: { technique_name: getKnowledgeNode(techniqueId)?.display_name },
      },
      { onConflict: 'user_id,technique_id' },
    );
  }
}

export function recordSkillPracticeDevStore(
  store: DevStore & { skill_journey_progress?: SkillProgressRow[] },
  userId: string,
  techniqueIds: string[],
): void {
  if (!store.skill_journey_progress) store.skill_journey_progress = [];
  const now = new Date().toISOString();

  for (const techniqueId of techniqueIds) {
    const idx = store.skill_journey_progress.findIndex(
      (r) => r.user_id === userId && r.technique_id === techniqueId,
    );
    const count = (idx >= 0 ? store.skill_journey_progress[idx].practice_count : 0) + 1;
    const row: SkillProgressRow = {
      id: idx >= 0 ? store.skill_journey_progress[idx].id : crypto.randomUUID(),
      user_id: userId,
      technique_id: techniqueId,
      practice_count: count,
      comfort_level: resolveSkillLevelFromCount(count),
      last_practiced_at: now,
      milestones_unlocked: idx >= 0 ? store.skill_journey_progress[idx].milestones_unlocked : [],
      updated_at: now,
    };
    if (idx >= 0) store.skill_journey_progress[idx] = row;
    else store.skill_journey_progress.push(row);
  }
}

export async function recordSkillPractice(
  userId: string,
  token: string | undefined,
  techniqueIds: string[],
): Promise<void> {
  if (!techniqueIds.length) return;
  if (useDevStore()) {
    const store = loadStore() as DevStore & { skill_journey_progress?: SkillProgressRow[] };
    recordSkillPracticeDevStore(store, userId, techniqueIds);
    saveStore(store);
    return;
  }
  if (!token) return;
  const { getSupabaseUserClient } = await import('../supabase.js');
  const db = getSupabaseUserClient(token);
  await recordSkillPracticeSupabase(db, userId, techniqueIds);
}
