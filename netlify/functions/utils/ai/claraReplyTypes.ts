/**
 * Shared Clara router / agent loop reply shape (avoids circular imports).
 */

import type { MealDirection } from '../../../../src/types/mealDirections.js';
import type { ExpertOutput } from './expertSynthesis.js';

export interface ClaraRoutedReply {
  reply: string;
  suggested_items?: { name: string; quantity: number; unit: string }[];
  action?: string;
  directions?: MealDirection[];
  intent?: string;
  evidence?: string[];
  expert_ids?: string[];
  expert_outputs?: ExpertOutput[];
  tools_used?: string[];
  synthesis?: boolean;
  agent_steps?: number;
  search_mode?: 'hybrid' | 'bm25' | 'pantry';
}

export type AgentStreamEvent =
  | { type: 'step'; step: number; max_steps: number }
  | { type: 'tool_start'; tool: string; step: number }
  | { type: 'tool_done'; tool: string; preview: string; step: number }
  | { type: 'synthesis'; expert_count: number }
  | { type: 'reply'; reply: Partial<ClaraRoutedReply> };
