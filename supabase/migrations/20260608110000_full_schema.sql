-- HomeChef AI — Full schema (V2 + V3 base) — correct dependency order

CREATE TABLE IF NOT EXISTS profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  dietary_restrictions JSONB DEFAULT '[]'::jsonb,
  cuisine_preferences JSONB DEFAULT '[]'::jsonb,
  allergies JSONB DEFAULT '[]'::jsonb,
  household_size INT DEFAULT 2,
  preferred_store TEXT DEFAULT 'Walmart',
  gamification_level INT DEFAULT 1,
  gamification_xp INT DEFAULT 0,
  onboarding_complete BOOLEAN DEFAULT FALSE,
  assistant_name TEXT DEFAULT 'Sous Chef',
  last_meal_memory JSONB DEFAULT '{}'::jsonb,
  zip_code TEXT,
  favorite_meals JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscriptions (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL DEFAULT 'trial',
  status TEXT NOT NULL DEFAULT 'trialing',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  trial_ends_at TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(COALESCE(NEW.email, 'chef'), '@', 1))
  );
  INSERT INTO public.subscriptions (user_id, tier, status, trial_ends_at)
  VALUES (NEW.id, 'trial', 'trialing', NOW() + INTERVAL '30 days');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'other',
  quantity NUMERIC DEFAULT 1,
  unit TEXT DEFAULT 'each',
  expiration_date DATE,
  location TEXT DEFAULT 'pantry',
  added_via TEXT DEFAULT 'manual',
  notes TEXT,
  low_stock_threshold NUMERIC DEFAULT 0,
  estimated_unit_price NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_user ON inventory_items(user_id);

CREATE TABLE IF NOT EXISTS receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_name TEXT,
  total_amount NUMERIC,
  receipt_date DATE DEFAULT CURRENT_DATE,
  image_data TEXT,
  raw_parse JSONB,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  start_date DATE,
  end_date DATE,
  days INT,
  budget NUMERIC,
  status TEXT DEFAULT 'draft',
  plan_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT,
  meal_name TEXT,
  items_used JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_key TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_key)
);

CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_date DATE NOT NULL,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_calendar_user_date ON calendar_events(user_id, event_date);

CREATE TABLE IF NOT EXISTS usage_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month_key TEXT NOT NULL,
  receipt_scans INT DEFAULT 0,
  meal_plans INT DEFAULT 0,
  assistant_messages INT DEFAULT 0,
  UNIQUE(user_id, month_key)
);

CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  ingredients JSONB DEFAULT '[]'::jsonb,
  instructions TEXT,
  prep_time_minutes INT,
  is_public BOOLEAN DEFAULT FALSE,
  likes_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recipe_saves (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, recipe_id)
);

CREATE TABLE IF NOT EXISTS recipe_likes (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, recipe_id)
);

CREATE TABLE IF NOT EXISTS swap_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  quantity NUMERIC DEFAULT 1,
  unit TEXT DEFAULT 'each',
  post_type TEXT NOT NULL DEFAULT 'offer',
  zip_code TEXT NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'open',
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

CREATE OR REPLACE FUNCTION public.increment_recipe_likes(recipe_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE recipes SET likes_count = likes_count + 1 WHERE id = recipe_id;
END;
$$;

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE swap_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE swap_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_select ON profiles;
DROP POLICY IF EXISTS profiles_update ON profiles;
DROP POLICY IF EXISTS profiles_insert ON profiles;
CREATE POLICY profiles_select ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY profiles_update ON profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY profiles_insert ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS inventory_all ON inventory_items;
CREATE POLICY inventory_all ON inventory_items FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS receipts_all ON receipts;
CREATE POLICY receipts_all ON receipts FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS meal_plans_all ON meal_plans;
CREATE POLICY meal_plans_all ON meal_plans FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS usage_logs_all ON usage_logs;
CREATE POLICY usage_logs_all ON usage_logs FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS achievements_all ON achievements;
CREATE POLICY achievements_all ON achievements FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS calendar_all ON calendar_events;
CREATE POLICY calendar_all ON calendar_events FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS subscriptions_select ON subscriptions;
CREATE POLICY subscriptions_select ON subscriptions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS usage_quotas_select ON usage_quotas;
CREATE POLICY usage_quotas_select ON usage_quotas FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS recipes_owner ON recipes;
DROP POLICY IF EXISTS recipes_public_read ON recipes;
CREATE POLICY recipes_owner ON recipes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY recipes_public_read ON recipes FOR SELECT USING (is_public = TRUE);

DROP POLICY IF EXISTS recipe_saves_all ON recipe_saves;
CREATE POLICY recipe_saves_all ON recipe_saves FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS recipe_likes_all ON recipe_likes;
CREATE POLICY recipe_likes_all ON recipe_likes FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS swap_posts_read ON swap_posts;
DROP POLICY IF EXISTS swap_posts_insert ON swap_posts;
DROP POLICY IF EXISTS swap_posts_update ON swap_posts;
CREATE POLICY swap_posts_read ON swap_posts FOR SELECT USING (status = 'open' OR auth.uid() = user_id);
CREATE POLICY swap_posts_insert ON swap_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY swap_posts_update ON swap_posts FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS swap_responses_read ON swap_responses;
DROP POLICY IF EXISTS swap_responses_insert ON swap_responses;
CREATE POLICY swap_responses_read ON swap_responses FOR SELECT USING (
  auth.uid() = user_id OR EXISTS (SELECT 1 FROM swap_posts sp WHERE sp.id = post_id AND sp.user_id = auth.uid())
);
CREATE POLICY swap_responses_insert ON swap_responses FOR INSERT WITH CHECK (auth.uid() = user_id);
