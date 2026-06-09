-- Success Engine + Brain memory type hooks (behavior built later)
-- See docs/NORTH_STAR.md

CREATE TABLE IF NOT EXISTS household_food_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id UUID REFERENCES households(id),
  score_date DATE NOT NULL DEFAULT CURRENT_DATE,
  home_cooked_meals INT DEFAULT 0,
  family_meals_together INT DEFAULT 0,
  estimated_savings NUMERIC(10,2) DEFAULT 0,
  waste_prevented_lbs NUMERIC(8,2) DEFAULT 0,
  skills_learned JSONB DEFAULT '[]'::jsonb,
  local_food_actions INT DEFAULT 0,
  composite_score NUMERIC(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, score_date)
);

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS food_priorities JSONB DEFAULT '[]'::jsonb;

COMMENT ON TABLE household_food_scores IS 'Household Food Success Engine — monthly wins tracking. Hidden until Success Engine 1.0.';

-- Document reserved household_memories.memory_type values for Brain 1.0A:
-- preference, consumption, waste, habit, shopping, family_preference, tradition, local_food, skill_learned

ALTER TABLE household_food_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS food_scores_own ON household_food_scores;
CREATE POLICY food_scores_own ON household_food_scores FOR ALL USING (auth.uid() = user_id);
