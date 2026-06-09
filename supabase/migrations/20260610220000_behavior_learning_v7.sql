-- Kitchen Learning Engine v7 — Pillar 2: Behavior & Rhythm Learner

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS behavior_profile JSONB DEFAULT NULL;

COMMENT ON COLUMN profiles.behavior_profile IS 'Inferred cook rhythm, shop day, budget band, time budget (KLE v7 Pillar 2)';
