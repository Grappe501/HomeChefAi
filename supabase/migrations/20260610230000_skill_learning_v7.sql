-- Kitchen Learning Engine v7 — Pillar 3: Skill & Growth Learner

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS skill_profile JSONB DEFAULT NULL;

COMMENT ON COLUMN profiles.skill_profile IS 'Inferred technique comfort, milestones, growth edges (KLE v7 Pillar 3)';
