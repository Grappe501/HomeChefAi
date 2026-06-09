/** Inventory Steward — Phase 1 AI-managed inventory */

export type InventoryDeltaAction = 'add' | 'subtract' | 'set' | 'remove';

export interface InventoryDelta {
  action: InventoryDeltaAction;
  name: string;
  quantity?: number;
  unit?: string;
  item_id?: string;
  reason?: string;
}

export interface DuplicateGroup {
  id: string;
  item_ids: string[];
  names: string[];
  knowledge_id?: string;
  suggested_keep_id: string;
  reason: string;
}

export interface MislocationSuggestion {
  item_id: string;
  name: string;
  current: string;
  suggested: 'pantry' | 'fridge' | 'freezer';
}

export interface LowStockItem {
  item_id: string;
  name: string;
  quantity: number;
  unit: string;
  threshold: number;
}

export interface AuditFinding {
  id: string;
  severity: 'info' | 'warn' | 'action';
  title: string;
  message: string;
  item_ids?: string[];
  clara_prompt?: string;
}

export interface StewardPreview {
  duplicates: DuplicateGroup[];
  mislocated: MislocationSuggestion[];
  low_stock: LowStockItem[];
  expiring: { item_id: string; name: string; expiration_date: string; days_left: number }[];
  findings: AuditFinding[];
  generated_at: string;
}

export interface StewardAuditResult {
  preview: StewardPreview;
  narrative?: string;
  credit_cost?: number;
}

/** Staged pantry changes awaiting user confirm in Clara chat */
export interface PendingInventoryDelta {
  deltas: InventoryDelta[];
  summary?: string;
}

/** Cook log style usage confirm from Clara */
export interface PendingUsageConfirm {
  items: { name: string; quantity: number; unit: string }[];
  meal_label?: string;
}
