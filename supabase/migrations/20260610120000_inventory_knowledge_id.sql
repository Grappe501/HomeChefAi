-- Phase 2: link inventory rows to kitchen knowledge registry
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS knowledge_id TEXT;
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS taxonomy_id TEXT;

CREATE INDEX IF NOT EXISTS idx_inventory_knowledge ON inventory_items(user_id, knowledge_id)
  WHERE knowledge_id IS NOT NULL;

COMMENT ON COLUMN inventory_items.knowledge_id IS 'Registry node id e.g. ingredient.paprika.smoked';
COMMENT ON COLUMN inventory_items.taxonomy_id IS 'Food taxonomy id e.g. cheese.mozzarella';
