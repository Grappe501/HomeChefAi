/**
 * Kitchen Knowledge Registry — node schema (Layer 1).
 * Files live under H:/HomeChefAi/data/ai/
 */

export type KnowledgeNodeType =
  | 'ingredient'
  | 'technique'
  | 'cuisine'
  | 'meal_pattern'
  | 'substitution'
  | 'flavor_profile'
  | 'food_science'
  | 'nutrition'
  | 'hosting'
  | 'culture'
  | 'tradition';

/** Why a substitute is suggested */
export type SubstitutionReason =
  | 'missing'
  | 'vegan'
  | 'vegetarian'
  | 'dairy_free'
  | 'gluten_free'
  | 'nut_free'
  | 'egg_free'
  | 'low_sodium';

export const SUBSTITUTION_REASONS: SubstitutionReason[] = [
  'missing',
  'vegan',
  'vegetarian',
  'dairy_free',
  'gluten_free',
  'nut_free',
  'egg_free',
  'low_sodium',
];

export interface DietaryProfile {
  vegan?: boolean;
  vegetarian?: boolean;
  contains_dairy?: boolean;
  contains_meat?: boolean;
  contains_eggs?: boolean;
  contains_gluten?: boolean;
  contains_nuts?: boolean;
  contains_fish?: boolean;
}

export interface KnowledgeSubstituteRef {
  id: string;
  note?: string;
  ratio?: string;
  /** When set, only applies for these reasons (default: missing) */
  reasons?: SubstitutionReason[];
  confidence?: number;
}

export interface KnowledgeVariant {
  id: string;
  label: string;
}

export interface KnowledgeNode {
  id: string;
  type: KnowledgeNodeType;
  display_name: string;
  parent_id?: string;
  description?: string;
  attributes?: Record<string, unknown> & {
    variants?: KnowledgeVariant[];
    substitutes?: KnowledgeSubstituteRef[];
    pairings?: string[];
    cuisine_tags?: string[];
    regional_uses?: string[];
    staples?: string[];
    rules?: string[];
    examples?: string[];
    micro_lesson?: string;
    steps?: string[];
    /** Ingredient dietary flags */
    dietary?: DietaryProfile;
    /** Pantry wizard item name bridge (Phase 2) */
    wizard_item?: string;
    /** Taxonomy family id bridge */
    taxonomy_family?: string;
    /** Substitution edge fields */
    from_id?: string;
    to_id?: string;
    reasons?: SubstitutionReason[];
    note?: string;
    ratio?: string;
    confidence?: number;
  };
  sources?: string[];
}

export interface KnowledgeSearchResult {
  id: string;
  type: KnowledgeNodeType;
  display_name: string;
  score: number;
}

export interface SubstitutionSuggestion {
  id: string;
  display_name: string;
  reason: SubstitutionReason;
  note?: string;
  ratio?: string;
  confidence: number;
  source: 'direct' | 'edge' | 'dietary' | 'taxonomy';
}

export interface SubstitutionResponse {
  from_id: string;
  from_name: string;
  reason: SubstitutionReason;
  suggestions: SubstitutionSuggestion[];
  /** True when source ingredient already satisfies the dietary constraint */
  already_satisfies?: boolean;
  /** When a variant inherits substitutes from a parent node */
  resolved_from?: string;
}

export interface KnowledgeLookupResponse {
  node?: KnowledgeNode;
  substitutes?: KnowledgeNode[];
  related?: KnowledgeNode[];
}
