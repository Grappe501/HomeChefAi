export interface User {
  id: string;
  email?: string;
  name?: string;
  created_at?: string;
}

export interface Profile {
  user_id: string;
  name?: string;
  dietary_restrictions: string[];
  cuisine_preferences: string[];
  allergies: string[];
  household_size: number;
  preferred_store: string;
  gamification_level: number;
  gamification_xp: number;
  onboarding_complete: boolean;
  assistant_name: string;
  last_meal_memory: Record<string, unknown>;
  zip_code?: string;
  household_id?: string;
  household_display_name?: string;
  kitchen_identity?: import('./platform').KitchenIdentity;
  culinary_profile?: import('./platform').CulinaryProfile;
  assistant_persona?: { name?: string; communication_style?: string };
  food_priorities?: string[];
  is_founder?: boolean;
}

export interface InventoryItem {
  id: string;
  user_id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  expiration_date?: string;
  location: 'pantry' | 'fridge' | 'freezer';
  added_via: string;
  notes?: string;
  low_stock_threshold?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Receipt {
  id: string;
  user_id: string;
  store_name?: string;
  total_amount?: number;
  receipt_date?: string;
  image_data?: string;
  raw_parse?: ReceiptParseResult;
  verified: boolean;
  created_at?: string;
}

export interface ReceiptItem {
  name: string;
  quantity: number;
  unit: string;
  price?: number;
  category?: string;
  location?: string;
  needs_expiration?: boolean;
  suggested_expiration?: string;
}

export interface ReceiptParseResult {
  store_name?: string;
  date?: string;
  total?: number;
  items: ReceiptItem[];
}

export interface MealPlan {
  id: string;
  user_id: string;
  title?: string;
  start_date?: string;
  end_date?: string;
  days: number;
  budget?: number;
  status: string;
  plan_data: MealPlanData;
  created_at?: string;
}

export interface MealPlanData {
  meals: PlannedMeal[];
  shopping_list?: ShoppingItem[];
  estimated_cost?: number;
  uses_inventory?: string[];
}

export interface PlannedMeal {
  day: number;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  name: string;
  description?: string;
  ingredients: { name: string; quantity: number; unit: string; in_inventory?: boolean }[];
  prep_time_minutes?: number;
}

export interface ShoppingItem {
  name: string;
  quantity: number;
  unit: string;
  estimated_price?: number;
}

export interface UsageLog {
  id: string;
  user_id: string;
  description?: string;
  meal_name?: string;
  items_used: { item_id?: string; name: string; quantity: number; unit: string }[];
  created_at?: string;
}

export interface CalendarEvent {
  id: string;
  user_id: string;
  event_date: string;
  event_type: 'water' | 'meal' | 'shop' | 'expire' | 'custom';
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
  completed: boolean;
}

export interface GamificationState {
  level: number;
  xp: number;
  next_level_xp: number;
  achievements: string[];
  current_quest?: string;
}

export const GAMIFICATION_LEVELS = [
  { level: 1, name: 'First Meal', xp: 0, quest: 'Plan one meal for today' },
  { level: 2, name: 'Tomorrow Planner', xp: 100, quest: 'Plan tomorrow\'s meals' },
  { level: 3, name: 'Week Warrior', xp: 300, quest: 'Plan a full week of meals' },
  { level: 4, name: 'Pantry Pro', xp: 600, quest: 'Scan a receipt and verify inventory' },
  { level: 5, name: 'Master Chef', xp: 1000, quest: 'Cook 5 meals from your inventory' },
];

export const PANTRY_CATEGORIES: Record<string, { items: string[]; location: string }> = {
  'Canned Vegetables': {
    location: 'pantry',
    items: ['Sweet Peas', 'Green Beans', 'Corn', 'Diced Tomatoes', 'Black Beans', 'Kidney Beans', 'Chickpeas', 'Mixed Vegetables'],
  },
  'Canned Fruits': {
    location: 'pantry',
    items: ['Peaches', 'Pears', 'Pineapple', 'Fruit Cocktail', 'Applesauce'],
  },
  'Grains & Pasta': {
    location: 'pantry',
    items: ['White Rice', 'Brown Rice', 'Spaghetti', 'Penne', 'Macaroni', 'Oats', 'Flour', 'Bread Crumbs', 'Quinoa'],
  },
  'Baking': {
    location: 'pantry',
    items: ['Sugar', 'Brown Sugar', 'Baking Powder', 'Baking Soda', 'Vanilla Extract', 'Chocolate Chips', 'Cocoa Powder'],
  },
  'Condiments & Sauces': {
    location: 'pantry',
    items: ['Ketchup', 'Mustard', 'Mayonnaise', 'Soy Sauce', 'Hot Sauce', 'BBQ Sauce', 'Olive Oil', 'Vegetable Oil', 'Vinegar'],
  },
  'Spices (tap what you have)': {
    location: 'pantry',
    items: ['Salt', 'Black Pepper', 'Garlic Powder', 'Onion Powder', 'Paprika', 'Cumin', 'Oregano', 'Basil', 'Cinnamon', 'Chili Powder', 'Italian Seasoning', 'Red Pepper Flakes'],
  },
  'Dairy & Eggs': {
    location: 'fridge',
    items: ['Milk', 'Eggs', 'Butter', 'Cheese', 'Yogurt', 'Sour Cream', 'Cream Cheese', 'Heavy Cream'],
  },
  'Fresh Produce': {
    location: 'fridge',
    items: ['Bananas', 'Apples', 'Onions', 'Garlic', 'Potatoes', 'Carrots', 'Celery', 'Lettuce', 'Tomatoes', 'Lemons', 'Limes'],
  },
  'Meat & Protein': {
    location: 'fridge',
    items: ['Chicken Breast', 'Ground Beef', 'Bacon', 'Sausage', 'Deli Meat', 'Tofu'],
  },
  'Frozen': {
    location: 'freezer',
    items: ['Frozen Vegetables', 'Frozen Fruit', 'Ice Cream', 'Frozen Pizza', 'Frozen Chicken', 'Frozen Fish', 'Frozen Fries'],
  },
};

/** @deprecated Use getWizardItemConfig from @/types/pantryWizard */
export const QUICK_QUANTITIES: Record<string, string[]> = {
  default: ['1 package', '2 packages'],
};

export const DIETARY_OPTIONS = [
  'None', 'Vegetarian', 'Vegan', 'Pescatarian', 'Gluten-Free', 'Dairy-Free',
  'Keto', 'Low-Carb', 'Diabetic-Friendly', 'Nut-Free', 'Halal', 'Kosher',
];

export const CUISINE_OPTIONS = [
  'American', 'Italian', 'Mexican', 'Asian', 'Mediterranean', 'Indian',
  'Southern/BBQ', 'Comfort Food', 'Healthy/Light', 'Quick & Easy',
];
