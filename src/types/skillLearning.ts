/** Kitchen Learning Engine v7 — Pillar 3: Skill & Growth Learner */

import type { ConfidenceLevel } from './platform';
import type { JourneyMilestoneId } from './journey';

export interface TechniqueComfort {
  technique_id: string;
  technique_name: string;
  practice_count: number;
  comfort_level: ConfidenceLevel;
  last_practiced_at?: string;
}

export interface SkillStretch {
  technique_id: string;
  technique_name: string;
  too_hard_count: number;
}

export interface SkillFocus {
  technique_id: string;
  technique_name: string;
  message: string;
}

export interface SkillProfile {
  version: number;
  overall_confidence: ConfidenceLevel;
  techniques_practiced: number;
  strong_techniques: TechniqueComfort[];
  building_techniques: TechniqueComfort[];
  stretch_techniques: SkillStretch[];
  milestones: JourneyMilestoneId[];
  next_focus?: SkillFocus;
  growth_notes?: string[];
  updated_at: string;
}

export interface SkillGrowthNudge {
  id: string;
  title: string;
  message: string;
  clara_prompt?: string;
  technique_id?: string;
}
