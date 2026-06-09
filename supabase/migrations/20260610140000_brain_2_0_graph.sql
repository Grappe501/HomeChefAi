-- Brain 2.0 — household graph edges + inferred cooking style (Phase 5)

CREATE TABLE IF NOT EXISTS household_graph_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id UUID REFERENCES households(id) ON DELETE SET NULL,
  edge_type TEXT NOT NULL,
  from_key TEXT NOT NULL,
  to_key TEXT NOT NULL,
  weight NUMERIC NOT NULL DEFAULT 1,
  evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, edge_type, from_key, to_key)
);

CREATE INDEX IF NOT EXISTS idx_graph_edges_user ON household_graph_edges(user_id);
CREATE INDEX IF NOT EXISTS idx_graph_edges_type ON household_graph_edges(user_id, edge_type);

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS inferred_cooking_style JSONB DEFAULT '{}'::jsonb;

ALTER TABLE household_graph_edges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS graph_edges_own ON household_graph_edges;
CREATE POLICY graph_edges_own ON household_graph_edges FOR ALL USING (auth.uid() = user_id);

COMMENT ON TABLE household_graph_edges IS 'Brain 2.0 — household knowledge graph edges from receipts, usage, ledger';
