#!/usr/bin/env node
/**
 * Training Kitchen generator — techniques, flavor profiles, culture, food sources, deep academy.
 * Run: npm run knowledge:training
 */

import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { TRAINING_TECHNIQUES } from './training-kitchen/techniques.mjs';
import { TRAINING_FLAVORS } from './training-kitchen/flavors.mjs';
import { GROCERY_CHAINS, LOCAL_FOOD_SOURCES } from './training-kitchen/food-sources.mjs';
import { ACADEMY_PATHS } from './training-kitchen/academy-paths.mjs';
import { ACADEMY_FEATURED_TRACKS } from './training-kitchen/academy-tracks.mjs';
import { CUISINES } from './dish-corpus/cuisines.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const AI = join(ROOT, 'data', 'ai');

function recipeCorpusLabel() {
  try {
    const manifest = JSON.parse(readFileSync(join(AI, 'dish-manifest.json'), 'utf8'));
    const total = Number(manifest.total ?? 0);
    if (total >= 1000) return `${Math.floor(total / 1000)}K+`;
    return `${total}+`;
  } catch {
    return '500K+';
  }
}

function ensureDir(p) {
  if (!existsSync(p)) mkdirSync(p, { recursive: true });
}

function writeJson(path, obj) {
  ensureDir(dirname(path));
  writeFileSync(path, JSON.stringify(obj, null, 2) + '\n', 'utf8');
}

const REGION_WISDOM = {
  europe: {
    philosophy: 'Technique-driven cooking — fond, butter, wine reductions, and respect for seasonal produce.',
    depth: 'Build depth with fond from searing, reduce wine and stock, finish with cold butter for shine.',
    staples_tip: 'Keep mirepoix components, good butter, and wine vinegar on hand.',
  },
  mediterranean: {
    philosophy: 'Olive oil, acid, and herbs carry the plate — meat is often a flavoring, not the bulk.',
    depth: 'Layer olive oil, garlic, lemon, and herbs; char vegetables for smoke without heaviness.',
    staples_tip: 'Quality olive oil, lemons, olives, and dried oregano transform simple ingredients.',
  },
  middle_east: {
    philosophy: 'Shared plates, warm spices, and balance of grain, legume, and herb.',
    depth: 'Toast spices, use yogurt and tahini for richness, finish with fresh herb and pomegranate acid.',
    staples_tip: 'Sumac, zaatar, bulgur, chickpeas, and flatbread are pantry anchors.',
  },
  africa: {
    philosophy: 'Bold spice blends, slow stews, and starch scoops — communal eating is central.',
    depth: 'Bloom berbere or ras el hanout in oil; long simmer with legumes; acid from lime or tamarind at finish.',
    staples_tip: 'Spice blends, palm or peanut oil, and injera or rice as base.',
  },
  latin: {
    philosophy: 'Fresh lime, chili heat, and masa or rice — brightness against rich proteins.',
    depth: 'Char chilies and tomatoes, bloom cumin in fat, finish with cilantro and lime never cooked long.',
    staples_tip: 'Dried chilies, cumin, corn products, and fresh lime are non-negotiable.',
  },
  american: {
    philosophy: 'Regional pride — smoke, cast iron, and generous portions with table-side adjustment.',
    depth: 'Smoke and spice rubs, fond from cast iron, vinegar or hot sauce at the table for balance.',
    staples_tip: 'Cast iron, BBQ sauce, chili powder, and good black pepper.',
  },
  asia: {
    philosophy: 'Balance of sweet, sour, salty, spicy, and umami in every bite.',
    depth: 'High heat for wok hei, fish sauce or soy for umami, fresh herbs at the very end.',
    staples_tip: 'Soy, ginger, garlic, rice, and a hot wok or large skillet.',
  },
  pacific: {
    philosophy: 'Tropical acid, coconut, and fusion of island and Asian influences.',
    depth: 'Pineapple and lime acid, coconut milk richness, grill for smoke.',
    staples_tip: 'Coconut milk, rice, macadamia, and fresh tropical fruit.',
  },
  global: {
    philosophy: 'Plant-forward cooking with global spice access — technique over tradition lock-in.',
    depth: 'Roast vegetables deeply, use nutritional yeast and miso for umami, acid and crunch for finish.',
    staples_tip: 'Legumes, grains, olive oil, and bold spice rack.',
  },
};

function cultureNode(cuisine) {
  const wisdom = REGION_WISDOM[cuisine.region] ?? REGION_WISDOM.global;
  return {
    id: `culture.${cuisine.key}`,
    type: 'culture',
    display_name: `${cuisine.label} Culinary Culture`,
    description: `${cuisine.label} cooking centers on ${cuisine.spice}, ${cuisine.starch}, and ${cuisine.fat}. ${wisdom.philosophy}`,
    attributes: {
      cuisine_id: cuisine.id,
      cuisine_key: cuisine.key,
      region: cuisine.region,
      signature_spice: cuisine.spice,
      signature_starch: cuisine.starch,
      signature_fat: cuisine.fat,
      micro_lesson: wisdom.depth,
      shopping_tip: wisdom.staples_tip,
      flavor_building: [
        `Start with ${cuisine.fat} as your cooking medium.`,
        `Season with ${cuisine.spice} — toast or bloom in fat when using ground spices.`,
        `Build the plate around ${cuisine.starch} as the anchor.`,
      ],
      cultural_notes: [
        `Respect ${cuisine.label} food as living tradition — learn context, not just copycat recipes.`,
        `Ask Clara for dish matches from our ${recipeCorpusLabel()} recipe corpus filtered to this cuisine.`,
      ],
      cuisine_tags: [cuisine.key, cuisine.region],
    },
    sources: ['training-kitchen'],
  };
}

function cultureDeep(cuisine) {
  const wisdom = REGION_WISDOM[cuisine.region] ?? REGION_WISDOM.global;
  return {
    id: `culture.${cuisine.key}`,
    kind: 'culture',
    title: `${cuisine.label} Culinary Culture`,
    knowledge_id: `culture.${cuisine.key}`,
    match_keywords: [cuisine.key, cuisine.label.toLowerCase(), cuisine.region],
    summary: `${cuisine.label}: ${cuisine.spice}, ${cuisine.starch}, ${cuisine.fat}.`,
    origins: `${cuisine.label} cuisine reflects ${cuisine.region.replace(/_/g, ' ')} geography, trade routes, and home cooking traditions passed through generations.`,
    history: wisdom.philosophy,
    teaching: [
      wisdom.depth,
      wisdom.staples_tip,
      ...[`Signature pairing: ${cuisine.spice} + ${cuisine.starch} + ${cuisine.fat}.`],
    ],
    related_ids: [cuisine.id],
  };
}

function techniqueNode(t) {
  return {
    id: `technique.${t.id}`,
    type: 'technique',
    display_name: t.name,
    description: t.lesson,
    attributes: {
      micro_lesson: t.lesson,
      steps: t.steps ?? [],
      difficulty: t.difficulty,
      category: t.category,
      cuisine_tags: t.tags ?? [],
      flavor_links: t.flavor ?? [],
    },
    sources: ['training-kitchen'],
  };
}

function techniqueDeep(t) {
  return {
    id: `technique.${t.id}`,
    kind: 'technique',
    title: t.name,
    knowledge_id: `technique.${t.id}`,
    match_keywords: [t.id.replace(/_/g, ' '), t.name.toLowerCase()],
    summary: t.lesson,
    origins: `${t.name} is a core ${t.category ?? 'cooking'} technique used across ${(t.tags ?? ['global']).join(', ')} cooking.`,
    history: `Home cooks and professionals rely on ${t.name.toLowerCase()} for consistent results — practice builds muscle memory and timing.`,
    teaching: t.steps ?? [t.lesson],
    related_ids: (t.flavor ?? []).slice(0, 3),
  };
}

function flavorNode(f) {
  return {
    id: `flavor_profile.${f.id}`,
    type: 'flavor_profile',
    display_name: f.name,
    description: f.lesson,
    attributes: {
      micro_lesson: f.lesson,
      flavor_pillars: f.pillars,
      build_depth: f.build,
      balance_tip: f.balance,
      cuisine_tags: f.tags ?? [],
    },
    sources: ['training-kitchen'],
  };
}

function flavorDeep(f) {
  return {
    id: `flavor_profile.${f.id}`,
    kind: 'flavor_profile',
    title: f.name,
    knowledge_id: `flavor_profile.${f.id}`,
    match_keywords: [f.id.replace(/_/g, ' '), f.name.toLowerCase(), ...(f.pillars ?? [])],
    summary: f.lesson,
    origins: `Taste profiles describe how we experience balance on the plate — ${f.name.toLowerCase()} is a pattern chefs recognize and home cooks can learn.`,
    history: `Flavor pillars: ${(f.pillars ?? []).join(', ')}. Building depth means layering these elements rather than one heavy note.`,
    teaching: [...(f.build ?? []), f.balance].filter(Boolean),
  };
}

function foodSourceNode(src) {
  return {
    id: `food_source.${src.id}`,
    type: 'food_source',
    display_name: src.name,
    description: src.tips?.[0] ?? src.shopping ?? '',
    attributes: {
      source_type: src.type,
      store_type: src.type,
      local_food_pref: src.pref ?? null,
      shopping_tips: src.tips ?? [],
      seasonal_notes: src.seasonal ?? src.shopping ?? '',
      cuisine_tags: src.tags ?? [],
      aisles: src.aisles ?? [],
    },
    sources: ['training-kitchen'],
  };
}

function foodSourceDeep(src) {
  return {
    id: `food_source.${src.id}`,
    kind: 'food_source',
    title: src.name,
    knowledge_id: `food_source.${src.id}`,
    match_keywords: [src.id.replace(/_/g, ' '), src.name.toLowerCase(), 'grocery', 'market', 'shop'],
    summary: (src.tips ?? [])[0] ?? src.shopping ?? '',
    origins: src.type === 'local'
      ? 'Local food sourcing connects cooks to seasonality, community, and often better flavor per dollar when buying peak produce.'
      : `${src.name} is a ${src.type} retailer — knowing layout and house brands saves time and money.`,
    history: src.seasonal ?? src.shopping ?? 'Use your profile preferred store so Clara can tailor shopping advice.',
    teaching: src.tips ?? [src.shopping].filter(Boolean),
  };
}

function pathDeep(path) {
  return {
    id: path.id,
    kind: 'path',
    title: path.title,
    summary: path.summary,
    origins: 'Kitchen Academy structured paths — learn techniques and concepts in intentional order.',
    history: path.summary,
    teaching: path.teaching,
    related_ids: path.steps,
  };
}

function trackDeep(track) {
  const related_ids = [];
  const teaching = [];
  const shows = new Set();

  for (const lv of track.levels ?? []) {
    for (const m of lv.modules ?? []) {
      related_ids.push(...(m.techniques ?? []), ...(m.flavors ?? []), ...(m.cultures ?? []));
      teaching.push(...(m.teaching ?? []));
      for (const ref of m.show_refs ?? []) shows.add(ref);
    }
  }

  const uniqueRelated = [...new Set(related_ids)];

  return {
    id: track.id,
    kind: 'path',
    title: track.title,
    summary: track.summary,
    knowledge_id: track.id,
    match_keywords: [
      track.id.replace(/\./g, ' '),
      track.title.toLowerCase(),
      track.track_type,
      ...(track.track_type === 'competition' ? ['game show', 'competition'] : ['career', 'ladder']),
    ],
    origins: 'Kitchen Academy featured tracks — structured career ladders and competition paths with leveled modules.',
    history: track.summary,
    teaching: teaching.slice(0, 12),
    related_ids: uniqueRelated.slice(0, 24),
    track_type: track.track_type,
    featured: track.featured,
    levels: track.levels,
    ...(shows.size ? { shows_referenced: [...shows] } : {}),
  };
}

function main() {
  const stats = { techniques: 0, flavors: 0, cultures: 0, food_sources: 0, deep: 0 };

  const techDir = join(AI, 'techniques');
  for (const t of TRAINING_TECHNIQUES) {
    writeJson(join(techDir, `${t.id}.json`), techniqueNode(t));
    writeJson(join(AI, 'deep', `technique.${t.id}.json`), techniqueDeep(t));
    stats.techniques++;
    stats.deep++;
  }

  const flavorDir = join(AI, 'flavor_profiles');
  for (const f of TRAINING_FLAVORS) {
    writeJson(join(flavorDir, `${f.id}.json`), flavorNode(f));
    writeJson(join(AI, 'deep', `flavor_profile.${f.id}.json`), flavorDeep(f));
    stats.flavors++;
    stats.deep++;
  }

  const cultureDir = join(AI, 'culture');
  for (const c of CUISINES) {
    writeJson(join(cultureDir, `${c.key}.json`), cultureNode(c));
    writeJson(join(AI, 'deep', `culture.${c.key}.json`), cultureDeep(c));
    stats.cultures++;
    stats.deep++;
  }

  const sourceDir = join(AI, 'food_sources');
  for (const src of [...GROCERY_CHAINS, ...LOCAL_FOOD_SOURCES]) {
    writeJson(join(sourceDir, `${src.id}.json`), foodSourceNode(src));
    writeJson(join(AI, 'deep', `food_source.${src.id}.json`), foodSourceDeep(src));
    stats.food_sources++;
    stats.deep++;
  }

  for (const p of ACADEMY_PATHS) {
    writeJson(join(AI, 'deep', `${p.id.replace(/\./g, '_')}.json`), pathDeep(p));
    stats.deep++;
  }

  for (const track of ACADEMY_FEATURED_TRACKS) {
    writeJson(join(AI, 'deep', `${track.id.replace(/\./g, '_')}.json`), trackDeep(track));
    stats.deep++;
  }

  console.log('Training Kitchen generated:');
  console.log(`  techniques:    ${stats.techniques}`);
  console.log(`  flavors:       ${stats.flavors}`);
  console.log(`  cultures:      ${stats.cultures}`);
  console.log(`  food_sources:  ${stats.food_sources}`);
  console.log(`  deep entries:  ${stats.deep} (includes paths)`);
}

main();
