/**
 * Generate 600+ structured dish nodes under data/ai/dishes/
 * Run: npm run knowledge:dishes
 */

import { writeFileSync, mkdirSync, existsSync, rmSync } from 'fs';
import { join, resolve } from 'path';

const ROOT = process.env.KNOWLEDGE_ROOT
  ? resolve(process.env.KNOWLEDGE_ROOT)
  : resolve('H:/HomeChefAi/data/ai');
const OUT = join(ROOT, 'dishes');

if (existsSync(OUT)) rmSync(OUT, { recursive: true, force: true });

function slug(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

const PROTEINS = [
  { suffix: '', add: null, kw: null },
  { suffix: 'Chicken', add: { name: 'Chicken breast', quantity: 1, unit: 'lb' }, kw: 'chicken' },
  { suffix: 'Beef', add: { name: 'Ground beef', quantity: 1, unit: 'lb' }, kw: 'beef' },
  { suffix: 'Shrimp', add: { name: 'Shrimp', quantity: 12, unit: 'oz' }, kw: 'shrimp' },
  { suffix: 'Sausage', add: { name: 'Sausage', quantity: 12, unit: 'oz' }, kw: 'sausage' },
  { suffix: 'Pork', add: { name: 'Pork chops', quantity: 1, unit: 'lb' }, kw: 'pork' },
  { suffix: 'Tofu', add: { name: 'Tofu', quantity: 14, unit: 'oz' }, kw: 'tofu' },
];

function ing(name, quantity, unit) {
  return { name, quantity, unit };
}

function baseSteps(method) {
  return [
    `Prep ingredients for ${method}.`,
    `Cook over medium-high heat until done, seasoning to taste.`,
    'Rest briefly and serve hot.',
  ];
}

/** @type {Record<string, { id: string; tags: string[]; bases: object[] }>} */
const CUISINES = {
  italian: {
    id: 'cuisine.italian',
    tags: ['italian'],
    bases: [
      { stem: 'Marinara Pasta', meal_types: ['dinner', 'lunch'], prep: 25, tags: ['weeknight', '30_minutes', 'vegetarian'],
        ings: [ing('Spaghetti', 8, 'oz'), ing('Tomato sauce', 2, 'cups'), ing('Garlic', 3, 'cloves'), ing('Olive oil', 2, 'tbsp')],
        staples: ['ingredient.tomato', 'ingredient.garlic'], steps: ['Boil pasta al dente.', 'Simmer garlic in oil, add sauce 10 min.', 'Toss pasta with sauce and serve.'] },
      { stem: 'Aglio e Olio', meal_types: ['dinner'], prep: 20, tags: ['weeknight', '30_minutes', 'vegetarian'], noProtein: true,
        ings: [ing('Spaghetti', 8, 'oz'), ing('Garlic', 6, 'cloves'), ing('Olive oil', 0.25, 'cup'), ing('Red pepper flakes', 0.5, 'tsp')],
        staples: ['ingredient.garlic', 'ingredient.olive_oil'], steps: ['Cook pasta.', 'Sauté sliced garlic in oil until golden.', 'Toss with pasta and pepper flakes.'] },
      { stem: 'Minestrone Soup', meal_types: ['lunch', 'dinner'], prep: 40, tags: ['leftovers_friendly', 'freezer_friendly'], noProtein: true,
        ings: [ing('Diced tomatoes', 1, 'can'), ing('Kidney beans', 1, 'can'), ing('Pasta', 1, 'cup'), ing('Onion', 1, 'each'), ing('Carrots', 2, 'each')],
        staples: ['ingredient.tomato', 'ingredient.beans'], steps: ['Sauté onion and carrot.', 'Add tomatoes, beans, broth; simmer 25 min.', 'Add pasta; cook until tender.'] },
      { stem: 'Caprese Salad', meal_types: ['lunch', 'snack'], prep: 10, tags: ['30_minutes', 'vegetarian'], noProtein: true,
        ings: [ing('Tomatoes', 3, 'each'), ing('Mozzarella', 8, 'oz'), ing('Basil', 0.25, 'cup'), ing('Olive oil', 2, 'tbsp')],
        staples: ['ingredient.tomato', 'ingredient.cheese'], steps: ['Slice tomatoes and mozzarella.', 'Layer with basil.', 'Drizzle oil and season.'] },
      { stem: 'Risotto', meal_types: ['dinner'], prep: 35, tags: ['crowd_favorite'], noProtein: true,
        ings: [ing('Arborio rice', 1.5, 'cups'), ing('Chicken broth', 4, 'cups'), ing('Parmesan', 0.5, 'cup'), ing('Butter', 2, 'tbsp')],
        staples: ['ingredient.rice', 'ingredient.cheese'], steps: ['Toast rice in butter.', 'Add broth ladle by ladle, stirring.', 'Finish with parmesan.'] },
      { stem: 'Eggplant Parmesan', meal_types: ['dinner'], prep: 50, tags: ['crowd_favorite', 'vegetarian'], noProtein: true,
        ings: [ing('Eggplant', 1, 'each'), ing('Tomato sauce', 2, 'cups'), ing('Mozzarella', 2, 'cups'), ing('Bread crumbs', 1, 'cup')],
        staples: ['ingredient.tomato'], steps: ['Bread and bake eggplant slices.', 'Layer with sauce and cheese.', 'Bake until bubbly.'] },
      { stem: 'White Bean Soup', meal_types: ['lunch', 'dinner'], prep: 30, tags: ['weeknight', 'vegetarian'], noProtein: true,
        ings: [ing('Cannellini beans', 2, 'cans'), ing('Garlic', 4, 'cloves'), ing('Kale', 2, 'cups'), ing('Olive oil', 2, 'tbsp')],
        staples: ['ingredient.beans', 'ingredient.garlic'], steps: ['Sauté garlic.', 'Simmer beans with broth; blend partially.', 'Add kale; serve with oil.'] },
      { stem: 'Meatball Sub', meal_types: ['lunch', 'dinner'], prep: 30, tags: ['crowd_favorite'], proteins: ['', 'Beef'],
        ings: [ing('Ground beef', 1, 'lb'), ing('Marinara sauce', 2, 'cups'), ing('Sub rolls', 4, 'each'), ing('Mozzarella', 8, 'oz')],
        staples: ['ingredient.tomato', 'ingredient.beef'], steps: ['Form and brown meatballs.', 'Simmer in sauce.', 'Serve on rolls with cheese.'] },
    ],
  },
  mexican: {
    id: 'cuisine.mexican',
    tags: ['mexican'],
    bases: [
      { stem: 'Tacos', meal_types: ['dinner', 'lunch'], prep: 25, tags: ['weeknight', '30_minutes'],
        ings: [ing('Tortillas', 8, 'each'), ing('Ground beef', 1, 'lb'), ing('Lettuce', 2, 'cups'), ing('Cheese', 1, 'cup'), ing('Salsa', 0.5, 'cup')],
        staples: ['ingredient.beef'], steps: ['Season and cook protein.', 'Warm tortillas.', 'Assemble with toppings.'] },
      { stem: 'Burrito Bowl', meal_types: ['dinner', 'lunch'], prep: 30, tags: ['meal_prep', 'leftovers_friendly'],
        ings: [ing('Rice', 2, 'cups'), ing('Black beans', 1, 'can'), ing('Corn', 1, 'cup'), ing('Salsa', 0.5, 'cup'), ing('Sour cream', 0.25, 'cup')],
        staples: ['ingredient.rice', 'ingredient.beans'], steps: ['Cook rice.', 'Warm beans and corn.', 'Layer bowl with toppings.'] },
      { stem: 'Enchiladas', meal_types: ['dinner'], prep: 40, tags: ['crowd_favorite'],
        ings: [ing('Tortillas', 8, 'each'), ing('Enchilada sauce', 2, 'cups'), ing('Cheese', 2, 'cups'), ing('Onion', 1, 'each')],
        staples: ['ingredient.cheese'], steps: ['Fill tortillas with protein and cheese.', 'Roll and place in dish.', 'Cover with sauce; bake 20 min.'] },
      { stem: 'Quesadilla', meal_types: ['lunch', 'snack', 'dinner'], prep: 15, tags: ['30_minutes', 'easy_night'],
        ings: [ing('Tortillas', 4, 'each'), ing('Cheese', 2, 'cups'), ing('Bell pepper', 1, 'each')],
        staples: ['ingredient.cheese'], steps: ['Fill tortilla with cheese and peppers.', 'Cook in skillet until crisp.', 'Cut into wedges.'] },
      { stem: 'Mexican Rice', meal_types: ['dinner', 'lunch'], prep: 25, tags: ['weeknight'], noProtein: true,
        ings: [ing('White rice', 1.5, 'cups'), ing('Tomato sauce', 0.5, 'cup'), ing('Cumin', 1, 'tsp'), ing('Garlic', 2, 'cloves')],
        staples: ['ingredient.rice', 'ingredient.cumin'], steps: ['Toast rice with garlic.', 'Add tomato sauce and broth.', 'Simmer covered 18 min.'] },
      { stem: 'Guacamole', meal_types: ['snack'], prep: 10, tags: ['30_minutes', 'vegetarian'], noProtein: true,
        ings: [ing('Avocado', 3, 'each'), ing('Lime', 1, 'each'), ing('Onion', 0.25, 'cup'), ing('Cilantro', 0.25, 'cup')],
        staples: [], steps: ['Mash avocados.', 'Mix in lime, onion, cilantro.', 'Season with salt.'] },
      { stem: 'Pozole', meal_types: ['dinner'], prep: 60, tags: ['crowd_favorite', 'leftovers_friendly'],
        ings: [ing('Hominy', 2, 'cans'), ing('Pork shoulder', 1.5, 'lb'), ing('Chili powder', 2, 'tbsp'), ing('Onion', 1, 'each')],
        staples: ['ingredient.pork'], steps: ['Simmer pork with hominy and spices.', 'Shred pork; return to pot.', 'Serve with radish and lime.'] },
      { stem: 'Fajitas', meal_types: ['dinner'], prep: 25, tags: ['weeknight', '30_minutes'],
        ings: [ing('Bell peppers', 3, 'each'), ing('Onion', 1, 'each'), ing('Tortillas', 8, 'each'), ing('Lime', 1, 'each')],
        staples: [], steps: ['Slice peppers and onion.', 'Sear protein and vegetables.', 'Serve with warm tortillas.'] },
    ],
  },
  southern: {
    id: 'cuisine.southern',
    tags: ['southern'],
    bases: [
      { stem: 'Biscuits and Gravy', meal_types: ['breakfast'], prep: 25, tags: ['crowd_favorite'], noProtein: true,
        ings: [ing('Biscuit mix', 2, 'cups'), ing('Sausage', 8, 'oz'), ing('Milk', 2, 'cups'), ing('Flour', 2, 'tbsp')],
        staples: ['ingredient.flour'], steps: ['Bake biscuits.', 'Brown sausage; make roux gravy.', 'Split biscuits; top with gravy.'] },
      { stem: 'Fried Chicken', meal_types: ['dinner'], prep: 45, tags: ['crowd_favorite'], proteins: ['', 'Chicken'],
        ings: [ing('Chicken pieces', 2, 'lb'), ing('Buttermilk', 2, 'cups'), ing('Flour', 2, 'cups'), ing('Paprika', 1, 'tbsp')],
        staples: ['ingredient.chicken', 'ingredient.flour'], steps: ['Soak chicken in buttermilk.', 'Dredge in seasoned flour.', 'Fry until golden and cooked through.'] },
      { stem: 'Mac and Cheese', meal_types: ['dinner', 'lunch'], prep: 30, tags: ['kid_friendly', 'crowd_favorite'], noProtein: true,
        ings: [ing('Macaroni', 1, 'lb'), ing('Cheddar cheese', 3, 'cups'), ing('Milk', 2, 'cups'), ing('Butter', 4, 'tbsp')],
        staples: ['ingredient.cheese'], steps: ['Cook pasta.', 'Make cheese sauce with butter, milk, cheese.', 'Combine and bake optional.'] },
      { stem: 'Collard Greens', meal_types: ['dinner'], prep: 50, tags: ['leftovers_friendly'], proteins: ['', 'Pork'],
        ings: [ing('Collard greens', 2, 'bunches'), ing('Bacon', 4, 'slices'), ing('Onion', 1, 'each'), ing('Chicken broth', 2, 'cups')],
        staples: [], steps: ['Render bacon; sauté onion.', 'Add greens and broth; simmer 40 min.', 'Season with vinegar.'] },
      { stem: 'Cornbread', meal_types: ['dinner', 'lunch'], prep: 30, tags: ['crowd_favorite'], noProtein: true,
        ings: [ing('Cornmeal', 1, 'cup'), ing('Flour', 1, 'cup'), ing('Buttermilk', 1.5, 'cups'), ing('Eggs', 2, 'each')],
        staples: ['ingredient.flour'], steps: ['Mix dry ingredients.', 'Whisk wet; combine.', 'Bake in cast iron 25 min.'] },
      { stem: 'Chicken and Dumplings', meal_types: ['dinner'], prep: 50, tags: ['comfort', 'leftovers_friendly'], proteins: ['', 'Chicken'],
        ings: [ing('Chicken thighs', 1.5, 'lb'), ing('Flour', 2, 'cups'), ing('Carrots', 2, 'each'), ing('Celery', 2, 'stalks')],
        staples: ['ingredient.chicken'], steps: ['Simmer chicken with vegetables.', 'Shred chicken; return to pot.', 'Drop dumplings; cover and cook 15 min.'] },
      { stem: 'Shrimp and Grits', meal_types: ['dinner', 'breakfast'], prep: 30, tags: ['crowd_favorite'], proteins: ['', 'Shrimp'],
        ings: [ing('Shrimp', 1, 'lb'), ing('Grits', 1, 'cup'), ing('Cheddar', 1, 'cup'), ing('Bacon', 4, 'slices')],
        staples: ['ingredient.shrimp'], steps: ['Cook grits with cheese.', 'Sauté shrimp with bacon.', 'Serve shrimp over grits.'] },
      { stem: 'Pulled Pork Sandwich', meal_types: ['lunch', 'dinner'], prep: 240, tags: ['crowd_favorite', 'leftovers_friendly'], proteins: ['', 'Pork'],
        ings: [ing('Pork shoulder', 3, 'lb'), ing('BBQ sauce', 2, 'cups'), ing('Hamburger buns', 6, 'each'), ing('Coleslaw mix', 2, 'cups')],
        staples: ['ingredient.pork'], steps: ['Slow cook pork with rub until tender.', 'Shred and mix with sauce.', 'Serve on buns with slaw.'] },
    ],
  },
  cajun: {
    id: 'cuisine.cajun',
    tags: ['cajun', 'louisiana'],
    bases: [
      { stem: 'Jambalaya', meal_types: ['dinner'], prep: 45, tags: ['crowd_favorite', 'one_pot'],
        ings: [ing('Rice', 2, 'cups'), ing('Andouille sausage', 12, 'oz'), ing('Bell pepper', 2, 'each'), ing('Cajun seasoning', 2, 'tbsp')],
        staples: ['ingredient.rice'], steps: ['Brown sausage and vegetables.', 'Add rice, broth, seasoning; simmer.', 'Cover until rice is tender.'] },
      { stem: 'Gumbo', meal_types: ['dinner'], prep: 60, tags: ['crowd_favorite', 'leftovers_friendly'],
        ings: [ing('Okra', 2, 'cups'), ing('Andouille', 12, 'oz'), ing('Flour', 0.5, 'cup'), ing('Rice', 2, 'cups')],
        staples: ['ingredient.rice', 'ingredient.flour'], steps: ['Make dark roux.', 'Add trinity vegetables and broth.', 'Simmer; serve over rice.'] },
      { stem: 'Red Beans and Rice', meal_types: ['dinner', 'lunch'], prep: 90, tags: ['leftovers_friendly', 'budget'],
        ings: [ing('Red kidney beans', 1, 'lb'), ing('Andouille', 8, 'oz'), ing('Rice', 2, 'cups'), ing('Onion', 1, 'each')],
        staples: ['ingredient.beans', 'ingredient.rice'], steps: ['Simmer beans with sausage and spices.', 'Mash some beans for thickness.', 'Serve over rice.'] },
      { stem: 'Blackened Fish', meal_types: ['dinner'], prep: 20, tags: ['30_minutes', 'weeknight'], proteins: ['', 'Shrimp'],
        ings: [ing('White fish fillets', 1.5, 'lb'), ing('Cajun seasoning', 2, 'tbsp'), ing('Butter', 4, 'tbsp'), ing('Lemon', 1, 'each')],
        staples: ['ingredient.fish'], steps: ['Coat fish heavily with seasoning.', 'Sear in hot cast iron.', 'Finish with butter and lemon.'] },
      { stem: 'Étouffée', meal_types: ['dinner'], prep: 40, tags: ['crowd_favorite'], proteins: ['', 'Shrimp'],
        ings: [ing('Shrimp', 1, 'lb'), ing('Flour', 0.25, 'cup'), ing('Bell pepper', 1, 'each'), ing('Rice', 2, 'cups')],
        staples: ['ingredient.shrimp', 'ingredient.rice'], steps: ['Make blonde roux.', 'Add vegetables and stock.', 'Simmer shrimp; serve over rice.'] },
      { stem: 'Cajun Pasta', meal_types: ['dinner'], prep: 30, tags: ['weeknight', '30_minutes'],
        ings: [ing('Penne', 12, 'oz'), ing('Heavy cream', 1, 'cup'), ing('Cajun seasoning', 1, 'tbsp'), ing('Parmesan', 0.5, 'cup')],
        staples: [], steps: ['Cook pasta.', 'Sauté protein with Cajun spice.', 'Toss with cream sauce.'] },
    ],
  },
  asian: {
    id: 'cuisine.asian',
    tags: ['asian'],
    bases: [
      { stem: 'Fried Rice', meal_types: ['dinner', 'lunch'], prep: 20, tags: ['weeknight', '30_minutes', 'leftovers_friendly'], noProtein: true,
        ings: [ing('Cooked rice', 3, 'cups'), ing('Eggs', 2, 'each'), ing('Soy sauce', 3, 'tbsp'), ing('Peas', 0.5, 'cup'), ing('Carrots', 1, 'cup')],
        staples: ['ingredient.rice'], steps: ['Scramble eggs; set aside.', 'Stir-fry rice and vegetables.', 'Add soy sauce and eggs.'] },
      { stem: 'Stir Fry', meal_types: ['dinner'], prep: 25, tags: ['weeknight', '30_minutes'],
        ings: [ing('Mixed vegetables', 4, 'cups'), ing('Soy sauce', 3, 'tbsp'), ing('Garlic', 3, 'cloves'), ing('Ginger', 1, 'tbsp'), ing('Rice', 2, 'cups')],
        staples: [], steps: ['Prep sauce with soy, garlic, ginger.', 'High heat stir-fry protein.', 'Add vegetables; serve over rice.'] },
      { stem: 'Teriyaki Bowl', meal_types: ['dinner', 'lunch'], prep: 25, tags: ['weeknight', '30_minutes'],
        ings: [ing('Rice', 2, 'cups'), ing('Soy sauce', 0.25, 'cup'), ing('Brown sugar', 2, 'tbsp'), ing('Broccoli', 2, 'cups')],
        staples: ['ingredient.rice'], steps: ['Cook rice.', 'Glaze protein in teriyaki sauce.', 'Steam broccoli; assemble bowls.'] },
      { stem: 'Ramen Upgrade', meal_types: ['lunch', 'dinner'], prep: 15, tags: ['30_minutes', 'easy_night'], noProtein: true,
        ings: [ing('Ramen noodles', 2, 'packs'), ing('Eggs', 2, 'each'), ing('Green onions', 2, 'each'), ing('Soy sauce', 2, 'tbsp')],
        staples: [], steps: ['Boil noodles in enhanced broth.', 'Soft boil eggs.', 'Top with scallions and protein.'] },
      { stem: 'Spring Rolls', meal_types: ['lunch', 'snack'], prep: 30, tags: ['30_minutes'], noProtein: true,
        ings: [ing('Rice paper', 8, 'sheets'), ing('Lettuce', 2, 'cups'), ing('Carrots', 1, 'cup'), ing('Rice noodles', 4, 'oz')],
        staples: [], steps: ['Soften rice paper.', 'Fill with vegetables and noodles.', 'Serve with dipping sauce.'] },
      { stem: 'Miso Soup', meal_types: ['lunch', 'dinner'], prep: 15, tags: ['30_minutes'], noProtein: true,
        ings: [ing('Miso paste', 3, 'tbsp'), ing('Tofu', 8, 'oz'), ing('Green onions', 2, 'each'), ing('Dashi or broth', 4, 'cups')],
        staples: ['ingredient.tofu'], steps: ['Heat broth.', 'Dissolve miso off heat.', 'Add tofu and scallions.'] },
      { stem: 'Pad Thai', meal_types: ['dinner'], prep: 30, tags: ['weeknight', '30_minutes'],
        ings: [ing('Rice noodles', 8, 'oz'), ing('Fish sauce', 2, 'tbsp'), ing('Peanuts', 0.25, 'cup'), ing('Lime', 1, 'each'), ing('Eggs', 2, 'each')],
        staples: [], steps: ['Soak noodles.', 'Stir-fry protein and eggs.', 'Toss with sauce, peanuts, lime.'] },
      { stem: 'Dumpling Soup', meal_types: ['dinner', 'lunch'], prep: 25, tags: ['weeknight'], noProtein: true,
        ings: [ing('Frozen dumplings', 12, 'each'), ing('Chicken broth', 6, 'cups'), ing('Bok choy', 2, 'cups'), ing('Soy sauce', 2, 'tbsp')],
        staples: [], steps: ['Simmer broth with aromatics.', 'Add dumplings; cook until floating.', 'Add greens; serve.'] },
    ],
  },
  bbq: {
    id: 'cuisine.bbq',
    tags: ['bbq', 'smoked'],
    bases: [
      { stem: 'BBQ Chicken', meal_types: ['dinner'], prep: 35, tags: ['crowd_favorite'], proteins: ['', 'Chicken'],
        ings: [ing('Chicken thighs', 2, 'lb'), ing('BBQ sauce', 1.5, 'cups'), ing('Paprika', 1, 'tbsp'), ing('Garlic powder', 1, 'tsp')],
        staples: ['ingredient.chicken'], steps: ['Season chicken.', 'Grill or bake until done.', 'Glaze with BBQ sauce.'] },
      { stem: 'Smoked Brisket Tacos', meal_types: ['dinner', 'lunch'], prep: 360, tags: ['crowd_favorite'], proteins: ['', 'Beef'],
        ings: [ing('Beef brisket', 3, 'lb'), ing('Tortillas', 8, 'each'), ing('Pickled onions', 1, 'cup'), ing('Cilantro', 0.25, 'cup')],
        staples: ['ingredient.beef'], steps: ['Smoke brisket low and slow.', 'Rest and slice thin.', 'Serve on tortillas with pickles.'] },
      { stem: 'Coleslaw', meal_types: ['dinner', 'lunch'], prep: 15, tags: ['30_minutes'], noProtein: true,
        ings: [ing('Cabbage', 0.5, 'head'), ing('Carrots', 2, 'each'), ing('Mayonnaise', 0.5, 'cup'), ing('Vinegar', 2, 'tbsp')],
        staples: [], steps: ['Shred cabbage and carrot.', 'Whisk dressing.', 'Toss and chill.'] },
      { stem: 'Baked Beans', meal_types: ['dinner'], prep: 60, tags: ['leftovers_friendly', 'crowd_favorite'], noProtein: true,
        ings: [ing('Baked beans', 2, 'cans'), ing('BBQ sauce', 0.5, 'cup'), ing('Brown sugar', 0.25, 'cup'), ing('Bacon', 4, 'slices')],
        staples: ['ingredient.beans'], steps: ['Mix beans with sauce and sugar.', 'Top with bacon.', 'Bake 45 min.'] },
      { stem: 'Corn on the Cob', meal_types: ['dinner'], prep: 15, tags: ['30_minutes', 'kid_friendly'], noProtein: true,
        ings: [ing('Corn', 6, 'ears'), ing('Butter', 4, 'tbsp'), ing('Salt', 1, 'tsp')],
        staples: [], steps: ['Boil or grill corn.', 'Brush with butter.', 'Season and serve.'] },
      { stem: 'BBQ Meatballs', meal_types: ['dinner', 'snack'], prep: 30, tags: ['crowd_favorite', 'kid_friendly'], proteins: ['', 'Beef'],
        ings: [ing('Ground beef', 1.5, 'lb'), ing('BBQ sauce', 1, 'cup'), ing('Bread crumbs', 0.5, 'cup'), ing('Eggs', 1, 'each')],
        staples: ['ingredient.beef'], steps: ['Mix and form meatballs.', 'Bake until browned.', 'Simmer in BBQ sauce.'] },
    ],
  },
  comfort: {
    id: 'cuisine.comfort',
    tags: ['comfort', 'american'],
    bases: [
      { stem: 'Grilled Cheese', meal_types: ['lunch', 'dinner'], prep: 10, tags: ['30_minutes', 'easy_night', 'kid_friendly'], noProtein: true,
        ings: [ing('Bread', 4, 'slices'), ing('Cheese', 4, 'slices'), ing('Butter', 2, 'tbsp')],
        staples: ['ingredient.cheese', 'ingredient.butter'], steps: ['Butter bread.', 'Cook cheese sandwich in skillet until golden.', 'Flip and melt cheese.'] },
      { stem: 'Tomato Soup', meal_types: ['lunch', 'dinner'], prep: 25, tags: ['weeknight', 'vegetarian'], noProtein: true,
        ings: [ing('Tomato sauce', 2, 'cans'), ing('Heavy cream', 0.5, 'cup'), ing('Basil', 0.25, 'cup'), ing('Garlic', 2, 'cloves')],
        staples: ['ingredient.tomato'], steps: ['Simmer tomatoes with garlic.', 'Blend smooth.', 'Stir in cream and basil.'] },
      { stem: 'Shepherd\'s Pie', meal_types: ['dinner'], prep: 50, tags: ['leftovers_friendly', 'freezer_friendly'], proteins: ['', 'Beef'],
        ings: [ing('Ground beef', 1, 'lb'), ing('Potatoes', 2, 'lb'), ing('Peas', 1, 'cup'), ing('Beef broth', 1, 'cup')],
        staples: ['ingredient.potato', 'ingredient.beef'], steps: ['Cook filling with beef and peas.', 'Top with mashed potatoes.', 'Bake until golden.'] },
      { stem: 'Pot Roast', meal_types: ['dinner'], prep: 180, tags: ['leftovers_friendly', 'crowd_favorite'], proteins: ['', 'Beef'],
        ings: [ing('Chuck roast', 3, 'lb'), ing('Potatoes', 1.5, 'lb'), ing('Carrots', 1, 'lb'), ing('Onion', 1, 'each')],
        staples: ['ingredient.beef', 'ingredient.potato'], steps: ['Sear roast.', 'Braise with vegetables 3 hours.', 'Slice and serve with pan juices.'] },
      { stem: 'Tuna Melt', meal_types: ['lunch'], prep: 15, tags: ['30_minutes', 'easy_night'], noProtein: true,
        ings: [ing('Canned tuna', 2, 'cans'), ing('Bread', 4, 'slices'), ing('Cheese', 4, 'slices'), ing('Mayonnaise', 3, 'tbsp')],
        staples: [], steps: ['Mix tuna with mayo.', 'Top bread with tuna and cheese.', 'Broil until melted.'] },
      { stem: 'Sloppy Joes', meal_types: ['dinner', 'lunch'], prep: 25, tags: ['kid_friendly', 'weeknight'], proteins: ['', 'Beef'],
        ings: [ing('Ground beef', 1, 'lb'), ing('Tomato sauce', 1, 'can'), ing('Hamburger buns', 6, 'each'), ing('Onion', 1, 'each')],
        staples: ['ingredient.beef', 'ingredient.tomato'], steps: ['Brown beef with onion.', 'Simmer with sauce 15 min.', 'Serve on buns.'] },
      { stem: 'Baked Ziti', meal_types: ['dinner'], prep: 45, tags: ['crowd_favorite', 'freezer_friendly'], noProtein: true,
        ings: [ing('Ziti pasta', 1, 'lb'), ing('Ricotta', 15, 'oz'), ing('Marinara', 3, 'cups'), ing('Mozzarella', 2, 'cups')],
        staples: ['ingredient.tomato', 'ingredient.cheese'], steps: ['Cook pasta.', 'Layer with sauce and cheeses.', 'Bake 25 min.'] },
      { stem: 'Chicken Pot Pie', meal_types: ['dinner'], prep: 55, tags: ['crowd_favorite', 'freezer_friendly'], proteins: ['', 'Chicken'],
        ings: [ing('Chicken breast', 1, 'lb'), ing('Pie crust', 2, 'sheets'), ing('Mixed vegetables', 2, 'cups'), ing('Chicken broth', 1.5, 'cups')],
        staples: ['ingredient.chicken'], steps: ['Make creamy filling with chicken and veg.', 'Fill crust.', 'Bake until golden.'] },
    ],
  },
  mediterranean: {
    id: 'cuisine.mediterranean',
    tags: ['mediterranean'],
    bases: [
      { stem: 'Greek Salad', meal_types: ['lunch', 'dinner'], prep: 15, tags: ['30_minutes', 'vegetarian'], noProtein: true,
        ings: [ing('Cucumber', 1, 'each'), ing('Tomatoes', 3, 'each'), ing('Feta cheese', 4, 'oz'), ing('Olives', 0.5, 'cup'), ing('Olive oil', 3, 'tbsp')],
        staples: ['ingredient.olive_oil', 'ingredient.cheese'], steps: ['Chop vegetables.', 'Add feta and olives.', 'Dress with olive oil and oregano.'] },
      { stem: 'Hummus Bowl', meal_types: ['lunch', 'dinner'], prep: 15, tags: ['30_minutes', 'vegetarian'], noProtein: true,
        ings: [ing('Chickpeas', 1, 'can'), ing('Tahini', 3, 'tbsp'), ing('Pita bread', 4, 'each'), ing('Cucumber', 1, 'each')],
        staples: ['ingredient.beans'], steps: ['Blend chickpeas into hummus.', 'Warm pita.', 'Serve bowl with fresh vegetables.'] },
      { stem: 'Shakshuka', meal_types: ['breakfast', 'dinner'], prep: 30, tags: ['weeknight', '30_minutes'], noProtein: true,
        ings: [ing('Eggs', 4, 'each'), ing('Crushed tomatoes', 1, 'can'), ing('Bell pepper', 1, 'each'), ing('Cumin', 1, 'tsp')],
        staples: ['ingredient.tomato', 'ingredient.cumin'], steps: ['Simmer pepper-tomato sauce.', 'Make wells; crack eggs.', 'Cover until eggs set.'] },
      { stem: 'Lemon Herb Chicken', meal_types: ['dinner'], prep: 35, tags: ['weeknight'], proteins: ['', 'Chicken'],
        ings: [ing('Chicken thighs', 1.5, 'lb'), ing('Lemon', 2, 'each'), ing('Olive oil', 3, 'tbsp'), ing('Oregano', 1, 'tbsp')],
        staples: ['ingredient.chicken', 'ingredient.olive_oil'], steps: ['Marinate chicken in lemon and herbs.', 'Roast or grill until done.', 'Rest and serve.'] },
      { stem: 'Falafel Wrap', meal_types: ['lunch', 'dinner'], prep: 30, tags: ['vegetarian'], noProtein: true,
        ings: [ing('Chickpeas', 1, 'can'), ing('Pita', 4, 'each'), ing('Tahini', 3, 'tbsp'), ing('Lettuce', 2, 'cups')],
        staples: ['ingredient.beans'], steps: ['Form and fry falafel.', 'Warm pita.', 'Wrap with tahini and greens.'] },
      { stem: 'Mediterranean Pasta', meal_types: ['dinner'], prep: 25, tags: ['weeknight', '30_minutes'], noProtein: true,
        ings: [ing('Penne', 12, 'oz'), ing('Sun-dried tomatoes', 0.5, 'cup'), ing('Olives', 0.5, 'cup'), ing('Feta', 4, 'oz')],
        staples: ['ingredient.olive_oil'], steps: ['Cook pasta.', 'Toss with tomatoes, olives, feta.', 'Finish with olive oil.'] },
    ],
  },
  indian: {
    id: 'cuisine.indian',
    tags: ['indian'],
    bases: [
      { stem: 'Butter Chicken', meal_types: ['dinner'], prep: 40, tags: ['crowd_favorite'], proteins: ['', 'Chicken'],
        ings: [ing('Chicken breast', 1.5, 'lb'), ing('Tomato sauce', 1, 'can'), ing('Heavy cream', 0.5, 'cup'), ing('Garam masala', 1, 'tbsp')],
        staples: ['ingredient.chicken', 'ingredient.tomato'], steps: ['Simmer spiced tomato cream sauce.', 'Add cooked chicken.', 'Serve with rice.'] },
      { stem: 'Chickpea Curry', meal_types: ['dinner', 'lunch'], prep: 35, tags: ['vegetarian', 'leftovers_friendly'], noProtein: true,
        ings: [ing('Chickpeas', 2, 'cans'), ing('Coconut milk', 1, 'can'), ing('Curry powder', 2, 'tbsp'), ing('Rice', 2, 'cups')],
        staples: ['ingredient.beans', 'ingredient.rice'], steps: ['Sauté aromatics and spices.', 'Simmer chickpeas in coconut milk.', 'Serve over rice.'] },
      { stem: 'Dal Tadka', meal_types: ['dinner', 'lunch'], prep: 40, tags: ['vegetarian', 'budget'], noProtein: true,
        ings: [ing('Red lentils', 1, 'cup'), ing('Turmeric', 1, 'tsp'), ing('Cumin', 1, 'tsp'), ing('Ghee or butter', 2, 'tbsp')],
        staples: ['ingredient.cumin'], steps: ['Cook lentils until soft.', 'Temper spices in hot fat.', 'Stir into dal.'] },
      { stem: 'Vegetable Biryani', meal_types: ['dinner'], prep: 50, tags: ['crowd_favorite'], noProtein: true,
        ings: [ing('Basmati rice', 2, 'cups'), ing('Mixed vegetables', 3, 'cups'), ing('Yogurt', 0.5, 'cup'), ing('Biryani spice', 2, 'tbsp')],
        staples: ['ingredient.rice'], steps: ['Par-cook rice.', 'Layer with spiced vegetables.', 'Dum cook 25 min.'] },
      { stem: 'Saag Paneer', meal_types: ['dinner'], prep: 35, tags: ['vegetarian'], noProtein: true,
        ings: [ing('Spinach', 1, 'lb'), ing('Paneer or cheese', 8, 'oz'), ing('Garam masala', 1, 'tsp'), ing('Cream', 0.25, 'cup')],
        staples: [], steps: ['Blanch and blend spinach.', 'Simmer with spices and cream.', 'Add paneer cubes.'] },
      { stem: 'Tikka Masala', meal_types: ['dinner'], prep: 45, tags: ['crowd_favorite'],
        ings: [ing('Yogurt', 1, 'cup'), ing('Tomato sauce', 1, 'can'), ing('Garam masala', 1, 'tbsp'), ing('Rice', 2, 'cups')],
        staples: ['ingredient.tomato'], steps: ['Marinate and cook protein.', 'Simmer in masala sauce.', 'Serve with rice.'] },
    ],
  },
  tex_mex: {
    id: 'cuisine.tex_mex',
    tags: ['tex_mex', 'mexican'],
    bases: [
      { stem: 'Nachos', meal_types: ['snack', 'dinner'], prep: 20, tags: ['crowd_favorite', 'easy_night'], noProtein: true,
        ings: [ing('Tortilla chips', 1, 'bag'), ing('Cheese', 3, 'cups'), ing('Jalapeños', 0.25, 'cup'), ing('Salsa', 0.5, 'cup')],
        staples: ['ingredient.cheese'], steps: ['Layer chips and cheese.', 'Bake until melted.', 'Top with salsa and jalapeños.'] },
      { stem: 'Chili con Carne', meal_types: ['dinner'], prep: 60, tags: ['leftovers_friendly', 'freezer_friendly'], proteins: ['', 'Beef'],
        ings: [ing('Ground beef', 1.5, 'lb'), ing('Kidney beans', 1, 'can'), ing('Crushed tomatoes', 1, 'can'), ing('Chili powder', 2, 'tbsp')],
        staples: ['ingredient.beef', 'ingredient.beans'], steps: ['Brown beef with onion.', 'Simmer with beans and tomatoes 45 min.', 'Season to taste.'] },
      { stem: 'Breakfast Burrito', meal_types: ['breakfast'], prep: 20, tags: ['30_minutes'],
        ings: [ing('Tortillas', 4, 'each'), ing('Eggs', 4, 'each'), ing('Cheese', 1, 'cup'), ing('Salsa', 0.5, 'cup')],
        staples: [], steps: ['Scramble eggs.', 'Fill tortillas with eggs, cheese, salsa.', 'Optional sear in skillet.'] },
      { stem: 'Street Corn', meal_types: ['snack', 'dinner'], prep: 15, tags: ['30_minutes'], noProtein: true,
        ings: [ing('Corn', 4, 'ears'), ing('Mayonnaise', 0.25, 'cup'), ing('Cotija or cheese', 0.5, 'cup'), ing('Lime', 2, 'each')],
        staples: ['ingredient.cheese'], steps: ['Grill corn.', 'Coat with mayo and cheese.', 'Sprinkle chili and lime.'] },
      { stem: 'Loaded Potato Skins', meal_types: ['snack', 'dinner'], prep: 35, tags: ['crowd_favorite'], proteins: ['', 'Bacon'],
        ings: [ing('Potatoes', 4, 'each'), ing('Bacon', 6, 'slices'), ing('Cheese', 2, 'cups'), ing('Sour cream', 0.5, 'cup')],
        staples: ['ingredient.potato'], steps: ['Bake potatoes; scoop centers.', 'Fill with bacon and cheese.', 'Broil until crisp.'] },
      { stem: 'Tex-Mex Casserole', meal_types: ['dinner'], prep: 45, tags: ['crowd_favorite', 'freezer_friendly'],
        ings: [ing('Tortillas', 8, 'each'), ing('Ground beef', 1, 'lb'), ing('Enchilada sauce', 2, 'cups'), ing('Cheese', 2, 'cups')],
        staples: ['ingredient.beef'], steps: ['Layer tortillas, beef, sauce, cheese.', 'Repeat layers.', 'Bake 30 min.'] },
    ],
  },
};

/** Breakfast staples shared across cuisines */
const BREAKFAST_GLOBAL = [
  { stem: 'Oatmeal Bowl', cuisines: ['comfort', 'southern'], meal_types: ['breakfast'], prep: 10, tags: ['30_minutes', 'kid_friendly'],
    ings: [ing('Oats', 1, 'cup'), ing('Milk', 2, 'cups'), ing('Banana', 1, 'each'), ing('Cinnamon', 0.5, 'tsp')],
    steps: ['Simmer oats in milk.', 'Top with banana and cinnamon.', 'Serve warm.'] },
  { stem: 'Scrambled Eggs', cuisines: ['comfort', 'southern', 'mediterranean'], meal_types: ['breakfast'], prep: 10, tags: ['30_minutes'],
    ings: [ing('Eggs', 4, 'each'), ing('Butter', 1, 'tbsp'), ing('Salt', 0.25, 'tsp'), ing('Black pepper', 0.25, 'tsp')],
    steps: ['Whisk eggs.', 'Cook low in butter.', 'Season and serve.'] },
  { stem: 'French Toast', cuisines: ['comfort', 'southern'], meal_types: ['breakfast'], prep: 15, tags: ['30_minutes', 'kid_friendly'],
    ings: [ing('Bread', 6, 'slices'), ing('Eggs', 2, 'each'), ing('Milk', 0.5, 'cup'), ing('Cinnamon', 1, 'tsp')],
    steps: ['Soak bread in egg mixture.', 'Cook in buttered skillet.', 'Serve with syrup.'] },
  { stem: 'Yogurt Parfait', cuisines: ['mediterranean', 'comfort'], meal_types: ['breakfast', 'snack'], prep: 5, tags: ['30_minutes'],
    ings: [ing('Yogurt', 2, 'cups'), ing('Granola', 1, 'cup'), ing('Berries', 1, 'cup'), ing('Honey', 2, 'tbsp')],
    steps: ['Layer yogurt and granola.', 'Top with berries.', 'Drizzle honey.'] },
  { stem: 'Breakfast Quesadilla', cuisines: ['tex_mex', 'mexican'], meal_types: ['breakfast'], prep: 15, tags: ['30_minutes'],
    ings: [ing('Tortillas', 2, 'each'), ing('Eggs', 3, 'each'), ing('Cheese', 1, 'cup'), ing('Salsa', 0.25, 'cup')],
    steps: ['Scramble eggs.', 'Fill tortilla with eggs and cheese.', 'Grill until crisp.'] },
];

function expandBase(cuisineKey, cuisineMeta, base) {
  const proteins = base.proteins
    ? PROTEINS.filter((p) => base.proteins.includes(p.suffix))
    : base.noProtein
      ? [PROTEINS[0]]
      : PROTEINS;

  const out = [];
  for (const p of proteins) {
    const title = p.suffix ? `${p.suffix} ${base.stem}` : base.stem;
    const ingredients = [...base.ings];
    if (p.add && !ingredients.some((i) => i.name.toLowerCase().includes(p.kw))) {
      ingredients.unshift(p.add);
    }
    const keywords = [title.toLowerCase(), base.stem.toLowerCase()];
    if (p.kw) keywords.push(`${p.kw} ${base.stem.toLowerCase()}`, p.kw);

    out.push({
      id: `dish.${cuisineKey}.${slug(title)}`,
      type: 'dish',
      display_name: title,
      description: `${title} — ${cuisineMeta.tags[0]} home-style template from the SousChef library.`,
      attributes: {
        cuisine_id: cuisineMeta.id,
        cuisine_tags: cuisineMeta.tags,
        meal_types: base.meal_types,
        prep_time_minutes: base.prep,
        tags: base.tags,
        match_keywords: keywords,
        ingredients,
        required_staples: base.staples ?? [],
        steps: base.steps ?? baseSteps(title),
      },
      sources: ['generated'],
    });
  }
  return out;
}

function writeDish(dish) {
  const cuisinePart = dish.id.split('.')[1] ?? 'other';
  const dir = join(OUT, cuisinePart);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const file = join(dir, `${dish.id.split('.').slice(2).join('_')}.json`);
  writeFileSync(file, JSON.stringify(dish, null, 2) + '\n', 'utf8');
}

let count = 0;
for (const [key, meta] of Object.entries(CUISINES)) {
  for (const base of meta.bases) {
    for (const dish of expandBase(key, meta, base)) {
      writeDish(dish);
      count++;
    }
  }
}

for (const bg of BREAKFAST_GLOBAL) {
  for (const ck of bg.cuisines) {
    const meta = CUISINES[ck];
    if (!meta) continue;
    const base = {
      stem: bg.stem,
      meal_types: bg.meal_types,
      prep: bg.prep,
      tags: bg.tags,
      ings: bg.ings,
      steps: bg.steps,
      staples: [],
      noProtein: true,
    };
    for (const dish of expandBase(ck, meta, base)) {
      dish.id = `dish.${ck}.${slug(bg.stem)}_${slug(ck)}`;
      dish.display_name = bg.stem;
      writeDish(dish);
      count++;
    }
  }
}

/** Combinatorial expansion — proteins × methods × veg (subset cuisines to stay ~800 total) */
const COMBO_CUISINES = ['italian', 'mexican', 'southern', 'asian', 'comfort', 'bbq', 'cajun', 'mediterranean'];
const PROTEIN_CORE = [
  { name: 'Chicken breast', kw: 'chicken', staples: ['ingredient.chicken'] },
  { name: 'Ground beef', kw: 'beef', staples: ['ingredient.beef'] },
  { name: 'Pork chops', kw: 'pork', staples: ['ingredient.pork'] },
  { name: 'Shrimp', kw: 'shrimp', staples: ['ingredient.shrimp'] },
  { name: 'White fish', kw: 'fish', staples: ['ingredient.fish'] },
  { name: 'Tofu', kw: 'tofu', staples: ['ingredient.tofu'] },
  { name: 'Turkey breast', kw: 'turkey', staples: [] },
  { name: 'Sausage', kw: 'sausage', staples: [] },
];

const METHODS = [
  { label: 'Skillet', prep: 25, tags: ['weeknight', '30_minutes'], steps: ['Season protein.', 'Sear in hot skillet with aromatics.', 'Finish with sauce; serve.'] },
  { label: 'Grilled', prep: 30, tags: ['weeknight', 'crowd_favorite'], steps: ['Marinate protein 20 min.', 'Grill over medium-high heat.', 'Rest and slice.'] },
  { label: 'Baked', prep: 40, tags: ['easy_night'], steps: ['Arrange in baking dish.', 'Bake at 375°F until done.', 'Garnish and serve.'] },
  { label: 'Sheet Pan', prep: 35, tags: ['weeknight', 'one_pot'], steps: ['Arrange protein and vegetables on sheet pan.', 'Roast 25–30 min.', 'Serve directly from pan.'] },
];

const VEG_STARCH = [
  { veg: 'Broccoli', starch: 'Rice' },
  { veg: 'Bell peppers', starch: 'Potatoes' },
  { veg: 'Green beans', starch: 'Rice' },
  { veg: 'Zucchini', starch: 'Pasta' },
];

for (const cuisineKey of COMBO_CUISINES) {
  const meta = CUISINES[cuisineKey];
  if (!meta) continue;
  for (const protein of PROTEIN_CORE) {
    for (const method of METHODS) {
      for (const vs of VEG_STARCH) {
        const title = `${method.label} ${protein.kw.charAt(0).toUpperCase() + protein.kw.slice(1)} with ${vs.veg}`;
        const dish = {
          id: `dish.${cuisineKey}.${slug(method.label)}_${protein.kw}_${slug(vs.veg)}`,
          type: 'dish',
          display_name: title,
          description: `${meta.tags[0]} ${method.label.toLowerCase()} ${protein.kw} with ${vs.veg.toLowerCase()} and ${vs.starch.toLowerCase()}.`,
          attributes: {
            cuisine_id: meta.id,
            cuisine_tags: meta.tags,
            meal_types: ['dinner'],
            prep_time_minutes: method.prep,
            tags: method.tags,
            match_keywords: [title.toLowerCase(), `${protein.kw} ${vs.veg.toLowerCase()}`, `${method.label.toLowerCase()} ${protein.kw}`],
            ingredients: [
              ing(protein.name, 1, 'lb'),
              ing(vs.veg, 2, 'cups'),
              ing(vs.starch, 2, 'cups'),
              ing('Olive oil', 2, 'tbsp'),
              ing('Garlic', 2, 'cloves'),
            ],
            required_staples: protein.staples,
            steps: method.steps,
          },
          sources: ['generated'],
        };
        writeDish(dish);
        count++;
      }
    }
  }
}

/** Soup and salad library */
const SOUPS = ['Tomato Basil', 'Chicken Noodle', 'Vegetable', 'Lentil', 'Potato Leek', 'Beef Barley', 'Mushroom', 'Tortilla', 'Italian Wedding', 'Clam Chowder'];
const SALADS = ['Garden', 'Caesar', 'Cobb', 'Chef', 'Southwest', 'Asian Slaw', 'Caprese', 'Wedge', 'Spinach', 'Quinoa'];

const SOUP_CUISINES = ['comfort', 'southern', 'italian', 'mexican', 'asian', 'mediterranean'];
const SALAD_CUISINES = ['mediterranean', 'comfort', 'mexican', 'asian', 'italian'];

for (const cuisineKey of SOUP_CUISINES) {
  const meta = CUISINES[cuisineKey];
  if (!meta) continue;
  for (const soup of SOUPS) {
    for (const protein of [PROTEIN_CORE[0], PROTEIN_CORE[1], { name: '', kw: 'vegetable', staples: [] }]) {
      const title = protein.name ? `${soup} Soup with ${protein.kw}` : `${soup} Soup`;
      const dish = {
        id: `dish.${cuisineKey}.soup_${slug(soup)}_${protein.kw}`,
        type: 'dish',
        display_name: title,
        description: `${soup} soup — ${meta.tags[0]} style.`,
        attributes: {
          cuisine_id: meta.id,
          cuisine_tags: meta.tags,
          meal_types: ['lunch', 'dinner'],
          prep_time_minutes: 40,
          tags: ['leftovers_friendly', 'freezer_friendly'],
          match_keywords: [title.toLowerCase(), `${soup.toLowerCase()} soup`, soup.toLowerCase()],
          ingredients: protein.name
            ? [ing(protein.name, 1, 'lb'), ing('Broth', 6, 'cups'), ing('Onion', 1, 'each'), ing('Carrots', 2, 'each')]
            : [ing('Broth', 6, 'cups'), ing('Diced tomatoes', 1, 'can'), ing('Onion', 1, 'each'), ing('Garlic', 2, 'cloves')],
          required_staples: protein.staples,
          steps: ['Sauté aromatics.', 'Simmer with broth 30 min.', 'Adjust seasoning; serve.'],
        },
        sources: ['generated'],
      };
      writeDish(dish);
      count++;
    }
  }
}

for (const cuisineKey of SALAD_CUISINES) {
  const meta = CUISINES[cuisineKey];
  if (!meta) continue;
  for (const salad of SALADS) {
    const title = `${salad} Salad`;
    const dish = {
      id: `dish.${cuisineKey}.salad_${slug(salad)}`,
      type: 'dish',
      display_name: title,
      description: `${salad} salad with ${meta.tags[0]} flair.`,
      attributes: {
        cuisine_id: meta.id,
        cuisine_tags: meta.tags,
        meal_types: ['lunch', 'snack'],
        prep_time_minutes: 15,
        tags: ['30_minutes'],
        match_keywords: [title.toLowerCase(), salad.toLowerCase(), 'salad'],
        ingredients: [ing('Lettuce', 4, 'cups'), ing('Tomatoes', 2, 'each'), ing('Cucumber', 1, 'each'), ing('Olive oil', 2, 'tbsp'), ing('Vinegar', 1, 'tbsp')],
        required_staples: ['ingredient.olive_oil'],
        steps: ['Chop vegetables.', 'Toss with dressing.', 'Serve chilled.'],
      },
      sources: ['generated'],
    };
    writeDish(dish);
    count++;
  }
}

console.log(`Wrote ${count} dish nodes to ${OUT}`);
