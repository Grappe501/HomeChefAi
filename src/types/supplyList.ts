import type { SupplyGroup } from '@/lib/supplyPlan';

export type SupplyItemSource = 'meal_plan' | 'manual' | 'pantry_low' | 'hosting';

export interface SupplyListItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  estimated_price?: number;
  supply_group?: SupplyGroup;
  checked?: boolean;
  source?: SupplyItemSource;
  plan_id?: string;
  notes?: string;
}

export interface RunningSupplyList {
  user_id: string;
  plan_id?: string;
  plan_title?: string;
  items: SupplyListItem[];
  estimated_cost?: number;
  updated_at: string;
}
