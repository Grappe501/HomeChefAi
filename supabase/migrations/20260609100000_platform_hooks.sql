-- Platform hooks: Cook Together, Culinary Profile, Recipe Identity, Social (reserved)
-- Behavior built in later phases; schema ready now.

-- ─── Households (Cook Together) ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  display_name TEXT,
  invite_code TEXT UNIQUE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS household_members (
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  display_name TEXT,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (household_id, user_id)
);

CREATE TABLE IF NOT EXISTS household_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  invite_code TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ,
  max_uses INT DEFAULT 10,
  use_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Future: live collaborative cook sessions
CREATE TABLE IF NOT EXISTS cook_together_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  started_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  meal_name TEXT,
  status TEXT DEFAULT 'active',
  participant_ids UUID[] DEFAULT '{}',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_household_members_user ON household_members(user_id);
CREATE INDEX IF NOT EXISTS idx_household_invites_code ON household_invites(invite_code);

-- ─── Profile extensions ───────────────────────────────────────────────────

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS household_id UUID REFERENCES households(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS household_display_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS kitchen_identity JSONB DEFAULT '{}'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS culinary_profile JSONB DEFAULT '{}'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS assistant_persona JSONB DEFAULT '{"name":"Sous Chef","communication_style":"encourager"}'::jsonb;

-- ─── Recipe identity + social hooks (Cookbook Social 1.0) ─────────────────

ALTER TABLE recipes ADD COLUMN IF NOT EXISTS creator_first_name TEXT;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS creator_last_name TEXT;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS household_name TEXT;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'original';
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS origin_recipe_id UUID REFERENCES recipes(id);
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS root_recipe_id UUID REFERENCES recipes(id);
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS version_number INT DEFAULT 1;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS recipe_story TEXT;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS ranking_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS variations_open BOOLEAN DEFAULT FALSE;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS feedback_open BOOLEAN DEFAULT FALSE;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS shares_count INT DEFAULT 0;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS tries_count INT DEFAULT 0;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS variations_count INT DEFAULT 0;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS plate_score NUMERIC(4,2);
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS kitchen_cred INT DEFAULT 0;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS skill_level TEXT;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS skills_taught JSONB DEFAULT '[]'::jsonb;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS archetype_tags JSONB DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS recipe_tries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vibe TEXT NOT NULL,
  changes_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(recipe_id, user_id)
);

CREATE TABLE IF NOT EXISTS recipe_variations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  root_recipe_id UUID REFERENCES recipes(id),
  author_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  co_author_ids UUID[] DEFAULT '{}',
  variation_title TEXT NOT NULL,
  changes_narrative TEXT,
  ingredient_diff JSONB DEFAULT '{}'::jsonb,
  recipe_id UUID REFERENCES recipes(id),
  tries_count INT DEFAULT 0,
  plate_score NUMERIC(4,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recipe_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel TEXT DEFAULT 'link',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── RLS ──────────────────────────────────────────────────────────────────

ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE cook_together_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_tries ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_variations ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_shares ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS households_member ON households;
CREATE POLICY households_member ON households FOR SELECT
  USING (id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid()) OR created_by = auth.uid());

DROP POLICY IF EXISTS households_insert ON households;
CREATE POLICY households_insert ON households FOR INSERT WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS households_invite_read ON households;
CREATE POLICY households_invite_read ON households FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS household_members_own ON household_members;
CREATE POLICY household_members_own ON household_members FOR SELECT
  USING (household_id IN (SELECT household_id FROM household_members hm WHERE hm.user_id = auth.uid()));

DROP POLICY IF EXISTS household_members_insert ON household_members;
CREATE POLICY household_members_insert ON household_members FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS recipe_tries_all ON recipe_tries;
CREATE POLICY recipe_tries_all ON recipe_tries FOR ALL USING (auth.uid() = user_id);
CREATE POLICY recipe_tries_read ON recipe_tries FOR SELECT
  USING (recipe_id IN (SELECT id FROM recipes WHERE is_public = TRUE OR user_id = auth.uid()));

DROP POLICY IF EXISTS recipe_variations_read ON recipe_variations;
CREATE POLICY recipe_variations_read ON recipe_variations FOR SELECT USING (TRUE);
CREATE POLICY recipe_variations_write ON recipe_variations FOR ALL USING (auth.uid() = author_user_id);

DROP POLICY IF EXISTS recipe_shares_own ON recipe_shares;
CREATE POLICY recipe_shares_own ON recipe_shares FOR ALL USING (auth.uid() = user_id);
