/**
 * Generate pantry wizard ingredient nodes + Phase 2 corpus expansion.
 * All output: H:/HomeChefAi/data/ai/
 * Run: npm run knowledge:generate
 */

import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join, resolve } from 'path';

const KNOWLEDGE_ROOT = process.env.KNOWLEDGE_ROOT
  ? resolve(process.env.KNOWLEDGE_ROOT)
  : resolve('H:/HomeChefAi/data/ai');

function slug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

/** Pantry wizard items → category + dietary defaults */
const PANTRY_ITEMS = [
  // Canned
  { name: 'Sweet Peas', category: 'produce', dietary: { vegan: true, vegetarian: true } },
  { name: 'Green Beans', category: 'produce', dietary: { vegan: true, vegetarian: true } },
  { name: 'Corn', category: 'produce', dietary: { vegan: true, vegetarian: true } },
  { name: 'Diced Tomatoes', category: 'produce', dietary: { vegan: true, vegetarian: true }, taxonomy: 'tomato' },
  { name: 'Black Beans', category: 'legumes', dietary: { vegan: true, vegetarian: true }, taxonomy: 'beans' },
  { name: 'Kidney Beans', category: 'legumes', dietary: { vegan: true, vegetarian: true }, taxonomy: 'beans' },
  { name: 'Chickpeas', category: 'legumes', dietary: { vegan: true, vegetarian: true }, taxonomy: 'beans' },
  { name: 'Mixed Vegetables', category: 'produce', dietary: { vegan: true, vegetarian: true } },
  { name: 'Peaches', category: 'produce', dietary: { vegan: true, vegetarian: true } },
  { name: 'Pears', category: 'produce', dietary: { vegan: true, vegetarian: true } },
  { name: 'Pineapple', category: 'produce', dietary: { vegan: true, vegetarian: true } },
  { name: 'Fruit Cocktail', category: 'produce', dietary: { vegan: true, vegetarian: true } },
  { name: 'Applesauce', category: 'produce', dietary: { vegan: true, vegetarian: true } },
  // Grains
  { name: 'White Rice', category: 'grains', dietary: { vegan: true, vegetarian: true, contains_gluten: false }, taxonomy: 'rice' },
  { name: 'Brown Rice', category: 'grains', dietary: { vegan: true, vegetarian: true, contains_gluten: false }, taxonomy: 'rice' },
  { name: 'Spaghetti', category: 'grains', dietary: { vegetarian: true, contains_gluten: true } },
  { name: 'Penne', category: 'grains', dietary: { vegetarian: true, contains_gluten: true } },
  { name: 'Macaroni', category: 'grains', dietary: { vegetarian: true, contains_gluten: true } },
  { name: 'Oats', category: 'grains', dietary: { vegan: true, vegetarian: true, contains_gluten: false } },
  { name: 'Flour', category: 'grains', dietary: { vegetarian: true, contains_gluten: true }, taxonomy: 'flour' },
  { name: 'Bread Crumbs', category: 'grains', dietary: { vegetarian: true, contains_gluten: true } },
  { name: 'Quinoa', category: 'grains', dietary: { vegan: true, vegetarian: true, contains_gluten: false } },
  // Baking
  { name: 'Sugar', category: 'baking', dietary: { vegan: true, vegetarian: true } },
  { name: 'Brown Sugar', category: 'baking', dietary: { vegan: true, vegetarian: true } },
  { name: 'Baking Powder', category: 'baking', dietary: { vegan: true, vegetarian: true } },
  { name: 'Baking Soda', category: 'baking', dietary: { vegan: true, vegetarian: true } },
  { name: 'Vanilla Extract', category: 'baking', dietary: { vegan: true, vegetarian: true } },
  { name: 'Chocolate Chips', category: 'baking', dietary: { vegetarian: true, contains_dairy: true } },
  { name: 'Cocoa Powder', category: 'baking', dietary: { vegan: true, vegetarian: true } },
  // Condiments
  { name: 'Ketchup', category: 'condiments', dietary: { vegan: true, vegetarian: true } },
  { name: 'Mustard', category: 'condiments', dietary: { vegan: true, vegetarian: true } },
  { name: 'Mayonnaise', category: 'condiments', dietary: { vegetarian: true, contains_eggs: true } },
  { name: 'Soy Sauce', category: 'condiments', dietary: { vegan: true, vegetarian: true, contains_gluten: true } },
  { name: 'Hot Sauce', category: 'condiments', dietary: { vegan: true, vegetarian: true } },
  { name: 'BBQ Sauce', category: 'condiments', dietary: { vegan: true, vegetarian: true } },
  { name: 'Olive Oil', category: 'oil', dietary: { vegan: true, vegetarian: true } },
  { name: 'Vegetable Oil', category: 'oil', dietary: { vegan: true, vegetarian: true } },
  { name: 'Vinegar', category: 'condiments', dietary: { vegan: true, vegetarian: true } },
  // Spices
  { name: 'Salt', category: 'spice', dietary: { vegan: true, vegetarian: true } },
  { name: 'Black Pepper', category: 'spice', dietary: { vegan: true, vegetarian: true } },
  { name: 'Garlic Powder', category: 'spice', dietary: { vegan: true, vegetarian: true } },
  { name: 'Onion Powder', category: 'spice', dietary: { vegan: true, vegetarian: true } },
  { name: 'Paprika', category: 'spice', dietary: { vegan: true, vegetarian: true }, link: 'ingredient.paprika' },
  { name: 'Cumin', category: 'spice', dietary: { vegan: true, vegetarian: true }, link: 'ingredient.cumin' },
  { name: 'Oregano', category: 'spice', dietary: { vegan: true, vegetarian: true } },
  { name: 'Basil', category: 'spice', dietary: { vegan: true, vegetarian: true } },
  { name: 'Cinnamon', category: 'spice', dietary: { vegan: true, vegetarian: true } },
  { name: 'Chili Powder', category: 'spice', dietary: { vegan: true, vegetarian: true }, link: 'ingredient.chili.powder' },
  { name: 'Italian Seasoning', category: 'spice', dietary: { vegan: true, vegetarian: true } },
  { name: 'Red Pepper Flakes', category: 'spice', dietary: { vegan: true, vegetarian: true } },
  // Dairy
  { name: 'Milk', category: 'dairy', dietary: { vegetarian: true, contains_dairy: true }, taxonomy: 'milk', link: 'ingredient.milk' },
  { name: 'Eggs', category: 'dairy', dietary: { vegetarian: true, contains_eggs: true } },
  { name: 'Butter', category: 'dairy', dietary: { vegetarian: true, contains_dairy: true }, link: 'ingredient.butter' },
  { name: 'Cheese', category: 'dairy', dietary: { vegetarian: true, contains_dairy: true }, taxonomy: 'cheese', link: 'ingredient.cheese' },
  { name: 'Yogurt', category: 'dairy', dietary: { vegetarian: true, contains_dairy: true } },
  { name: 'Sour Cream', category: 'dairy', dietary: { vegetarian: true, contains_dairy: true } },
  { name: 'Cream Cheese', category: 'dairy', dietary: { vegetarian: true, contains_dairy: true } },
  { name: 'Heavy Cream', category: 'dairy', dietary: { vegetarian: true, contains_dairy: true } },
  // Produce
  { name: 'Bananas', category: 'produce', dietary: { vegan: true, vegetarian: true } },
  { name: 'Apples', category: 'produce', dietary: { vegan: true, vegetarian: true } },
  { name: 'Onions', category: 'produce', dietary: { vegan: true, vegetarian: true }, link: 'ingredient.onion' },
  { name: 'Garlic', category: 'produce', dietary: { vegan: true, vegetarian: true }, link: 'ingredient.garlic' },
  { name: 'Potatoes', category: 'produce', dietary: { vegan: true, vegetarian: true }, taxonomy: 'potato', link: 'ingredient.potato' },
  { name: 'Carrots', category: 'produce', dietary: { vegan: true, vegetarian: true } },
  { name: 'Celery', category: 'produce', dietary: { vegan: true, vegetarian: true } },
  { name: 'Lettuce', category: 'produce', dietary: { vegan: true, vegetarian: true } },
  { name: 'Tomatoes', category: 'produce', dietary: { vegan: true, vegetarian: true }, taxonomy: 'tomato', link: 'ingredient.tomato' },
  { name: 'Lemons', category: 'produce', dietary: { vegan: true, vegetarian: true } },
  { name: 'Limes', category: 'produce', dietary: { vegan: true, vegetarian: true } },
  // Meat
  { name: 'Chicken Breast', category: 'poultry', dietary: { contains_meat: true } },
  { name: 'Ground Beef', category: 'meat', dietary: { contains_meat: true }, taxonomy: 'ground_beef', link: 'ingredient.ground_beef' },
  { name: 'Bacon', category: 'meat', dietary: { contains_meat: true } },
  { name: 'Sausage', category: 'meat', dietary: { contains_meat: true } },
  { name: 'Deli Meat', category: 'meat', dietary: { contains_meat: true } },
  { name: 'Tofu', category: 'protein', dietary: { vegan: true, vegetarian: true } },
  // Frozen
  { name: 'Frozen Vegetables', category: 'frozen', dietary: { vegan: true, vegetarian: true } },
  { name: 'Frozen Fruit', category: 'frozen', dietary: { vegan: true, vegetarian: true } },
  { name: 'Ice Cream', category: 'frozen', dietary: { vegetarian: true, contains_dairy: true } },
  { name: 'Frozen Pizza', category: 'frozen', dietary: { vegetarian: true, contains_gluten: true, contains_dairy: true } },
  { name: 'Frozen Chicken', category: 'frozen', dietary: { contains_meat: true } },
  { name: 'Frozen Fish', category: 'frozen', dietary: { contains_fish: true } },
  { name: 'Frozen Fries', category: 'frozen', dietary: { vegan: true, vegetarian: true } },
];

const TECHNIQUES = [
  { id: 'ferment', name: 'Fermentation', tags: ['preservation'] },
  { id: 'saute', name: 'Sauté', tags: ['french', 'italian'] },
  { id: 'simmer', name: 'Simmer', tags: ['comfort', 'southern'] },
  { id: 'grill', name: 'Grill', tags: ['bbq', 'american'] },
  { id: 'poach', name: 'Poach', tags: ['french'] },
  { id: 'steam', name: 'Steam', tags: ['asian', 'healthy'] },
  { id: 'deep_fry', name: 'Deep Fry', tags: ['comfort', 'southern'] },
  { id: 'stir_fry', name: 'Stir Fry', tags: ['asian'] },
  { id: 'marinate', name: 'Marinate', tags: ['bbq', 'mexican'] },
  { id: 'caramelize', name: 'Caramelize', tags: ['french', 'comfort'] },
  { id: 'deglaze', name: 'Deglaze', tags: ['french'] },
  { id: 'rest', name: 'Rest (meat)', tags: ['bbq', 'american'] },
  { id: 'proof', name: 'Proof (dough)', tags: ['baking'] },
  { id: 'knead', name: 'Knead', tags: ['baking', 'italian'] },
  { id: 'reduce', name: 'Reduce (sauce)', tags: ['french', 'italian'] },
];

const FLAVOR_PROFILES = [
  { id: 'umami', name: 'Umami-forward', tags: ['asian', 'italian'] },
  { id: 'smoky', name: 'Smoky', tags: ['bbq', 'southern'] },
  { id: 'bright_acid', name: 'Bright & Acidic', tags: ['mediterranean', 'mexican'] },
  { id: 'rich_creamy', name: 'Rich & Creamy', tags: ['comfort', 'french'] },
  { id: 'herbaceous', name: 'Herbaceous', tags: ['mediterranean', 'italian'] },
  { id: 'spicy_heat', name: 'Spicy Heat', tags: ['cajun', 'mexican', 'thai'] },
  { id: 'sweet_savory', name: 'Sweet-Savory', tags: ['asian', 'american'] },
  { id: 'earthy', name: 'Earthy', tags: ['comfort', 'southern'] },
  { id: 'tangy', name: 'Tangy', tags: ['southern', 'cajun'] },
  { id: 'nutty', name: 'Nutty', tags: ['baking', 'asian'] },
  { id: 'fresh_light', name: 'Fresh & Light', tags: ['mediterranean'] },
  { id: 'bbq', name: 'BBQ', tags: ['bbq', 'american', 'southern'] },
];

const FOOD_SCIENCE = [
  { id: 'maillard', name: 'Maillard Reaction', lesson: 'Heat + amino acids + sugars = browning and deep flavor.' },
  { id: 'gluten', name: 'Gluten Development', lesson: 'Kneading aligns gluten proteins for chew in bread and pasta.' },
  { id: 'smoke_point', name: 'Smoke Point', lesson: 'Oils break down above their smoke point — use high-smoke oils for sear.' },
  { id: 'starch_thickening', name: 'Starch Thickening', lesson: 'Flour or cornstarch slurry thickens sauces as starch gelatinizes.' },
  { id: 'acid_balance', name: 'Acid Balance', lesson: 'A splash of acid brightens rich or fatty dishes at the finish.' },
  { id: 'salt_timing', name: 'Salt Timing', lesson: 'Salt early for penetration; finish salt for crunch and control.' },
  { id: 'carryover_cooking', name: 'Carryover Cooking', lesson: 'Meat temperature rises 5–10°F after resting off heat.' },
  { id: 'emulsion_science', name: 'Emulsion Science', lesson: 'Lecithin in egg yolk bridges oil and water in sauces.' },
  { id: 'caramelization', name: 'Caramelization', lesson: 'Sugars brown above ~320°F — distinct from Maillard.' },
  { id: 'protein_denature', name: 'Protein Denaturing', lesson: 'Heat unfolds proteins — eggs set, meat firms, dairy curdles.' },
  { id: 'fermentation_science', name: 'Fermentation', lesson: 'Microbes produce acid and CO₂ — preserves and builds flavor.' },
  { id: 'leavening', name: 'Leavening', lesson: 'Baking soda needs acid; baking powder is self-contained.' },
  { id: 'fat_soluble', name: 'Fat-Soluble Flavor', lesson: 'Many aromatics (pepper, cumin) bloom best in hot fat.' },
  { id: 'water_activity', name: 'Water Activity', lesson: 'Low water activity preserves food — salt, sugar, and drying help.' },
  { id: 'enzymatic_browning', name: 'Enzymatic Browning', lesson: 'Cut produce oxidizes — acid (lemon) slows browning.' },
];

const CUISINES = [
  { id: 'bbq', name: 'BBQ', staples: ['ingredient.paprika', 'ingredient.garlic', 'ingredient.onion'] },
  { id: 'asian', name: 'Asian', staples: ['ingredient.rice', 'ingredient.garlic', 'ingredient.soy_sauce'] },
  { id: 'mediterranean', name: 'Mediterranean', staples: ['ingredient.olive_oil', 'ingredient.tomato', 'ingredient.garlic'] },
  { id: 'indian', name: 'Indian', staples: ['ingredient.rice', 'ingredient.cumin', 'ingredient.garlic'] },
  { id: 'tex_mex', name: 'Tex-Mex', staples: ['ingredient.beans', 'ingredient.cumin', 'ingredient.cheese'] },
];

const PLANT_BASED = [
  { id: 'tofu', name: 'Tofu', dietary: { vegan: true, vegetarian: true } },
  { id: 'tempeh', name: 'Tempeh', dietary: { vegan: true, vegetarian: true } },
  { id: 'coconut_oil', name: 'Coconut Oil', dietary: { vegan: true, vegetarian: true } },
  { id: 'oat_milk', name: 'Oat Milk', dietary: { vegan: true, vegetarian: true, contains_gluten: false } },
  { id: 'almond_milk', name: 'Almond Milk', dietary: { vegan: true, vegetarian: true, contains_nuts: true } },
  { id: 'vegan_butter', name: 'Vegan Butter', dietary: { vegan: true, vegetarian: true } },
  { id: 'nutritional_yeast', name: 'Nutritional Yeast', dietary: { vegan: true, vegetarian: true } },
  { id: 'vegan_cheese', name: 'Vegan Cheese', dietary: { vegan: true, vegetarian: true } },
  { id: 'flax_meal', name: 'Flax Meal', dietary: { vegan: true, vegetarian: true } },
  { id: 'aquafaba', name: 'Aquafaba', dietary: { vegan: true, vegetarian: true } },
  { id: 'lentils', name: 'Lentils', dietary: { vegan: true, vegetarian: true } },
  { id: 'mushrooms', name: 'Mushrooms', dietary: { vegan: true, vegetarian: true } },
  { id: 'gluten_free_flour', name: 'Gluten-Free Flour', dietary: { vegan: true, vegetarian: true, contains_gluten: false } },
  { id: 'turkey', name: 'Turkey', dietary: { contains_meat: true } },
  { id: 'oil', name: 'Cooking Oil', dietary: { vegan: true, vegetarian: true } },
  { id: 'soy_sauce', name: 'Soy Sauce', dietary: { vegan: true, vegetarian: true, contains_gluten: true } },
  { id: 'olive_oil', name: 'Olive Oil', dietary: { vegan: true, vegetarian: true } },
];

const DIETARY_EDGES = [
  { file: 'butter_vegan', from: 'ingredient.butter', to: 'ingredient.vegan_butter', reasons: ['vegan', 'dairy_free'], note: '1:1 in baking and sauté', ratio: '1:1', confidence: 0.9 },
  { file: 'butter_vegan_oil', from: 'ingredient.butter', to: 'ingredient.coconut_oil', reasons: ['vegan', 'dairy_free'], note: 'Use 3/4 amount for sauté', ratio: '3/4', confidence: 0.75 },
  { file: 'milk_vegan_oat', from: 'ingredient.milk', to: 'ingredient.oat_milk', reasons: ['vegan', 'dairy_free'], ratio: '1:1', confidence: 0.85 },
  { file: 'milk_vegan_almond', from: 'ingredient.milk', to: 'ingredient.almond_milk', reasons: ['vegan', 'dairy_free'], note: 'Nut allergy — use oat instead', ratio: '1:1', confidence: 0.8 },
  { file: 'cheese_vegan', from: 'ingredient.cheese', to: 'ingredient.vegan_cheese', reasons: ['vegan', 'dairy_free'], ratio: '1:1', confidence: 0.7 },
  { file: 'cheese_vegan_nutritional_yeast', from: 'ingredient.cheese', to: 'ingredient.nutritional_yeast', reasons: ['vegan', 'dairy_free'], note: 'For cheesy flavor in sauces — 2–4 tbsp', confidence: 0.65 },
  { file: 'chicken_vegan_tofu', from: 'ingredient.chicken', to: 'ingredient.tofu', reasons: ['vegan', 'vegetarian'], note: 'Press and cube; marinate for flavor', confidence: 0.85 },
  { file: 'chicken_vegan_tempeh', from: 'ingredient.chicken', to: 'ingredient.tempeh', reasons: ['vegan', 'vegetarian'], note: 'Slice and sear — nutty flavor', confidence: 0.75 },
  { file: 'chicken_vegan_chickpeas', from: 'ingredient.chicken', to: 'ingredient.beans', reasons: ['vegan', 'vegetarian'], note: 'Roasted chickpeas in bowls and salads', confidence: 0.7 },
  { file: 'ground_beef_vegan_lentils', from: 'ingredient.ground_beef', to: 'ingredient.lentils', reasons: ['vegan', 'vegetarian'], note: 'Seasoned lentils for tacos and sauce', confidence: 0.8 },
  { file: 'ground_beef_vegan_mushrooms', from: 'ingredient.ground_beef', to: 'ingredient.mushrooms', reasons: ['vegan', 'vegetarian'], note: 'Finely chopped mushrooms for umami', confidence: 0.75 },
  { file: 'ground_beef_vegan_tofu', from: 'ingredient.ground_beef', to: 'ingredient.tofu', reasons: ['vegan', 'vegetarian'], note: 'Crumbled firm tofu with spices', confidence: 0.7 },
  { file: 'eggs_vegan_flax', from: 'ingredient.eggs', to: 'ingredient.flax_meal', reasons: ['vegan', 'vegetarian', 'egg_free'], note: '1 tbsp flax + 3 tbsp water = 1 egg (baking)', confidence: 0.8 },
  { file: 'eggs_vegan_aquafaba', from: 'ingredient.eggs', to: 'ingredient.aquafaba', reasons: ['vegan', 'vegetarian', 'egg_free'], note: '3 tbsp aquafaba ≈ 1 egg white', confidence: 0.75 },
  { file: 'flour_gluten_free', from: 'ingredient.flour', to: 'ingredient.gluten_free_flour', reasons: ['gluten_free'], ratio: '1:1', confidence: 0.85 },
  { file: 'butter_dairy_free_oil', from: 'ingredient.butter', to: 'ingredient.oil', reasons: ['dairy_free'], note: 'Neutral oil for cooking', ratio: '3/4', confidence: 0.8 },
  { file: 'chicken_missing_turkey', from: 'ingredient.chicken', to: 'ingredient.turkey', reasons: ['missing'], note: 'Similar lean protein', confidence: 0.85 },
  { file: 'mayonnaise_vegan', from: 'ingredient.mayonnaise', to: 'ingredient.aquafaba', reasons: ['vegan', 'egg_free'], note: 'Blend aquafaba with oil and acid for vegan mayo', confidence: 0.6 },
  { file: 'heavy_cream_vegan_coconut', from: 'ingredient.heavy_cream', to: 'ingredient.coconut_oil', reasons: ['vegan', 'dairy_free'], note: 'Full-fat coconut milk for sauces', confidence: 0.7 },
  { file: 'sour_cream_vegan_yogurt', from: 'ingredient.sour_cream', to: 'ingredient.oat_milk', reasons: ['vegan', 'dairy_free'], note: 'Thickened plant yogurt swap', confidence: 0.65 },
  { file: 'bacon_vegan_mushrooms', from: 'ingredient.bacon', to: 'ingredient.mushrooms', reasons: ['vegan', 'vegetarian'], note: 'Smoked paprika + liquid smoke on mushrooms', confidence: 0.65 },
  { file: 'sausage_vegan_lentils', from: 'ingredient.sausage', to: 'ingredient.lentils', reasons: ['vegan', 'vegetarian'], note: 'Seasoned lentil crumble', confidence: 0.7 },
  { file: 'parmesan_vegan_nutritional_yeast', from: 'ingredient.cheese', to: 'ingredient.nutritional_yeast', reasons: ['vegan'], note: 'Sprinkle for umami — not a melt swap', confidence: 0.6 },
  { file: 'soy_sauce_gluten_free', from: 'ingredient.soy_sauce', to: 'ingredient.soy_sauce', reasons: ['gluten_free'], note: 'Use tamari (gluten-free soy sauce)', confidence: 0.9 },
  { file: 'yogurt_vegan', from: 'ingredient.yogurt', to: 'ingredient.oat_milk', reasons: ['vegan', 'dairy_free'], note: 'Plant yogurt 1:1', confidence: 0.75 },
  { file: 'cream_cheese_vegan', from: 'ingredient.cream_cheese', to: 'ingredient.vegan_cheese', reasons: ['vegan', 'dairy_free'], confidence: 0.65 },
  { file: 'ice_cream_vegan', from: 'ingredient.ice_cream', to: 'ingredient.frozen_fruit', reasons: ['vegan', 'dairy_free'], note: 'Blended frozen fruit nice cream', confidence: 0.6 },
  { file: 'deli_meat_vegan_tofu', from: 'ingredient.deli_meat', to: 'ingredient.tofu', reasons: ['vegan', 'vegetarian'], note: 'Marinated baked tofu slices', confidence: 0.65 },
  { file: 'fish_vegan_tofu', from: 'ingredient.frozen_fish', to: 'ingredient.tofu', reasons: ['vegan', 'vegetarian'], note: 'Crispy tofu for fish-style tacos', confidence: 0.6 },
  { file: 'chicken_breast_missing', from: 'ingredient.chicken_breast', to: 'ingredient.chicken', reasons: ['missing'], note: 'Any cut works — adjust cook time', confidence: 0.9 },
];

function writeJson(dir, file, data, force = false) {
  mkdirSync(dir, { recursive: true });
  const path = join(dir, file);
  if (!force && existsSync(path)) return false;
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n', 'utf8');
  return true;
}

function patchExistingIngredient(id, patch) {
  const fileName = id.replace('ingredient.', '').replace(/\./g, '_') + '.json';
  const paths = [
    join(KNOWLEDGE_ROOT, 'ingredients', fileName),
    join(KNOWLEDGE_ROOT, 'ingredients', id.replace('ingredient.', '') + '.json'),
  ];
  for (const p of paths) {
    if (!existsSync(p)) continue;
    const node = JSON.parse(readFileSync(p, 'utf8'));
    Object.assign(node.attributes ?? (node.attributes = {}), patch.attributes ?? {});
    if (patch.dietary) node.attributes.dietary = { ...node.attributes.dietary, ...patch.dietary };
    writeFileSync(p, JSON.stringify(node, null, 2) + '\n', 'utf8');
    return true;
  }
  return false;
}

let created = 0;
let skipped = 0;
let patched = 0;

// Pantry ingredients
const ingDir = join(KNOWLEDGE_ROOT, 'ingredients');
for (const item of PANTRY_ITEMS) {
  const s = slug(item.name);
  const nodeId = item.link ?? `ingredient.${s}`;
  const fileName = `${s}.json`;
  if (item.link) {
    if (patchExistingIngredient(item.link, { dietary: item.dietary, attributes: { wizard_item: item.name, taxonomy_family: item.taxonomy } })) {
      patched++;
    }
    continue;
  }
  const node = {
    id: nodeId,
    type: 'ingredient',
    display_name: item.name,
    parent_id: `ingredient.${item.category}`,
    attributes: {
      wizard_item: item.name,
      taxonomy_family: item.taxonomy,
      dietary: item.dietary,
      cuisine_tags: [],
    },
    sources: ['generate-pantry-knowledge', 'pantry_wizard_1_0'],
  };
  if (writeJson(ingDir, fileName, node)) created++;
  else skipped++;
}

// Plant-based support ingredients
for (const p of PLANT_BASED) {
  const node = {
    id: `ingredient.${p.id}`,
    type: 'ingredient',
    display_name: p.name,
    parent_id: 'ingredient.plant_based',
    attributes: { dietary: p.dietary },
    sources: ['generate-pantry-knowledge', 'substitution_engine'],
  };
  if (writeJson(ingDir, `${p.id}.json`, node)) created++;
  else skipped++;
}

// Techniques
const techDir = join(KNOWLEDGE_ROOT, 'techniques');
for (const t of TECHNIQUES) {
  const node = {
    id: `technique.${t.id}`,
    type: 'technique',
    display_name: t.name,
    attributes: { cuisine_tags: t.tags },
    sources: ['generate-pantry-knowledge'],
  };
  if (writeJson(techDir, `${t.id}.json`, node)) created++;
  else skipped++;
}

// Flavor profiles
const flavorDir = join(KNOWLEDGE_ROOT, 'flavor_profiles');
for (const f of FLAVOR_PROFILES) {
  const node = {
    id: `flavor_profile.${f.id}`,
    type: 'flavor_profile',
    display_name: f.name,
    attributes: { cuisine_tags: f.tags },
    sources: ['generate-pantry-knowledge'],
  };
  if (writeJson(flavorDir, `${f.id}.json`, node)) created++;
  else skipped++;
}

// Food science
const scienceDir = join(KNOWLEDGE_ROOT, 'food_science');
for (const s of FOOD_SCIENCE) {
  const node = {
    id: `food_science.${s.id}`,
    type: 'food_science',
    display_name: s.name,
    attributes: { micro_lesson: s.lesson },
    sources: ['generate-pantry-knowledge'],
  };
  if (writeJson(scienceDir, `${s.id}.json`, node)) created++;
  else skipped++;
}

// Cuisines
const cuisineDir = join(KNOWLEDGE_ROOT, 'cuisines');
for (const c of CUISINES) {
  const node = {
    id: `cuisine.${c.id}`,
    type: 'cuisine',
    display_name: c.name,
    attributes: { staples: c.staples, cuisine_tags: [c.id] },
    sources: ['generate-pantry-knowledge'],
  };
  if (writeJson(cuisineDir, `${c.id}.json`, node)) created++;
  else skipped++;
}

// Dietary substitution edges
const subDir = join(KNOWLEDGE_ROOT, 'substitutions');
for (const e of DIETARY_EDGES) {
  const node = {
    id: `substitution.${e.file}`,
    type: 'substitution',
    display_name: `${e.from} → ${e.to} (${e.reasons.join(', ')})`,
    attributes: {
      from_id: e.from,
      to_id: e.to,
      reasons: e.reasons,
      note: e.note,
      ratio: e.ratio,
      confidence: e.confidence,
    },
    sources: ['substitution_engine', 'generate-pantry-knowledge'],
  };
  if (writeJson(subDir, `${e.file}.json`, node, false)) created++;
  else {
    writeJson(subDir, `${e.file}.json`, node, true);
    patched++;
  }
}

// Patch core ingredients with dietary profiles
const CORE_PATCHES = [
  { id: 'ingredient.butter', dietary: { vegetarian: true, contains_dairy: true }, substitutes: [
    { id: 'ingredient.oil', note: 'Use 3/4 amount for sauté', reasons: ['missing'] },
    { id: 'ingredient.vegan_butter', note: '1:1 vegan swap', reasons: ['vegan', 'dairy_free'], confidence: 0.9 },
    { id: 'ingredient.coconut_oil', note: 'Baking — may add slight coconut note', reasons: ['vegan', 'dairy_free'], confidence: 0.75 },
  ]},
  { id: 'ingredient.chicken', dietary: { contains_meat: true }, substitutes: [
    { id: 'ingredient.turkey', note: 'Similar lean protein', reasons: ['missing'] },
    { id: 'ingredient.tofu', note: 'Plant-based swap', reasons: ['vegan', 'vegetarian'], confidence: 0.85 },
    { id: 'ingredient.tempeh', note: 'Firm texture', reasons: ['vegan', 'vegetarian'], confidence: 0.75 },
  ]},
  { id: 'ingredient.cheese', dietary: { vegetarian: true, contains_dairy: true }, substitutes: [
    { id: 'ingredient.vegan_cheese', reasons: ['vegan', 'dairy_free'], confidence: 0.7 },
    { id: 'ingredient.nutritional_yeast', note: 'Cheesy flavor in sauces', reasons: ['vegan', 'dairy_free'], confidence: 0.65 },
  ]},
  { id: 'ingredient.milk', dietary: { vegetarian: true, contains_dairy: true }, substitutes: [
    { id: 'ingredient.oat_milk', ratio: '1:1', reasons: ['vegan', 'dairy_free'], confidence: 0.85 },
    { id: 'ingredient.almond_milk', ratio: '1:1', reasons: ['vegan', 'dairy_free'], confidence: 0.8 },
  ]},
  { id: 'ingredient.ground_beef', dietary: { contains_meat: true }, substitutes: [
    { id: 'ingredient.turkey', note: 'Leaner — may need extra fat', reasons: ['missing'] },
    { id: 'ingredient.lentils', note: 'Vegan crumble for tacos', reasons: ['vegan', 'vegetarian'], confidence: 0.8 },
    { id: 'ingredient.mushrooms', note: 'Umami-rich chop', reasons: ['vegan', 'vegetarian'], confidence: 0.75 },
  ]},
  { id: 'ingredient.flour', dietary: { vegetarian: true, contains_gluten: true }, substitutes: [
    { id: 'ingredient.gluten_free_flour', ratio: '1:1', reasons: ['gluten_free'], confidence: 0.85 },
  ]},
  { id: 'ingredient.eggs', dietary: { vegetarian: true, contains_eggs: true }, substitutes: [
    { id: 'ingredient.flax_meal', note: '1 tbsp + 3 tbsp water per egg', reasons: ['vegan', 'egg_free'], confidence: 0.8 },
    { id: 'ingredient.aquafaba', note: '3 tbsp per egg white', reasons: ['vegan', 'egg_free'], confidence: 0.75 },
  ]},
];

for (const p of CORE_PATCHES) {
  if (patchExistingIngredient(p.id, { dietary: p.dietary, attributes: { substitutes: p.substitutes } })) patched++;
}

const stats = { root: KNOWLEDGE_ROOT, created, skipped, patched };
console.log(JSON.stringify(stats, null, 2));
