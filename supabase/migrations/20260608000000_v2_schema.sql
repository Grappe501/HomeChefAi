-- HomeChef AI V2 — Supabase Schema
-- Run in Supabase SQL Editor (Dashboard → SQL → New query)
-- profiles.user_id references auth.users — no custom users table

-- ─── Core profile (linked to Supabase Auth) ───────────────────────────────

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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile + 30-day trial on signup
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
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
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

-- ─── Inventory & kitchen data ──────────────────────────────────────────────

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

-- ─── V2: Billing ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS subscriptions (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL DEFAULT 'free',  -- free | trial | pro | family
  status TEXT NOT NULL DEFAULT 'active',  -- active | trialing | canceled | past_due
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  trial_ends_at TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS usage_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month_key TEXT NOT NULL,
  receipt_scans INT DEFAULT 0,
  meal_plans INT DEFAULT 0,
  assistant_messages INT DEFAULT 0,
  UNIQUE(user_id, month_key)
);

-- ─── V2: Social (recipes — swap deferred to V3) ────────────────────────────

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

-- ─── Row Level Security ────────────────────────────────────────────────────

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

-- Profiles
CREATE POLICY profiles_select ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY profiles_update ON profiles FOR UPDATE USING (auth.uid() = user_id);

-- Inventory
CREATE POLICY inventory_all ON inventory_items FOR ALL USING (auth.uid() = user_id);

-- Receipts
CREATE POLICY receipts_all ON receipts FOR ALL USING (auth.uid() = user_id);

-- Meal plans
CREATE POLICY meal_plans_all ON meal_plans FOR ALL USING (auth.uid() = user_id);

-- Usage logs
CREATE POLICY usage_logs_all ON usage_logs FOR ALL USING (auth.uid() = user_id);

-- Achievements
CREATE POLICY achievements_all ON achievements FOR ALL USING (auth.uid() = user_id);

-- Calendar
CREATE POLICY calendar_all ON calendar_events FOR ALL USING (auth.uid() = user_id);

-- Subscriptions (read own; writes via service role / webhooks only)
CREATE POLICY subscriptions_select ON subscriptions FOR SELECT USING (auth.uid() = user_id);

-- Usage quotas (read own)
CREATE POLICY usage_quotas_select ON usage_quotas FOR SELECT USING (auth.uid() = user_id);

-- Recipes: owner full access; public read for is_public
CREATE POLICY recipes_owner ON recipes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY recipes_public_read ON recipes FOR SELECT USING (is_public = TRUE);

-- Recipe saves & likes
CREATE POLICY recipe_saves_all ON recipe_saves FOR ALL USING (auth.uid() = user_id);
CREATE POLICY recipe_likes_all ON recipe_likes FOR ALL USING (auth.uid() = user_id);
