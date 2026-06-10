/**
 * Dish Corpus v4 — combinatorial depth + signature style variants (~2× cardinality → 500k+)
 * Run: npm run knowledge:dishes
 */

import { writeFileSync, mkdirSync, existsSync, rmSync } from 'fs';
import { join, resolve } from 'path';
import { CUISINES } from './cuisines.mjs';
import {
  COURSES,
  COURSE_MEAL_TYPES,
  OCCASIONS,
  OCCASION_TAGS,
  PROTEINS,
  MAIN_METHODS,
  APPETIZERS,
  SOUPS,
  SALADS,
  SIDES,
  DESSERTS,
  BREADS,
  BREAKFASTS,
  SNACKS,
  BEVERAGES,
  VEG_OPTIONS,
  SAUCES,
  APPETIZER_TECHNIQUES,
  SOUP_TECHNIQUES,
  SALAD_TECHNIQUES,
  SIDE_TECHNIQUES,
  DESSERT_TECHNIQUES,
  BREAD_TECHNIQUES,
  BREAKFAST_TECHNIQUES,
  SNACK_TECHNIQUES,
  BEVERAGE_TECHNIQUES,
} from './course-templates.mjs';

const ROOT = process.env.KNOWLEDGE_ROOT
  ? resolve(process.env.KNOWLEDGE_ROOT)
  : resolve('data/ai');

const CORPUS_DIR = join(ROOT, 'dishes', 'corpus');
const CUISINE_DIR = join(ROOT, 'cuisines');
const LEGACY_DIR = join(ROOT, 'dishes');

const STAPLE_MAP = {
  onion: 'ingredient.onion',
  garlic: 'ingredient.garlic',
  rice: 'ingredient.rice.white',
  potato: 'ingredient.potato',
  flour: 'ingredient.flour.all_purpose',
  sugar: 'ingredient.sugar',
  butter: 'ingredient.butter',
  egg: 'ingredient.eggs',
  cheese: 'ingredient.cheese',
  milk: 'ingredient.milk',
  tomato: 'ingredient.tomato',
  beans: 'ingredient.beans.black',
  chicken: 'ingredient.chicken.breast',
  beef: 'ingredient.ground_beef',
};

function slug(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 80);
}

function ing(name, quantity, unit, knowledge_id) {
  const row = { name, quantity, unit };
  if (knowledge_id) row.knowledge_id = knowledge_id;
  return row;
}

function baseIngredients(cuisine, course) {
  const items = [
    ing('Onion', 1, 'each', STAPLE_MAP.onion),
    ing('Garlic', 2, 'cloves', STAPLE_MAP.garlic),
    ing(cuisine.fat.split(' ')[0] === 'olive' ? 'Olive oil' : 'Oil', 2, 'tbsp'),
  ];
  if (course === 'main' || course === 'side') {
    items.push(
      ing(cuisine.starch.split(' ')[0] === 'rice' ? 'Rice' : 'Potatoes', 2, 'cups', cuisine.starch.includes('rice') ? STAPLE_MAP.rice : STAPLE_MAP.potato),
    );
  }
  items.push(ing('Salt', 1, 'tsp'), ing('Black pepper', 0.5, 'tsp'));
  return items;
}

function courseExtraIngredients(course) {
  switch (course) {
    case 'dessert':
      return [
        ing('Sugar', 1, 'cup', STAPLE_MAP.sugar),
        ing('Flour', 1.5, 'cups', STAPLE_MAP.flour),
        ing('Butter', 0.5, 'cup', STAPLE_MAP.butter),
        ing('Eggs', 2, 'each', STAPLE_MAP.egg),
      ];
    case 'bread':
      return [
        ing('Flour', 3, 'cups', STAPLE_MAP.flour),
        ing('Yeast', 1, 'packet'),
        ing('Butter', 2, 'tbsp', STAPLE_MAP.butter),
      ];
    case 'breakfast':
      return [ing('Eggs', 3, 'each', STAPLE_MAP.egg), ing('Butter', 1, 'tbsp', STAPLE_MAP.butter)];
    case 'appetizer':
      return [ing('Cheese', 4, 'oz', STAPLE_MAP.cheese)];
    case 'soup':
      return [ing('Broth', 4, 'cups'), ing('Vegetables', 2, 'cups')];
    case 'salad':
      return [ing('Greens', 4, 'cups'), ing('Dressing', 0.25, 'cup')];
    case 'beverage':
      return [
        ing('Water', 4, 'cups'),
        ing('Sugar', 0.25, 'cup', STAPLE_MAP.sugar),
        ing('Lemon', 1, 'each'),
      ];
    case 'snack':
      return [ing('Crackers', 1, 'box'), ing('Cheese', 2, 'oz', STAPLE_MAP.cheese)];
    default:
      return [];
  }
}

function stepsFor(course, title, cuisine) {
  const c = cuisine.label;
  switch (course) {
    case 'appetizer':
      return [`Prep ${title} components with ${cuisine.spice}.`, `Cook or assemble using the ${c} approach until golden.`, 'Serve warm or chilled for guests.'];
    case 'soup':
      return ['Sauté aromatics in a heavy pot.', `Simmer broth with ${cuisine.spice} 25–40 min.`, 'Adjust seasoning; serve hot.'];
    case 'salad':
      return ['Prep vegetables and greens.', `Whisk ${cuisine.fat} dressing with ${cuisine.spice}.`, 'Toss and serve immediately.'];
    case 'main':
      return [`Season protein with ${cuisine.spice}.`, `Cook using the ${c} technique until done.`, `Serve over ${cuisine.starch} with pan sauce.`];
    case 'side':
      return [`Prep side ingredients.`, `Cook with ${cuisine.spice} until tender.`, 'Finish with butter or oil; serve hot.'];
    case 'dessert':
      return ['Prep batter or base.', 'Bake or chill according to recipe.', 'Rest and serve with garnish.'];
    case 'bread':
      return ['Mix dough or batter.', 'Proof or rest as needed.', 'Bake until golden; serve warm.'];
    case 'breakfast':
      return ['Prep morning ingredients.', 'Cook on stovetop or griddle.', 'Serve immediately while hot.'];
    case 'snack':
      return ['Assemble snack components.', 'Serve fresh or lightly warm.'];
    case 'beverage':
      return ['Combine ingredients.', 'Chill or warm as desired.', 'Serve over ice or in mugs.'];
    default:
      return [`Prepare ${title}.`, 'Cook until done.', 'Serve.'];
  }
}

function pickOccasions(course, tags) {
  const pool = [...OCCASIONS];
  const picked = new Set();
  if (tags.includes('weeknight')) picked.add('weeknight');
  if (tags.includes('dinner_party') || tags.includes('crowd_favorite')) picked.add('dinner_party');
  if (tags.includes('holiday')) picked.add('holiday');
  if (tags.includes('game_day')) picked.add('game_day');
  if (course === 'dessert') { picked.add('birthday'); picked.add('holiday'); }
  if (course === 'breakfast') picked.add('brunch');
  if (course === 'appetizer') { picked.add('dinner_party'); picked.add('potluck'); }
  if (course === 'main' && tags.includes('grill')) picked.add('cookout');
  while (picked.size < 3 && pool.length) {
    const o = pool[Math.floor(Math.random() * pool.length)];
    picked.add(o);
  }
  return [...picked].slice(0, 4);
}

function buildDish(cuisine, course, title, extra = {}) {
  const id = `dish.${cuisine.key}.${slug(title)}`;
  const tags = [...new Set([...(extra.tags ?? []), ...(extra.occasion ? OCCASION_TAGS[extra.occasion] ?? [] : [])])];
  const occasions = pickOccasions(course, tags);
  const ingredients = extra.ingredients ?? baseIngredients(cuisine, course);

  return {
    id,
    type: 'dish',
    display_name: title,
    description: `${title} — ${cuisine.label} ${course}${extra.occasion ? ` for ${extra.occasion.replace(/_/g, ' ')}` : ''}.`,
    attributes: {
      cuisine_id: cuisine.id,
      cuisine_tags: [cuisine.key, cuisine.region],
      course,
      meal_types: COURSE_MEAL_TYPES[course] ?? ['dinner'],
      occasions,
      prep_time_minutes: extra.prep ?? 30,
      tags,
      match_keywords: [
        title.toLowerCase(),
        `${cuisine.label.toLowerCase()} ${course}`,
        `${cuisine.key} ${slug(title).replace(/_/g, ' ')}`,
        ...(extra.keywords ?? []),
      ],
      ingredients,
      required_staples: extra.staples ?? [],
      steps: extra.steps ?? stepsFor(course, title, cuisine),
    },
    sources: ['corpus_v4'],
  };
}

function generateMains(cuisine) {
  const dishes = [];
  const used = new Set();

  for (const method of MAIN_METHODS) {
    if (method.vegOnly && cuisine.key === 'bbq') continue;
    const proteins = method.vegOnly
      ? PROTEINS.filter((p) => p.vegOnly)
      : PROTEINS.filter((p) => !p.vegOnly || p.key === 'vegetable');

    for (const protein of proteins) {
      if (method.vegOnly && !protein.vegOnly) continue;
      if (!method.vegOnly && protein.vegOnly && protein.key !== 'vegetable') continue;

      const veg = VEG_OPTIONS[dishes.length % VEG_OPTIONS.length];
      const sauce = SAUCES[dishes.length % SAUCES.length];
      const title = protein.vegOnly
        ? `${method.stem} ${veg} (${cuisine.label})`
        : `${method.stem} ${protein.key.charAt(0).toUpperCase() + protein.key.slice(1)} with ${veg}`;

      const key = title.toLowerCase();
      if (used.has(key)) continue;
      used.add(key);

      const ingredients = baseIngredients(cuisine, 'main');
      if (protein.name) ingredients.unshift(ing(protein.name, protein.qty, protein.unit, protein.staples?.[0]));
      ingredients.push(ing(veg, 2, 'cups'), ing(sauce.split(' ')[0], 1, 'cup'));

      dishes.push(buildDish(cuisine, 'main', title, {
        prep: method.prep,
        tags: method.tags,
        ingredients,
        staples: protein.staples ?? [],
        keywords: [protein.key, method.stem.toLowerCase(), veg.toLowerCase()],
      }));
    }
  }
  return dishes;
}

/** Cross-product base stems × techniques — same depth model as generateMains */
function generateCourseCombo(cuisine, course, bases, techniques, defaultTags = []) {
  const dishes = [];
  const used = new Set();

  for (let bi = 0; bi < bases.length; bi++) {
    for (let ti = 0; ti < techniques.length; ti++) {
      const tech = techniques[ti];
      const base = bases[bi];
      const title = `${tech.stem} ${base} (${cuisine.label})`;
      const key = title.toLowerCase();
      if (used.has(key)) continue;
      used.add(key);

      const occasion = OCCASIONS[(bi + ti) % OCCASIONS.length];
      const ingredients = [...baseIngredients(cuisine, course), ...courseExtraIngredients(course)];
      if (course === 'beverage') {
        ingredients.length = 0;
        ingredients.push(...courseExtraIngredients('beverage'));
      }

      dishes.push(buildDish(cuisine, course, title, {
        prep: tech.prep,
        tags: [...defaultTags, ...tech.tags],
        occasion,
        ingredients,
        staples: [STAPLE_MAP.onion, STAPLE_MAP.garlic].filter(Boolean),
        keywords: [base.toLowerCase(), tech.stem.toLowerCase(), course],
      }));
    }
  }
  return dishes;
}

function expandStyleVariants(dishes) {
  const expanded = [];
  for (const dish of dishes) {
    expanded.push(dish);
    expanded.push({
      ...dish,
      id: `${dish.id}.signature`,
      display_name: `${dish.display_name} Signature`,
      description: `${dish.description} Signature house preparation.`,
      attributes: {
        ...dish.attributes,
        tags: [...new Set([...(dish.attributes.tags ?? []), 'signature', 'house_favorite'])],
        prep_time_minutes: Math.max(15, (dish.attributes.prep_time_minutes ?? 30) - 5),
        match_keywords: [
          ...(dish.attributes.match_keywords ?? []),
          'signature',
          `${dish.display_name.toLowerCase()} signature`,
        ],
      },
    });
  }
  return expanded;
}

function generateCuisineCorpus(cuisine) {
  const dishes = expandStyleVariants([
    ...generateMains(cuisine),
    ...generateCourseCombo(cuisine, 'appetizer', APPETIZERS, APPETIZER_TECHNIQUES, ['dinner_party']),
    ...generateCourseCombo(cuisine, 'soup', SOUPS, SOUP_TECHNIQUES, ['leftovers_friendly']),
    ...generateCourseCombo(cuisine, 'salad', SALADS, SALAD_TECHNIQUES, ['30_minutes']),
    ...generateCourseCombo(cuisine, 'side', SIDES, SIDE_TECHNIQUES, ['easy_night']),
    ...generateCourseCombo(cuisine, 'dessert', DESSERTS, DESSERT_TECHNIQUES, ['crowd_favorite']),
    ...generateCourseCombo(cuisine, 'bread', BREADS, BREAD_TECHNIQUES, ['crowd_favorite']),
    ...generateCourseCombo(cuisine, 'breakfast', BREAKFASTS, BREAKFAST_TECHNIQUES, ['30_minutes']),
    ...generateCourseCombo(cuisine, 'snack', SNACKS, SNACK_TECHNIQUES, ['easy_night']),
    ...generateCourseCombo(cuisine, 'beverage', BEVERAGES, BEVERAGE_TECHNIQUES, ['easy_night']),
  ]);

  const seen = new Set();
  return dishes.filter((d) => {
    if (seen.has(d.id)) return false;
    seen.add(d.id);
    return true;
  });
}

function writeCuisineNode(cuisine) {
  if (!existsSync(CUISINE_DIR)) mkdirSync(CUISINE_DIR, { recursive: true });
  const path = join(CUISINE_DIR, `${cuisine.key}.json`);
  const node = {
    id: cuisine.id,
    type: 'cuisine',
    display_name: cuisine.label,
    description: `${cuisine.label} home cooking — full course library with mains, appetizers, desserts, and more.`,
    attributes: {
      cuisine_tags: [cuisine.key, cuisine.region],
      region: cuisine.region,
      signature_spice: cuisine.spice,
      signature_starch: cuisine.starch,
    },
    sources: ['corpus_v4'],
  };
  writeFileSync(path, JSON.stringify(node, null, 2) + '\n', 'utf8');
}

if (existsSync(LEGACY_DIR)) {
  for (const entry of ['italian', 'mexican', 'southern', 'cajun', 'asian', 'bbq', 'comfort', 'mediterranean', 'indian', 'tex_mex']) {
    const d = join(LEGACY_DIR, entry);
    if (existsSync(d)) rmSync(d, { recursive: true, force: true });
  }
}

if (!existsSync(CORPUS_DIR)) mkdirSync(CORPUS_DIR, { recursive: true });

const manifest = {
  version: 4,
  generated_at: new Date().toISOString(),
  total: 0,
  by_cuisine: {},
  by_course: {},
};

let total = 0;

for (const cuisine of CUISINES) {
  writeCuisineNode(cuisine);
  const dishes = generateCuisineCorpus(cuisine);
  const outPath = join(CORPUS_DIR, `${cuisine.key}.json`);
  writeFileSync(outPath, JSON.stringify({ cuisine_id: cuisine.id, cuisine_key: cuisine.key, dishes }, null, 0) + '\n', 'utf8');
  manifest.by_cuisine[cuisine.key] = dishes.length;
  total += dishes.length;
  for (const d of dishes) {
    const course = d.attributes.course;
    manifest.by_course[course] = (manifest.by_course[course] ?? 0) + 1;
  }
  console.log(`  ${cuisine.label}: ${dishes.length} recipes`);
}

manifest.total = total;
writeFileSync(join(ROOT, 'dish-manifest.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf8');

console.log(`\nWrote ${total} recipes across ${CUISINES.length} cuisines → ${CORPUS_DIR}`);
console.log('By course:', manifest.by_course);
