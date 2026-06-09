/**
 * Brain skill observations — "Chef is getting comfortable with roux" (Phase 7).
 */

import type { BrainContext } from './types.js';
import type { GeneratedMemory } from './types.js';
import { inferTechniquesFromText, resolveSkillLevelFromCount } from '../ai/skills.js';
import { getKnowledgeNode } from '../ai/knowledgeLoader.js';
import { computeCountConfidence } from './confidence.js';

export function generateSkillObservedMemories(ctx: BrainContext): GeneratedMemory[] {
  const counts = new Map<string, { count: number; logIds: string[] }>();

  for (const log of ctx.usageLogs) {
    const items = (log as { items_used?: { name: string }[] }).items_used?.map((i) => i.name) ?? [];
    const techniqueIds = (log as { technique_ids?: string[] }).technique_ids
      ?? inferTechniquesFromText(log.meal_name ?? '', items);

    for (const tid of techniqueIds) {
      const entry = counts.get(tid) ?? { count: 0, logIds: [] };
      entry.count++;
      entry.logIds.push(log.id);
      counts.set(tid, entry);
    }
  }

  const results: GeneratedMemory[] = [];

  for (const [techniqueId, data] of counts) {
    if (data.count < 3) continue;
    const node = getKnowledgeNode(techniqueId);
    const name = node?.display_name ?? techniqueId.replace('technique.', '');
    const level = resolveSkillLevelFromCount(data.count);
    const confidence = computeCountConfidence(data.count, 3, 60);

    const comfort =
      data.count >= 5
        ? `Chef is getting comfortable with ${name.toLowerCase()}`
        : `Chef is building ${name.toLowerCase()} skills`;

    results.push({
      memory_type: 'skill_learned',
      subject_key: techniqueId.replace(/\./g, '_'),
      headline: `${name} — skill observed`,
      insight: `Chef, ${comfort} — logged ${data.count} times in your cooking.`,
      action_prompt: node?.attributes?.micro_lesson
        ? String(node.attributes.micro_lesson)
        : undefined,
      confidence: Math.min(0.92, confidence),
      surfaced: data.count >= 3,
      metadata: {
        source_events: data.logIds.map((id) => `usage:${id}`),
        observation_count: data.count,
        history_days: 60,
        confidence: Math.min(0.92, confidence),
        formula: 'skill_observed_v1',
        evidence_lines: [
          `${data.count} cook logs using ${name}`,
          `Comfort level: ${level}`,
          `Technique: ${techniqueId}`,
        ],
        technique_id: techniqueId,
        comfort_level: level,
      },
    });
  }

  return results.slice(0, 4);
}
