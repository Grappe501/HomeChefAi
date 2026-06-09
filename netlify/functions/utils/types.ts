import type {
  User,
  Profile,
  InventoryItem,
  Receipt,
  MealPlan,
  UsageLog,
  CalendarEvent,
} from '../../../src/types/index';

export interface DecisionLedgerRow {
  id: string;
  user_id: string;
  household_id?: string;
  subject_key: string;
  domain: string;
  recommendation: string;
  why?: string;
  evidence: string[];
  confidence: number;
  expert_ids: string[];
  outcome: string;
  outcome_at?: string;
  metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

export interface DevStore {
  users: User[];
  profiles: Profile[];
  inventory_items: InventoryItem[];
  receipts: Receipt[];
  meal_plans: MealPlan[];
  usage_logs: UsageLog[];
  calendar_events: CalendarEvent[];
  achievements: { id: string; user_id: string; achievement_key: string; unlocked_at: string }[];
  household_memories?: BrainStoredMemory[];
  waste_events?: BrainWasteRow[];
  decision_ledger?: DecisionLedgerRow[];
  household_graph_edges?: HouseholdGraphEdgeRow[];
}

export interface HouseholdGraphEdgeRow {
  id: string;
  user_id: string;
  household_id?: string;
  edge_type: string;
  from_key: string;
  to_key: string;
  weight: number;
  evidence: string[];
  metadata?: Record<string, unknown>;
  updated_at: string;
}

export interface BrainStoredMemory {
  id: string;
  user_id: string;
  household_id?: string;
  memory_type: string;
  subject_key: string;
  headline: string;
  insight: string;
  action_prompt?: string;
  confidence: number;
  metadata: Record<string, unknown>;
  surfaced: boolean;
  created_at: string;
  updated_at: string;
}

export interface BrainWasteRow {
  id: string;
  item_name: string;
  item_key: string;
  created_at: string;
}

export const emptyStore = (): DevStore => ({
  users: [],
  profiles: [],
  inventory_items: [],
  receipts: [],
  meal_plans: [],
  usage_logs: [],
  calendar_events: [],
  achievements: [],
});
