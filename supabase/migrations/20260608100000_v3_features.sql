-- HomeChef AI V3 — Calendar, neighbor swap, inventory value, memory

-- Profile additions
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS zip_code TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS favorite_meals JSONB DEFAULT '[]'::jsonb;

-- Inventory value tracking
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS estimated_unit_price NUMERIC DEFAULT 0;

-- Neighbor swap (V3)
CREATE TABLE IF NOT EXISTS swap_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  quantity NUMERIC DEFAULT 1,
  unit TEXT DEFAULT 'each',
  post_type TEXT NOT NULL DEFAULT 'offer',  -- offer | need
  zip_code TEXT NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'open',  -- open | matched | closed
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS swap_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES swap_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_swap_posts_zip ON swap_posts(zip_code, status);

ALTER TABLE swap_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE swap_responses ENABLE ROW LEVEL SECURITY;

-- Swap posts: read open posts in same zip (approximate — show all open for now + filter in API)
CREATE POLICY swap_posts_read ON swap_posts FOR SELECT USING (status = 'open' OR auth.uid() = user_id);
CREATE POLICY swap_posts_insert ON swap_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY swap_posts_update ON swap_posts FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY swap_responses_read ON swap_responses FOR SELECT USING (
  auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM swap_posts sp WHERE sp.id = post_id AND sp.user_id = auth.uid()
  )
);
CREATE POLICY swap_responses_insert ON swap_responses FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Recipe likes increment helper
CREATE OR REPLACE FUNCTION public.increment_recipe_likes(recipe_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE recipes SET likes_count = likes_count + 1 WHERE id = recipe_id;
END;
$$;

-- Profiles need INSERT policy for trigger (service role handles signup trigger)
CREATE POLICY profiles_insert ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
