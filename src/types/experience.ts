export type ExperienceType = 'potluck' | 'dinner_party' | 'game_day' | 'holiday';

export interface TimelineStep {
  time: string;
  task: string;
  category: string;
  offset_hours: number;
}

export interface ExperienceMenuItem {
  course: string;
  name: string;
  description: string;
  prep_time_minutes: number;
  tags: string[];
}

export interface ExperiencePlanResult {
  experience_type: ExperienceType;
  hosting_knowledge_id: string;
  guest_count: number;
  start_time: string;
  menu: ExperienceMenuItem[];
  timeline: TimelineStep[];
  shopping_list: { name: string; quantity: number; unit: string; category?: string }[];
  evidence: string[];
  expert_ids: string[];
  summary: string;
}
