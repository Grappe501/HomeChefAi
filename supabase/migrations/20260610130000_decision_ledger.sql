-- Phase 3: Decision Ledger — Clara learns from Keep/Replace outcomes
CREATE TABLE IF NOT EXISTS decision_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_key TEXT NOT NULL,
  domain TEXT NOT NULL,
  recommendation TEXT NOT NULL,
  why TEXT,
  evidence JSONB DEFAULT '[]'::jsonb,
  confidence NUMERIC DEFAULT 0.7,
  expert_ids JSONB DEFAULT '[]'::jsonb,
  outcome TEXT DEFAULT 'pending',
  outcome_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, subject_key)
);

CREATE INDEX IF NOT EXISTS idx_decision_ledger_user ON decision_ledger(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_decision_ledger_domain ON decision_ledger(user_id, domain);

ALTER TABLE decision_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS decision_ledger_all ON decision_ledger;
CREATE POLICY decision_ledger_all ON decision_ledger
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE decision_ledger IS 'Clara decision audit — meal Keep/Replace, substitutions, chat recommendations';
