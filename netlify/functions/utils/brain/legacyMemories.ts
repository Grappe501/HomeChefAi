/**
 * Legacy / tradition memories from cook history (Phase 8).
 */

import type { BrainContext } from './types.js';
import type { GeneratedMemory } from './types.js';
import { listKnowledgeNodes } from '../ai/knowledgeLoader.js';
import { normalizeKey } from './types.js';
import { computeCountConfidence } from './confidence.js';

export function generateLegacyMemories(ctx: BrainContext): GeneratedMemory[] {
  const mealCounts = new Map<string, { label: string; count: number; logIds: string[] }>();

  for (const log of ctx.usageLogs) {
    if (!log.meal_name?.trim()) continue;
    const key = normalizeKey(log.meal_name);
    const entry = mealCounts.get(key) ?? { label: log.meal_name, count: 0, logIds: [] };
    entry.count++;
    entry.logIds.push(log.id);
    mealCounts.set(key, entry);
  }

  const traditions = listKnowledgeNodes('tradition');
  const results: GeneratedMemory[] = [];

  for (const [key, data] of mealCounts) {
    if (data.count < 3) continue;

    const matchedTradition = traditions.find((t) => {
      const name = t.display_name.toLowerCase();
      const blob = data.label.toLowerCase();
      return blob.includes(name.split("'")[0].toLowerCase()) || name.includes(blob.slice(0, 8));
    });

    const confidence = computeCountConfidence(data.count, 3, 90);
    const traditionName = matchedTradition?.display_name ?? data.label;
    const origin = matchedTradition?.attributes?.origin_story as string | undefined;

    results.push({
      memory_type: 'tradition',
      subject_key: `legacy_${key}`,
      headline: `${traditionName} — family tradition`,
      insight: origin
        ? `Chef, ${traditionName} — ${origin} You've served it ${data.count} times.`
        : `Chef, ${data.label} has been served ${data.count} times — it's becoming part of your kitchen story.`,
      confidence: Math.min(0.93, confidence),
      surfaced: data.count >= 3,
      metadata: {
        source_events: data.logIds.map((id) => `usage:${id}`),
        observation_count: data.count,
        history_days: 90,
        confidence: Math.min(0.93, confidence),
        formula: 'legacy_tradition_v1',
        evidence_lines: [
          `${data.count} times cooked or logged`,
          matchedTradition ? `Tradition node: ${matchedTradition.id}` : 'Emerging household pattern',
        ],
        tradition_id: matchedTradition?.id,
      },
    });
  }

  return results.slice(0, 3);
}
