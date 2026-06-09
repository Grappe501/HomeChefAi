-- Experience Engine + Dinner Club + Wine/Bourbon hooks (behavior built later)
-- See docs/NORTH_STAR.md — Experience Engine section

-- ─── Dinner Club (socially connected rotating hosts) ─────────────────────

CREATE TABLE IF NOT EXISTS dinner_clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_code TEXT UNIQUE,
  rotation_order UUID[] DEFAULT '{}',
  member_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dinner_club_members (
  club_id UUID NOT NULL REFERENCES dinner_clubs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id UUID REFERENCES households(id),
  display_name TEXT NOT NULL,
  role TEXT DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (club_id, user_id)
);

-- Each monthly/event gathering — menu, timeline, wine, bring-list visible to all members
CREATE TABLE IF NOT EXISTS dinner_club_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES dinner_clubs(id) ON DELETE CASCADE,
  host_user_id UUID NOT NULL REFERENCES auth.users(id),
  host_household_id UUID REFERENCES households(id),
  event_date TIMESTAMPTZ NOT NULL,
  experience_type TEXT DEFAULT 'dinner_club',
  occasion TEXT,
  theme TEXT,
  guest_count INT DEFAULT 8,
  menu JSONB DEFAULT '{}'::jsonb,
  timeline JSONB DEFAULT '[]'::jsonb,
  shopping_list JSONB DEFAULT '[]'::jsonb,
  wine_plan JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'planning',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- What each member brings — socially visible to the club
CREATE TABLE IF NOT EXISTS dinner_club_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES dinner_club_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contribution_type TEXT NOT NULL,
  item_name TEXT NOT NULL,
  quantity TEXT,
  notes TEXT,
  confirmed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id, contribution_type, item_name)
);

-- ─── Experience templates (Dinner Party Mode, etc.) ───────────────────────

CREATE TABLE IF NOT EXISTS experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id UUID REFERENCES households(id),
  club_id UUID REFERENCES dinner_clubs(id),
  experience_type TEXT NOT NULL,
  occasion TEXT,
  title TEXT NOT NULL,
  guest_count INT,
  skill_level TEXT,
  budget NUMERIC(10,2),
  theme TEXT,
  menu JSONB DEFAULT '{}'::jsonb,
  timeline JSONB DEFAULT '[]'::jsonb,
  wine_plan JSONB DEFAULT '{}'::jsonb,
  dietary_notes JSONB DEFAULT '[]'::jsonb,
  is_public BOOLEAN DEFAULT FALSE,
  shares_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reserved experience_type values:
-- weeknight, family_dinner, date_night, dinner_party, potluck, holiday,
-- game_day, bbq, leftover_masterpiece, seasonal, farm_to_table, dinner_club, special_occasion

-- ─── Wine & spirits (cellar + pairing hooks) ──────────────────────────────

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wine_preferences JSONB DEFAULT '{}'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS spirits_preferences JSONB DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS cellar_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id UUID REFERENCES households(id),
  item_type TEXT NOT NULL DEFAULT 'wine',
  name TEXT NOT NULL,
  producer TEXT,
  varietal TEXT,
  region TEXT,
  vintage INT,
  quantity INT DEFAULT 1,
  price_paid NUMERIC(10,2),
  price_tier TEXT,
  rating NUMERIC(3,1),
  pairing_tags JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  location TEXT DEFAULT 'cellar',
  opened_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- item_type: wine | bourbon | whiskey | spirits
-- wine_plan JSONB shape: { pairings: [], budget_tier, from_cellar: [], to_buy: [] }

CREATE INDEX IF NOT EXISTS idx_dinner_club_members_user ON dinner_club_members(user_id);
CREATE INDEX IF NOT EXISTS idx_dinner_club_events_club ON dinner_club_events(club_id, event_date);
CREATE INDEX IF NOT EXISTS idx_cellar_user ON cellar_items(user_id, item_type);

-- ─── RLS (basic — expand in Experience Engine 1.0) ────────────────────────

ALTER TABLE dinner_clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE dinner_club_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE dinner_club_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE dinner_club_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE cellar_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS dinner_club_member_read ON dinner_clubs;
CREATE POLICY dinner_club_member_read ON dinner_clubs FOR SELECT
  USING (id IN (SELECT club_id FROM dinner_club_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS dinner_club_members_read ON dinner_club_members;
CREATE POLICY dinner_club_members_read ON dinner_club_members FOR SELECT
  USING (club_id IN (SELECT club_id FROM dinner_club_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS dinner_club_events_read ON dinner_club_events;
CREATE POLICY dinner_club_events_read ON dinner_club_events FOR SELECT
  USING (club_id IN (SELECT club_id FROM dinner_club_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS dinner_club_contributions_all ON dinner_club_contributions;
CREATE POLICY dinner_club_contributions_read ON dinner_club_contributions FOR SELECT
  USING (event_id IN (
    SELECT e.id FROM dinner_club_events e
    JOIN dinner_club_members m ON m.club_id = e.club_id
    WHERE m.user_id = auth.uid()
  ));
CREATE POLICY dinner_club_contributions_write ON dinner_club_contributions FOR ALL
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS experiences_own ON experiences;
CREATE POLICY experiences_own ON experiences FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS cellar_own ON cellar_items;
CREATE POLICY cellar_own ON cellar_items FOR ALL USING (auth.uid() = user_id);

COMMENT ON TABLE dinner_clubs IS 'Rotating dinner clubs — members socially connected, see menus, bring-list, wine plan';
COMMENT ON TABLE cellar_items IS 'Personal wine cellar + bourbon/spirits collection — pairing engine consumes this';
