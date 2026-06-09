/**
 * Skill Journey data model — UI hidden until Journey ships (Phase 7).
 */

import type { ConfidenceLevel } from './platform';

export type JourneyMilestoneId =
  | 'first_roux'
  | 'first_braise'
  | 'first_emulsion'
  | 'ten_techniques'
  | 'comfortable_saute';

export interface SkillJourneyProgress {
  id: string;
  user_id: string;
  technique_id: string;
  technique_name?: string;
  practice_count: number;
  comfort_level: ConfidenceLevel;
  last_practiced_at?: string;
  milestones_unlocked: JourneyMilestoneId[];
  metadata?: Record<string, unknown>;
  updated_at: string;
}

export interface JourneySummary {
  techniques_practiced: number;
  top_technique?: { id: string; name: string; count: number };
  recent_milestone?: JourneyMilestoneId;
  progress: SkillJourneyProgress[];
}

/** Coaching tip returned by skills API */
export interface TechniqueCoachTip {
  technique_id: string;
  technique_name: string;
  micro_lesson: string;
  skill_level: ConfidenceLevel;
  evidence: string[];
}
