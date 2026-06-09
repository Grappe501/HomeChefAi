-- Kitchen Learning Engine v7 — Pillar 1: Taste & Preference Learner

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS taste_profile JSONB DEFAULT NULL;

COMMENT ON COLUMN profiles.taste_profile IS 'Inferred taste vector + explicit household preferences (KLE v7)';

CREATE TABLE IF NOT EXISTS meal_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_log_id UUID,
  meal_name TEXT NOT NULL,
  rating TEXT NOT NULL CHECK (rating IN ('loved', 'ok', 'never_again', 'too_hard', 'too_long')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meal_outcomes_user ON meal_outcomes(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_meal_outcomes_meal ON meal_outcomes(user_id, meal_name);

ALTER TABLE meal_outcomes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS meal_outcomes_all ON meal_outcomes;
CREATE POLICY meal_outcomes_all ON meal_outcomes
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE meal_outcomes IS 'Post-cook ratings — feeds taste profile inference (KLE v7)';
