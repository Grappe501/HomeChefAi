import type {
  User,
  Profile,
  InventoryItem,
  Receipt,
  MealPlan,
  UsageLog,
  CalendarEvent,
} from '../../../src/types/index';

export interface DevStore {
  users: User[];
  profiles: Profile[];
  inventory_items: InventoryItem[];
  receipts: Receipt[];
  meal_plans: MealPlan[];
  usage_logs: UsageLog[];
  calendar_events: CalendarEvent[];
  achievements: { id: string; user_id: string; achievement_key: string; unlocked_at: string }[];
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
