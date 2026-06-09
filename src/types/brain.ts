import type { MemoryType } from './platform';

export interface MemoryMetadata {
  source_events: string[];
  observation_count: number;
  history_days: number;
  computed_value?: number;
  computed_label?: string;
  confidence: number;
  formula: string;
  evidence_lines: string[];
  date_range_start?: string;
  date_range_end?: string;
  pattern_type?: string;
}

export interface BrainInsight {
  id: string;
  memory_type: MemoryType;
  subject_key: string;
  headline: string;
  insight: string;
  action_prompt?: string | null;
  confidence: number;
  metadata: MemoryMetadata;
  surfaced: boolean;
  created_at: string;
  updated_at: string;
}
