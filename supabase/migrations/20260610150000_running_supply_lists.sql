-- Running grocery / supply list — persists checked state and manual items across sessions

CREATE TABLE IF NOT EXISTS running_supply_lists (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID,
  plan_title TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  estimated_cost NUMERIC,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE running_supply_lists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS running_supply_lists_all ON running_supply_lists;
CREATE POLICY running_supply_lists_all ON running_supply_lists
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
