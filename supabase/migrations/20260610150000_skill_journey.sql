-- Phase 7 — Skill journey + technique tags on cook logs

ALTER TABLE usage_logs ADD COLUMN IF NOT EXISTS technique_ids JSONB DEFAULT '[]'::jsonb;
ALTER TABLE usage_logs ADD COLUMN IF NOT EXISTS skill_metadata JSONB DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS skill_journey_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  technique_id TEXT NOT NULL,
  practice_count INT NOT NULL DEFAULT 0,
  comfort_level TEXT NOT NULL DEFAULT 'beginner',
  last_practiced_at TIMESTAMPTZ,
  milestones_unlocked JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, technique_id)
);

CREATE INDEX IF NOT EXISTS idx_skill_journey_user ON skill_journey_progress(user_id);

ALTER TABLE skill_journey_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS skill_journey_own ON skill_journey_progress;
CREATE POLICY skill_journey_own ON skill_journey_progress FOR ALL USING (auth.uid() = user_id);

COMMENT ON TABLE skill_journey_progress IS 'Phase 7 — skill journey data layer (UI hidden)';
