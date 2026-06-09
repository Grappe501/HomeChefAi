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
