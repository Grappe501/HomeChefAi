-- Kitchen Learning Engine v7 — Pillar 4: Household Identity Learner

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS identity_profile JSONB DEFAULT NULL;

COMMENT ON COLUMN profiles.identity_profile IS 'Unified household kitchen identity from taste, rhythm, skill, and graph signals (KLE v7 Pillar 4)';
