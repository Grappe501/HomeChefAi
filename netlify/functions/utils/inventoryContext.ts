/**
 * Inventory formatting with knowledge_id for AI context (Phase 3/4).
 */

import type { InventoryItem } from '../../../src/types/index.js';
import { resolveWizardKnowledgeIdSimple } from '../../../src/types/knowledgeIdCore.js';

export interface InventoryKnowledgeEntry {
  name: string;
  quantity: number;
  unit: string;
  knowledge_id?: string;
  taxonomy_id?: string;
  location?: string;
}

export function resolveIngredientKnowledgeId(
  ingredientName: string,
  inventory: InventoryItem[],
): string | undefined {
  const lower = ingredientName.toLowerCase().trim();
  for (const item of inventory) {
    const name = item.name.toLowerCase().trim();
    if (name === lower || name.includes(lower) || lower.includes(name)) {
      return item.knowledge_id ?? resolveWizardKnowledgeIdSimple(item.name);
    }
  }
  return resolveWizardKnowledgeIdSimple(ingredientName);
}

export function buildInventoryKnowledgeIndex(inventory: InventoryItem[]): Map<string, InventoryKnowledgeEntry> {
  const map = new Map<string, InventoryKnowledgeEntry>();
  for (const item of inventory) {
    const entry: InventoryKnowledgeEntry = {
      name: item.name,
      quantity: Number(item.quantity),
      unit: item.unit,
      knowledge_id: item.knowledge_id ?? resolveWizardKnowledgeIdSimple(item.name),
      taxonomy_id: item.taxonomy_id,
      location: item.location,
    };
    map.set(item.name.toLowerCase().trim(), entry);
  }
  return map;
}

/** Clara-facing pantry block with knowledge ids */
export function formatInventoryForAI(inventory: InventoryItem[], limit = 48): string {
  const lines = inventory.slice(0, limit).map((i) => {
    const kid = i.knowledge_id ?? resolveWizardKnowledgeIdSimple(i.name);
    const tax = i.taxonomy_id ? ` taxonomy:${i.taxonomy_id}` : '';
    return `- ${i.name}: ${i.quantity} ${i.unit} [${kid}]${tax}`;
  });
  if (inventory.length > limit) {
    lines.push(`- …and ${inventory.length - limit} more items`);
  }
  return lines.join('\n') || 'Empty pantry';
}

export function formatInventorySummary(inventory: InventoryItem[]): string {
  const withKid = inventory.filter((i) => i.knowledge_id).length;
  return `${inventory.length} items (${withKid} linked to knowledge graph)`;
}

export function listAvailableKnowledgeIds(inventory: InventoryItem[]): string[] {
  return inventory
    .map((i) => i.knowledge_id ?? resolveWizardKnowledgeIdSimple(i.name))
    .filter((id, idx, arr) => arr.indexOf(id) === idx);
}
