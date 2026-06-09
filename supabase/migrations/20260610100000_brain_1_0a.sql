-- Brain 1.0A — Memories, consumption, waste, grocery intelligence

CREATE TABLE IF NOT EXISTS household_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id UUID REFERENCES households(id) ON DELETE SET NULL,
  memory_type TEXT NOT NULL,
  subject_key TEXT NOT NULL,
  headline TEXT NOT NULL,
  insight TEXT NOT NULL,
  action_prompt TEXT,
  confidence NUMERIC NOT NULL DEFAULT 0 CHECK (confidence >= 0 AND confidence <= 1),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  surfaced BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, memory_type, subject_key)
);

CREATE INDEX IF NOT EXISTS idx_memories_user ON household_memories(user_id);
CREATE INDEX IF NOT EXISTS idx_memories_household ON household_memories(household_id);
CREATE INDEX IF NOT EXISTS idx_memories_surfaced ON household_memories(user_id, surfaced);

CREATE TABLE IF NOT EXISTS consumption_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id UUID REFERENCES households(id) ON DELETE SET NULL,
  item_name TEXT NOT NULL,
  item_key TEXT NOT NULL,
  purchase_count INT NOT NULL DEFAULT 0,
  avg_cycle_days NUMERIC,
  last_purchase_at TIMESTAMPTZ,
  first_purchase_at TIMESTAMPTZ,
  source_receipt_ids JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, item_key)
);

CREATE INDEX IF NOT EXISTS idx_consumption_user ON consumption_cycles(user_id);

CREATE TABLE IF NOT EXISTS waste_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id UUID REFERENCES households(id) ON DELETE SET NULL,
  item_name TEXT NOT NULL,
  item_key TEXT NOT NULL,
  quantity NUMERIC DEFAULT 1,
  reason TEXT DEFAULT 'discarded',
  inventory_item_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_waste_user ON waste_events(user_id);
CREATE INDEX IF NOT EXISTS idx_waste_item ON waste_events(user_id, item_key);

CREATE TABLE IF NOT EXISTS grocery_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id UUID REFERENCES households(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  quantity NUMERIC DEFAULT 1,
  unit TEXT DEFAULT 'each',
  source TEXT DEFAULT 'brain',
  reason TEXT,
  memory_id UUID REFERENCES household_memories(id) ON DELETE SET NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_grocery_user ON grocery_list_items(user_id);

CREATE TABLE IF NOT EXISTS recommendation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id UUID REFERENCES households(id) ON DELETE SET NULL,
  memory_id UUID REFERENCES household_memories(id) ON DELETE CASCADE,
  surfaced_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE household_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE consumption_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE waste_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE grocery_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS memories_own ON household_memories;
CREATE POLICY memories_own ON household_memories FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS consumption_own ON consumption_cycles;
CREATE POLICY consumption_own ON consumption_cycles FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS waste_own ON waste_events;
CREATE POLICY waste_own ON waste_events FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS grocery_own ON grocery_list_items;
CREATE POLICY grocery_own ON grocery_list_items FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS rec_history_own ON recommendation_history;
CREATE POLICY rec_history_own ON recommendation_history FOR ALL USING (auth.uid() = user_id);

COMMENT ON TABLE household_memories IS 'Brain 1.0A — deterministic household food memories with provenance';
