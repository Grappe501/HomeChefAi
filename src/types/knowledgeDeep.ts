/** Deep knowledge — history, origins, teaching (Layer 1+) */

export type DeepEntryKind =
  | 'ingredient'
  | 'technique'
  | 'dish'
  | 'style'
  | 'tradition'
  | 'flavor_profile'
  | 'culture'
  | 'food_source'
  | 'path';

export interface DeepTimelineEvent {
  when: string;
  event: string;
}

export type AcademyTrackType = 'career_ladder' | 'competition' | 'baking';

export interface AcademyModule {
  id: string;
  title: string;
  summary: string;
  techniques?: string[];
  flavors?: string[];
  flavor_profiles?: string[];
  ingredients?: string[];
  spices?: string[];
  cultures?: string[];
  practice_query?: string;
  teaching?: string[];
  time_limit_minutes?: number;
  judge_criteria?: string[];
  show_refs?: string[];
}

export interface AcademyLevel {
  id: string;
  rank: number;
  title: string;
  description: string;
  modules: AcademyModule[];
}

export interface DeepKnowledgeEntry {
  id: string;
  kind: DeepEntryKind;
  title: string;
  summary: string;
  knowledge_id?: string;
  match_keywords?: string[];
  origins: string;
  history: string;
  first_known?: string;
  timeline?: DeepTimelineEvent[];
  teaching: string[];
  fun_fact?: string;
  related_ids?: string[];
  /** Kitchen Academy featured track metadata */
  track_type?: AcademyTrackType;
  featured?: boolean;
  levels?: AcademyLevel[];
  shows_referenced?: string[];
}

export interface IngredientDeepDive {
  ingredient_name: string;
  knowledge_id?: string;
  title: string;
  origins?: string;
  history?: string;
  first_known?: string;
  teaching?: string[];
  fun_fact?: string;
  timeline?: DeepTimelineEvent[];
}

export interface DishContext {
  title: string;
  style?: string;
  origins_summary: string;
  approximate_age?: string;
  history?: string;
  teaching: string[];
  timeline?: DeepTimelineEvent[];
}
