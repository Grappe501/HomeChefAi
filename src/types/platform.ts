/** Platform vision types — hooks for future layers. See docs/NORTH_STAR.md */

export type ConfidenceLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type CreativityLevel = 'follower' | 'modifier' | 'creator';
export type AdventureLevel = 'comfort_zone' | 'occasional_explorer' | 'always_curious';
export type LearningStyle = 'quick_tips' | 'visual' | 'detailed' | 'science';

export interface CulinaryProfile {
  confidence?: ConfidenceLevel;
  creativity?: CreativityLevel;
  adventure?: AdventureLevel;
  learning_style?: LearningStyle;
  cooks_with?: ('family' | 'partner' | 'roommates' | 'kids' | 'friends' | 'solo')[];
  cooking_self_assessment?: string;
  priorities?: FoodPriority[];
  local_food?: LocalFoodPreference[];
}

export type FoodPriority =
  | 'save_money'
  | 'reduce_waste'
  | 'eat_healthier'
  | 'learn_to_cook'
  | 'feed_family'
  | 'meal_plan_easier'
  | 'use_what_i_have'
  | 'preserve_recipes'
  | 'buy_local'
  | 'grow_food';

export type LocalFoodPreference =
  | 'farmers_market'
  | 'local_butcher'
  | 'grow_garden'
  | 'seasonal_produce'
  | 'local_dairy'
  | 'community_supported_ag';

/** Reserved Brain memory types — see docs/NORTH_STAR.md */
export type MemoryType =
  | 'preference'
  | 'consumption'
  | 'waste'
  | 'habit'
  | 'shopping'
  | 'family_preference'
  | 'tradition'
  | 'local_food'
  | 'skill_learned'
  | 'experience'
  | 'occasion'
  | 'dinner_club'
  | 'wine_pairing';

/** Experience Engine types — reserved. See docs/NORTH_STAR.md */
export type ExperienceType =
  | 'weeknight'
  | 'family_dinner'
  | 'date_night'
  | 'dinner_party'
  | 'potluck'
  | 'holiday'
  | 'game_day'
  | 'bbq'
  | 'leftover_masterpiece'
  | 'seasonal'
  | 'farm_to_table'
  | 'dinner_club'
  | 'special_occasion';

export type OccasionType =
  | 'birthday'
  | 'anniversary'
  | 'graduation'
  | 'retirement'
  | 'baby_shower'
  | 'holiday'
  | 'church_gathering'
  | 'family_reunion'
  | 'casual';

export type WinePriceTier = 'budget' | 'moderate' | 'premium' | 'splurge';

export interface WinePreferences {
  favorite_varietals?: string[];
  price_comfort?: WinePriceTier;
  sweet_dry?: 'dry' | 'off_dry' | 'sweet' | 'any';
  cellar_enabled?: boolean;
}

export interface SpiritsPreferences {
  bourbon?: boolean;
  whiskey?: boolean;
  favorites?: string[];
}

export interface DinnerClub {
  id: string;
  name: string;
  description?: string;
  invite_code?: string;
  member_count?: number;
  rotation_order?: string[];
}

export interface DinnerClubEvent {
  id: string;
  club_id: string;
  host_user_id: string;
  event_date: string;
  experience_type: ExperienceType;
  theme?: string;
  guest_count: number;
  menu?: Record<string, unknown>;
  timeline?: unknown[];
  wine_plan?: {
    pairings?: { course: string; wine: string; from_cellar?: boolean }[];
    budget_tier?: WinePriceTier;
    from_cellar?: string[];
    to_buy?: string[];
    club_assignments?: { user_id: string; item: string }[];
  };
  status: 'planning' | 'confirmed' | 'completed';
}

export interface DinnerClubContribution {
  id: string;
  event_id: string;
  user_id: string;
  contribution_type: 'appetizer' | 'main' | 'side' | 'dessert' | 'wine' | 'other';
  item_name: string;
  quantity?: string;
  notes?: string;
  confirmed: boolean;
  display_name?: string;
}

export interface CellarItem {
  id: string;
  item_type: 'wine' | 'bourbon' | 'whiskey' | 'spirits';
  name: string;
  producer?: string;
  varietal?: string;
  region?: string;
  vintage?: number;
  quantity: number;
  price_tier?: WinePriceTier;
  rating?: number;
  pairing_tags?: string[];
}

export const EXPERIENCE_TYPES = [
  { id: 'weeknight', label: 'Weeknight Survival', emoji: '⚡' },
  { id: 'family_dinner', label: 'Family Dinner', emoji: '👨‍👩‍👧‍👦' },
  { id: 'date_night', label: 'Date Night', emoji: '🕯️' },
  { id: 'dinner_party', label: 'Dinner Party', emoji: '🍽️' },
  { id: 'potluck', label: 'Potluck', emoji: '🥘' },
  { id: 'holiday', label: 'Holiday Gathering', emoji: '🎄' },
  { id: 'game_day', label: 'Game Day', emoji: '🏈' },
  { id: 'bbq', label: 'Backyard BBQ', emoji: '🔥' },
  { id: 'dinner_club', label: 'Dinner Club', emoji: '🔄' },
  { id: 'leftover_masterpiece', label: 'Leftover Masterpiece', emoji: '✨' },
] as const;

/** Meal tags for recommendation engine — reserve for Brain 1.0B+ */
export const MEAL_TIME_TAGS = [
  'under_15_min',
  'under_30_min',
  'under_45_min',
  'weekend_project',
  'holiday_meal',
  'crowd_feeder',
  'potluck',
  'leftover_masterpiece',
  'freezer_friendly',
  'beginner_friendly',
  'skill_builder',
  'buy_local',
] as const;

export const BEHAVIORAL_GOALS = [
  { id: 'cook_more', label: 'Cook more at home', emoji: '🍳' },
  { id: 'eat_together', label: 'Eat together more', emoji: '👨‍👩‍👧‍👦' },
  { id: 'waste_less', label: 'Waste less food', emoji: '♻️' },
  { id: 'learn_more', label: 'Learn new skills', emoji: '📖' },
  { id: 'spend_less', label: 'Spend less on takeout', emoji: '💰' },
  { id: 'buy_grow_local', label: 'Buy & grow local', emoji: '🌱' },
] as const;

export interface KitchenIdentity {
  cooking_styles?: string[];
  shopping_sources?: string[];
  storage_habits?: string[];
  computed_archetypes?: { id: string; weight: number }[];
}

export interface Household {
  id: string;
  name: string;
  display_name?: string;
  invite_code?: string;
  created_by: string;
  member_count?: number;
}

export interface HouseholdMember {
  user_id: string;
  role: 'owner' | 'member';
  display_name?: string;
  email?: string;
  joined_at?: string;
}

export const COOKS_WITH_OPTIONS = [
  { id: 'family', label: 'Family', emoji: '👨‍👩‍👧‍👦' },
  { id: 'partner', label: 'Partner', emoji: '💑' },
  { id: 'roommates', label: 'Roommates', emoji: '🏠' },
  { id: 'kids', label: 'Kids help cook', emoji: '👧' },
  { id: 'friends', label: 'Friends', emoji: '🧑‍🤝‍🧑' },
  { id: 'solo', label: 'Mostly solo', emoji: '👨‍🍳' },
] as const;

export const COOKING_SELF_ASSESSMENT = [
  'I mostly heat things up',
  'I follow recipes exactly',
  'I can cook most family meals',
  'I often modify recipes',
  'I create my own dishes',
] as const;

export const ONBOARDING_PRIORITIES = [
  { id: 'save_money', label: 'Save money', emoji: '💰' },
  { id: 'reduce_waste', label: 'Reduce waste', emoji: '♻️' },
  { id: 'eat_healthier', label: 'Eat healthier', emoji: '🥗' },
  { id: 'learn_to_cook', label: 'Learn to cook', emoji: '📖' },
  { id: 'feed_family', label: 'Feed my family', emoji: '👨‍👩‍👧‍👦' },
  { id: 'meal_plan_easier', label: 'Meal plan easier', emoji: '📅' },
  { id: 'use_what_i_have', label: 'Use what I have', emoji: '🥫' },
  { id: 'preserve_recipes', label: 'Preserve family recipes', emoji: '📖' },
  { id: 'buy_local', label: 'Buy local', emoji: '🏪' },
  { id: 'grow_food', label: 'Grow food at home', emoji: '🌱' },
] as const;

export const LOCAL_FOOD_OPTIONS = [
  { id: 'farmers_market', label: 'Farmers markets', emoji: '🧺' },
  { id: 'local_butcher', label: 'Local butchers', emoji: '🥩' },
  { id: 'grow_garden', label: 'Home garden', emoji: '🌿' },
  { id: 'seasonal_produce', label: 'Seasonal produce', emoji: '🍅' },
  { id: 'local_dairy', label: 'Local dairy & eggs', emoji: '🥚' },
  { id: 'community_supported_ag', label: 'CSA / farm share', emoji: '🚜' },
] as const;
