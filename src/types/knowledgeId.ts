/**
 * Resolve pantry wizard / taxonomy selections → knowledge registry ids.
 * Phase 2 · SOUSCHEF-AI-FOUNDATION-1.0
 */

import type { FoodTaxonomySelection } from './foodTaxonomy';
import { getTaxonomyFamilyByWizardItem } from './foodTaxonomy';
import {
  WIZARD_KNOWLEDGE_OVERRIDES,
  taxonomySelectionToKnowledgeId,
  resolveWizardKnowledgeIdSimple,
} from './knowledgeIdCore';

export {
  WIZARD_KNOWLEDGE_OVERRIDES,
  taxonomySelectionToKnowledgeId,
  wizardItemToSlug,
  knowledgeIdParentChain,
} from './knowledgeIdCore';

export interface ResolvedInventoryKnowledge {
  knowledge_id: string;
  taxonomy_id?: string;
}

/**
 * Resolve knowledge_id (and optional taxonomy_id) for a pantry wizard save.
 */
export function resolveWizardInventoryKnowledge(
  wizardItemName: string,
  taxonomySelection?: FoodTaxonomySelection | null,
): ResolvedInventoryKnowledge {
  if (taxonomySelection) {
    return {
      knowledge_id: taxonomySelectionToKnowledgeId(taxonomySelection),
      taxonomy_id: taxonomySelection.taxonomy_id,
    };
  }

  const override = WIZARD_KNOWLEDGE_OVERRIDES[wizardItemName];
  if (override) {
    return { knowledge_id: override };
  }

  const family = getTaxonomyFamilyByWizardItem(wizardItemName);
  if (family) {
    return { knowledge_id: `ingredient.${family.id}` };
  }

  return { knowledge_id: resolveWizardKnowledgeIdSimple(wizardItemName) };
}
