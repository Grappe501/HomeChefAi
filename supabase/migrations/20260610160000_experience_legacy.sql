-- Phase 8 — Experience + Legacy: recipe lineage fields

ALTER TABLE recipes ADD COLUMN IF NOT EXISTS origin_recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS serve_count INT NOT NULL DEFAULT 0;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS last_served_at TIMESTAMPTZ;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS tradition_id TEXT;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS lineage JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_recipes_serve_count ON recipes(user_id, serve_count DESC);

COMMENT ON COLUMN recipes.serve_count IS 'Times this recipe was cooked/served from cook log';
