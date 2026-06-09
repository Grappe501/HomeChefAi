export type ProductNoteType =
  | 'bug'
  | 'ux_problem'
  | 'insight'
  | 'future_feature'
  | 'brain_observation'
  | 'customer_observation'
  | 'competitive_idea';

export type NotePriority = 'low' | 'medium' | 'high';
export type NoteStatus = 'open' | 'in_progress' | 'resolved' | 'archived';

export interface ProductNote {
  id: string;
  created_by: string;
  note_type: ProductNoteType;
  title: string;
  body: string;
  priority: NotePriority;
  status: NoteStatus;
  related_area?: string | null;
  tags: string[];
  linked_feature_id?: string | null;
  brain_version?: string | null;
  resolved_at?: string | null;
  created_at: string;
  updated_at: string;
}

export const NOTE_TYPES: { id: ProductNoteType; label: string }[] = [
  { id: 'bug', label: 'Bug' },
  { id: 'ux_problem', label: 'UX Problem' },
  { id: 'insight', label: 'Insight' },
  { id: 'future_feature', label: 'Future Feature' },
  { id: 'brain_observation', label: 'Brain Observation' },
  { id: 'customer_observation', label: 'Customer Observation' },
  { id: 'competitive_idea', label: 'Competitive Idea' },
];

export const RELATED_AREAS = [
  'brain',
  'inventory',
  'receipt',
  'assistant',
  'cookbook',
  'meal_plan',
  'experience',
  'marketing',
  'brand',
  'pricing',
  'general',
] as const;

export const NOTE_STATUSES: { id: NoteStatus; label: string }[] = [
  { id: 'open', label: 'Open' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'resolved', label: 'Resolved' },
  { id: 'archived', label: 'Archived' },
];
