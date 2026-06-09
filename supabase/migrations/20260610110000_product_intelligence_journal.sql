-- Product Intelligence Journal 1.0 — founder-only observations

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_founder BOOLEAN DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS product_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note_type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'archived')),
  related_area TEXT,
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  linked_feature_id UUID,
  brain_version TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_notes_created ON product_notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_notes_type ON product_notes(note_type);
CREATE INDEX IF NOT EXISTS idx_product_notes_status ON product_notes(status);
CREATE INDEX IF NOT EXISTS idx_product_notes_tags ON product_notes USING GIN (tags);

CREATE TABLE IF NOT EXISTS feature_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  source_note_id UUID REFERENCES product_notes(id) ON DELETE SET NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'done', 'wont_do')),
  related_area TEXT,
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feature_requests_status ON feature_requests(status);

DO $$ BEGIN
  ALTER TABLE product_notes ADD CONSTRAINT product_notes_linked_feature_fkey
    FOREIGN KEY (linked_feature_id) REFERENCES feature_requests(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE product_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS product_notes_founder ON product_notes;
CREATE POLICY product_notes_founder ON product_notes FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.is_founder = TRUE))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.is_founder = TRUE));

DROP POLICY IF EXISTS feature_requests_founder ON feature_requests;
CREATE POLICY feature_requests_founder ON feature_requests FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.is_founder = TRUE))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.is_founder = TRUE));

COMMENT ON TABLE product_notes IS 'Founder Product Intelligence Journal — admin only';
COMMENT ON TABLE feature_requests IS 'Build queue items converted from product notes';
