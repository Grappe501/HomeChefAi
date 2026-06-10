/**
 * KLE v7 Pillar 3 — infer household skill growth from journey progress, cook logs, outcomes.
 */

import type { Profile } from '../../../../src/types/index.js';
import type { MealOutcome } from '../../../../src/types/tasteLearning.js';
import type { ConfidenceLevel } from '../../../../src/types/platform.js';
import type { JourneyMilestoneId } from '../../../../src/types/journey.js';
import type {
  SkillFocus,
  SkillGrowthNudge,
  SkillProfile,
  SkillStretch,
  TechniqueComfort,
} from '../../../../src/types/skillLearning.js';
import { getKnowledgeNode } from '../ai/knowledgeLoader.js';
import { inferTechniquesFromText, resolveSkillLevelFromCount } from '../ai/skills.js';
import type { SkillProgressRow } from '../ai/skillJourneyStore.js';

const CONFIDENCE_RANK: Record<ConfidenceLevel, number> = {
  beginner: 0,
  intermediate: 1,
  advanced: 2,
  expert: 3,
};

export interface SkillSourceData {
  profile: Profile;
  progressRows: SkillProgressRow[];
  usageLogs: {
    id: string;
    meal_name?: string;
    technique_ids?: string[];
    items_used?: { name: string }[];
    created_at: string;
  }[];
  mealOutcomes: MealOutcome[];
}

function techniqueName(techniqueId: string): string {
  return getKnowledgeNode(techniqueId)?.display_name ?? techniqueId.replace('technique.', '');
}

function mergeTechniqueCounts(data: SkillSourceData): Map<string, { count: number; lastAt: string }> {
  const map = new Map<string, { count: number; lastAt: string }>();

  for (const row of data.progressRows) {
    map.set(row.technique_id, {
      count: row.practice_count,
      lastAt: row.last_practiced_at ?? row.updated_at,
    });
  }

  for (const log of data.usageLogs) {
    const items = log.items_used?.map((i) => i.name) ?? [];
    const techniqueIds =
      log.technique_ids?.length ? log.technique_ids : inferTechniquesFromText(log.meal_name ?? '', items);
    for (const tid of techniqueIds) {
      const entry = map.get(tid) ?? { count: 0, lastAt: log.created_at };
      entry.count += 1;
      if (log.created_at > entry.lastAt) entry.lastAt = log.created_at;
      map.set(tid, entry);
    }
  }

  return map;
}

function toComfortEntries(map: Map<string, { count: number; lastAt: string }>): TechniqueComfort[] {
  return [...map.entries()]
    .map(([technique_id, data]) => ({
      technique_id,
      technique_name: techniqueName(technique_id),
      practice_count: data.count,
      comfort_level: resolveSkillLevelFromCount(data.count),
      last_practiced_at: data.lastAt,
    }))
    .sort((a, b) => b.practice_count - a.practice_count);
}

function inferStretchTechniques(data: SkillSourceData): SkillStretch[] {
  const stretch = new Map<string, number>();
  for (const outcome of data.mealOutcomes) {
    if (outcome.rating !== 'too_hard') continue;
    const inferred = inferTechniquesFromText(outcome.meal_name, []);
    for (const tid of inferred) {
      stretch.set(tid, (stretch.get(tid) ?? 0) + 1);
    }
  }
  return [...stretch.entries()]
    .map(([technique_id, too_hard_count]) => ({
      technique_id,
      technique_name: techniqueName(technique_id),
      too_hard_count,
    }))
    .sort((a, b) => b.too_hard_count - a.too_hard_count)
    .slice(0, 4);
}

function inferOverallConfidence(entries: TechniqueComfort[], profile: Profile): ConfidenceLevel {
  const self = profile.culinary_profile?.confidence;
  if (!entries.length) return self ?? 'beginner';
  const top = entries.slice(0, 5);
  const avgRank = top.reduce((s, e) => s + CONFIDENCE_RANK[e.comfort_level], 0) / top.length;
  if (avgRank >= 2.5) return 'expert';
  if (avgRank >= 1.5) return 'advanced';
  if (avgRank >= 0.8) return 'intermediate';
  return self ?? 'beginner';
}

function inferMilestones(entries: TechniqueComfort[]): JourneyMilestoneId[] {
  const milestones: JourneyMilestoneId[] = [];
  const byId = new Map(entries.map((e) => [e.technique_id, e]));

  if ((byId.get('technique.roux')?.practice_count ?? 0) >= 1) milestones.push('first_roux');
  if ((byId.get('technique.braise')?.practice_count ?? 0) >= 1) milestones.push('first_braise');
  if ((byId.get('technique.emulsion')?.practice_count ?? 0) >= 1) milestones.push('first_emulsion');
  if ((byId.get('technique.saute')?.practice_count ?? 0) >= 5) milestones.push('comfortable_saute');
  if (entries.filter((e) => e.practice_count >= 1).length >= 10) milestones.push('ten_techniques');

  return milestones;
}

function pickNextFocus(building: TechniqueComfort[], stretch: SkillStretch[]): SkillFocus | undefined {
  const candidate = building.find((t) => t.practice_count >= 1 && t.practice_count < 3);
  if (candidate) {
    const remaining = 3 - candidate.practice_count;
    return {
      technique_id: candidate.technique_id,
      technique_name: candidate.technique_name,
      message: `${remaining} more cook${remaining === 1 ? '' : 's'} to reach intermediate comfort with ${candidate.technique_name.toLowerCase()}.`,
    };
  }
  const hard = stretch[0];
  if (hard) {
    return {
      technique_id: hard.technique_id,
      technique_name: hard.technique_name,
      message: `${hard.technique_name} felt too hard recently — try a simpler version or ask for coaching.`,
    };
  }
  return undefined;
}

function buildGrowthNotes(params: {
  strong: TechniqueComfort[];
  building: TechniqueComfort[];
  stretch: SkillStretch[];
  milestones: JourneyMilestoneId[];
  overall: ConfidenceLevel;
  nextFocus?: SkillFocus;
}): string[] {
  const notes: string[] = [];
  if (params.strong.length) {
    notes.push(`Strong techniques: ${params.strong.slice(0, 3).map((t) => t.technique_name).join(', ')}.`);
  }
  if (params.building.length) {
    notes.push(`Building: ${params.building.slice(0, 3).map((t) => t.technique_name).join(', ')}.`);
  }
  if (params.milestones.length) {
    notes.push(`Milestones unlocked: ${params.milestones.length}.`);
  }
  if (params.nextFocus) notes.push(params.nextFocus.message);
  notes.push(`Overall kitchen confidence: ${params.overall}.`);
  return notes.slice(0, 5);
}

export function inferSkillProfile(data: SkillSourceData): SkillProfile {
  const counts = mergeTechniqueCounts(data);
  const all = toComfortEntries(counts);
  const strong_techniques = all.filter((t) => t.practice_count >= 3);
  const building_techniques = all.filter((t) => t.practice_count >= 1 && t.practice_count < 3);
  const stretch_techniques = inferStretchTechniques(data);
  const milestones = inferMilestones(all);
  const overall_confidence = inferOverallConfidence(all, data.profile);
  const next_focus = pickNextFocus(building_techniques, stretch_techniques);
  const growth_notes = buildGrowthNotes({
    strong: strong_techniques,
    building: building_techniques,
    stretch: stretch_techniques,
    milestones,
    overall: overall_confidence,
    nextFocus: next_focus,
  });

  return {
    version: 1,
    overall_confidence,
    techniques_practiced: all.filter((t) => t.practice_count >= 1).length,
    strong_techniques: strong_techniques.slice(0, 6),
    building_techniques: building_techniques.slice(0, 6),
    stretch_techniques,
    milestones,
    next_focus,
    growth_notes,
    updated_at: new Date().toISOString(),
  };
}

export function formatSkillProfileForPrompt(profile: SkillProfile): string {
  if (!profile.techniques_practiced && !profile.stretch_techniques.length) return '';
  const lines: string[] = ['Kitchen skills (learned):'];
  if (profile.strong_techniques.length) {
    lines.push(
      `Strong: ${profile.strong_techniques
        .slice(0, 4)
        .map((t) => `${t.technique_name} (${t.comfort_level}, ${t.practice_count} cooks)`)
        .join(', ')}.`,
    );
  }
  if (profile.building_techniques.length) {
    lines.push(`Building: ${profile.building_techniques.map((t) => t.technique_name).join(', ')}.`);
  }
  if (profile.stretch_techniques.length) {
    lines.push(
      `Stretch edges: ${profile.stretch_techniques.map((t) => `${t.technique_name} (too hard ${t.too_hard_count}x)`).join(', ')}.`,
    );
  }
  if (profile.next_focus) lines.push(`Growth focus: ${profile.next_focus.message}`);
  lines.push(`Overall confidence: ${profile.overall_confidence}.`);
  return lines.length > 1 ? lines.join('\n') : '';
}

export function buildSkillGrowthNudges(profile: SkillProfile): SkillGrowthNudge[] {
  const nudges: SkillGrowthNudge[] = [];

  if (profile.next_focus) {
    nudges.push({
      id: 'skill_focus',
      title: `Grow: ${profile.next_focus.technique_name}`,
      message: profile.next_focus.message,
      technique_id: profile.next_focus.technique_id,
      clara_prompt: `Coach me on ${profile.next_focus.technique_name.toLowerCase()} for tonight's meal.`,
    });
  }

  const rising = profile.building_techniques.find((t) => t.practice_count === 2);
  if (rising) {
    nudges.push({
      id: `building_${rising.technique_id}`,
      title: `${rising.technique_name} is clicking`,
      message: `You've cooked with ${rising.technique_name.toLowerCase()} twice — one more session builds real comfort.`,
      technique_id: rising.technique_id,
      clara_prompt: `Give me a weeknight meal to practice ${rising.technique_name.toLowerCase()}.`,
    });
  }

  const stretch = profile.stretch_techniques[0];
  if (stretch && nudges.length < 2) {
    nudges.push({
      id: `stretch_${stretch.technique_id}`,
      title: 'Simplify & retry',
      message: `${stretch.technique_name} felt too hard — Clara can suggest an easier path.`,
      technique_id: stretch.technique_id,
      clara_prompt: `Suggest an easier way to cook with ${stretch.technique_name.toLowerCase()}.`,
    });
  }

  return nudges.slice(0, 2);
}

export function techniqueComfortMap(profile: SkillProfile): Record<string, ConfidenceLevel> {
  const map: Record<string, ConfidenceLevel> = {};
  for (const t of [...profile.strong_techniques, ...profile.building_techniques]) {
    map[t.technique_id] = t.comfort_level;
  }
  return map;
}
