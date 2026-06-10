/** Production marketing content — FAQ, trust, site config · v7.4 */
import { CORPUS_STATS } from './siteStats.generated.js';

export const SITE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SITE_URL) ||
  'https://home-chef-ai.netlify.app';
export const SITE_NAME = 'SousChef';
export const SITE_TAGLINE = 'Your kitchen has a memory.';
export const PRODUCT_VERSION = '7.4';
export const SITE_VERSION = '5.2';
export const LEGAL_VERSION = '2.7';
export const SUPPORT_EMAIL = 'hello@homechef.ai';
export const LEGAL_ENTITY = 'HomeChef AI';

/** Single source of truth for marketing stats — synced from dish-manifest at build */
export const SITE_STATS = {
  recipeCount: CORPUS_STATS.recipeCountFormatted,
  recipeCountCompact: CORPUS_STATS.recipeCountCompact,
  recipeCountExact: CORPUS_STATS.recipeCountExact,
  recipeTotal: CORPUS_STATS.recipeTotal,
  cuisines: String(CORPUS_STATS.cuisines),
  courses: String(CORPUS_STATS.courses),
  knowledgeNodes: '400+',
  platformLayers: '5',
  liveFunctions: '22',
  visionTopics: '8',
  deepDives: `${CORPUS_STATS.deepDives}+`,
  techniques: `${CORPUS_STATS.techniques}+`,
  flavorProfiles: String(CORPUS_STATS.flavorProfiles),
  foodSources: String(CORPUS_STATS.foodSources),
  claraTools: '9',
  academyPaths: '3',
  klePillars: '4',
  brainVersion: SITE_VERSION,
  agentSuite: 'v6 Phase 4',
  productVersion: PRODUCT_VERSION,
} as const;

export const KLE_PILLARS = [
  {
    id: 'taste',
    title: 'Taste & Preference',
    summary: 'Learns what your household loves — cuisines, spice tolerance, and repeat winners from cook logs and ratings.',
  },
  {
    id: 'rhythm',
    title: 'Behavior & Rhythm',
    summary: 'Detects when you cook, how long you have, and nudges meals that fit your real weeknight cadence.',
  },
  {
    id: 'skills',
    title: 'Skill Growth',
    summary: 'Tracks techniques you practice, comfort levels, and coaches the next skill to unlock in Kitchen Academy.',
  },
  {
    id: 'identity',
    title: 'Household Identity',
    summary: 'Unifies your food story — traditions, dietary lines, and who cooks what — into one kitchen brain.',
  },
] as const;

export const BRAIN_PILLARS = [
  {
    id: 'recipe-library',
    title: `${SITE_STATS.recipeCountCompact} Recipe Library`,
    summary: `${SITE_STATS.cuisines} cuisines · ${SITE_STATS.courses} course types — combinatorial corpus matched to your pantry at zero credits.`,
  },
  {
    id: 'kle-engine',
    title: 'Kitchen Learning Engine',
    summary: `SousChef v${PRODUCT_VERSION} — four live learners (taste, rhythm, skills, identity) that compound with every cook, receipt, and rating.`,
  },
  {
    id: 'tool-router',
    title: 'Clara Agent Suite v6',
    summary: 'Nine selective tools, BM25 + embedding shard search, streaming expert synthesis, and live tool progress — before GPT speaks.',
  },
  {
    id: 'training-kitchen',
    title: 'Kitchen Academy',
    summary: `${SITE_STATS.techniques} techniques, ${SITE_STATS.flavorProfiles} taste profiles, ${SITE_STATS.cuisines} cuisines, 3 featured pathways with pantry-matched practice.`,
  },
  {
    id: 'pantry-vision',
    title: 'Pantry Vision & Hosting',
    summary: 'Photo your fridge or shelf. Host dinner parties with menu, timeline, and shopping list.',
  },
] as const;

/** @deprecated use BRAIN_PILLARS */
export const BRAIN_4_PILLARS = BRAIN_PILLARS;

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export const MARKETING_FAQ: FaqItem[] = [
  {
    id: 'what-is',
    question: 'What is SousChef?',
    answer:
      `SousChef is a Household Food Operating System — not a recipe app. It tracks your pantry, learns your cooking patterns, plans multi-course meals from what you actually have, and builds a kitchen memory that compounds over time. v${PRODUCT_VERSION} adds the Kitchen Learning Engine (taste, rhythm, skills, identity), Agent Suite v6 Phase 4, Kitchen Academy featured pathways, and a ${SITE_STATS.recipeCount} recipe library.`,
  },
  {
    id: 'brain-5',
    question: `What is Brain ${SITE_VERSION}?`,
    answer:
      `Brain ${SITE_VERSION} connects everything: a ${SITE_STATS.recipeCount} structured recipe library across ${SITE_STATS.cuisines} cuisines; Kitchen Academy with three featured career paths; Agent Suite v6 Phase 4 — pre-built embedding shards, streaming expert synthesis, and agent telemetry; AI Impact Suite; proactive cards; multi-course meal planning; and graph-first cook log at zero credits.`,
  },
  {
    id: 'kle',
    question: 'What is the Kitchen Learning Engine?',
    answer:
      `KLE v${PRODUCT_VERSION} is four live learning pillars: Taste & Preference (what you love), Behavior & Rhythm (when and how you cook), Skill Growth (technique comfort and coaching), and Household Identity (traditions and dietary lines). Each pillar refreshes from cook logs, receipts, ratings, and Academy progress — so Clara and your dashboard get smarter without extra prompts.`,
  },
  {
    id: 'recipes',
    question: 'How big is the recipe library?',
    answer:
      `Over ${SITE_STATS.recipeCountExact} structured recipes (${SITE_STATS.recipeCount} marketed) across ${SITE_STATS.cuisines} world cuisines and ${SITE_STATS.courses} course types — mains, appetizers, soups, salads, sides, desserts, breads, breakfast, snacks, and beverages. Recipe Ideas at /recipes filters by course and matches to your pantry. Browsing matched recipes uses zero AI credits.`,
  },
  {
    id: 'training-kitchen',
    question: 'What is the Training Kitchen?',
    answer:
      `Training Kitchen is our culinary education layer: ${SITE_STATS.techniques} cooking techniques with micro-lessons and steps, ${SITE_STATS.flavorProfiles} taste profiles that teach salt/acid/fat/heat balance, ${SITE_STATS.cuisines} cultural cuisine nodes, ${SITE_STATS.foodSources} food source nodes (Walmart, Kroger, Whole Foods, farmers markets, CSAs, butchers, and more), and ${SITE_STATS.deepDives} Kitchen Academy deep dives — including three featured pathways (Amateur to Executive Chef, Master Baker, and Game Show Kitchen) with leveled modules and pantry-matched practice recipes. Skill coaching and Academy browse use zero credits.`,
  },
  {
    id: 'local-food',
    question: 'Does SousChef help with farmers markets and grocery shopping?',
    answer:
      'Yes. Set your preferred store and local food preferences in onboarding (farmers market, CSA, local butcher, seasonal produce, home garden). Clara pulls food-source knowledge into chat — aisle tips for chains, seasonal strategy for markets, and shopping advice tied to your profile at zero credits.',
  },
  {
    id: 'ai-credits',
    question: 'What happens when AI credits run out?',
    answer:
      'Your pantry, inventory, Brain insights, proactive predictions, recipe library matching, graph substitutions, Kitchen Academy browse, and deterministic skill coaching keep working. AI-heavy actions like meal plan generation pause until credits refresh — you are never locked out of your kitchen data. See our AI Usage Policy for credit costs.',
  },
  {
    id: 'privacy',
    question: 'Do you sell my food or shopping data?',
    answer:
      'No. SousChef learns your kitchen to serve you, not to sell you. We do not sell household food data, shopping habits, or family traditions. Pantry photos are processed for inventory extraction only. See our Privacy Policy for full detail.',
  },
  {
    id: 'pantry-photo',
    question: 'How does pantry photo scan work?',
    answer:
      'Take a photo of your fridge, shelf, or pantry. Vision AI identifies items; you review and confirm before adding. Items normalize to sensible kitchen units (jar, bag, lb — not "unit"). Each item links to our 400+ node knowledge graph when possible. Pantry photo scan costs 2 credits; receipt scan costs 1 credit.',
  },
  {
    id: 'household',
    question: 'Can my whole family share one kitchen?',
    answer:
      'Yes. Free supports up to 2 household members (join-only). Plus and Family support full Cook Together — shared pantry, Brain, and cook logs. Family tier includes priority AI responses.',
  },
  {
    id: 'nutrition',
    question: 'Are nutrition estimates medical advice?',
    answer:
      'No. Per-serving nutrition on meal cards is an approximate estimate from ingredient references — not medical, dietary, or food safety advice. Always verify allergens, portions, and expiration dates yourself.',
  },
  {
    id: 'data-export',
    question: 'Can I export or delete my data?',
    answer:
      'Yes. Access, export, and delete your kitchen data via Settings or by emailing hello@homechef.ai. Account deletion includes a 7-day grace period before permanent removal.',
  },
  {
    id: 'billing',
    question: 'When does paid billing start?',
    answer:
      'Core product is live and free during beta. Stripe billing for Plus ($9/mo) and Family ($18/mo) activates at launch — full access now so you can prove the loop before paying. No surprise AI overage charges.',
  },
  {
    id: 'clara',
    question: 'Who is Clara?',
    answer:
      `Clara is your Sous Chef — Brain ${SITE_VERSION} routes every message through nine deterministic tools first (pantry, dish library, knowledge lookup, skill coach, local sourcing, ledger, brain memories, substitutions, directions, proactive signals), then synthesizes expert advisors when the question is complex. Recipe lookups, Academy browse, and basic pantry Q&A use zero credits.`,
  },
  {
    id: 'multi-course',
    question: 'Can SousChef plan multi-course meals?',
    answer:
      'Yes. Dinner supports 1, 3, 4, or 5 courses; lunch supports 2 or 3 courses; breakfast is optional. Simple slot cards on the planner drill down to full course detail, Why this?, and shopping lists per slot.',
  },
  {
    id: 'site-search',
    question: 'How do I learn about features before signing up?',
    answer:
      'Press ⌘K (or Ctrl+K) on any marketing page to search the site or ask questions about SousChef. Kitchen Academy at /learn previews deep dives. For your personal pantry and meal plans, sign in to the app.',
  },
];

export interface Testimonial {
  quote: string;
  name: string;
  context: string;
}

export const TESTIMONIALS: Testimonial[] = [
  {
    quote: `${SITE_STATS.recipeCountCompact} recipes sounded like marketing — until Recipe Ideas matched six appetizers to what I already had.`,
    name: 'Early beta household',
    context: 'Austin, TX · family of 4',
  },
  {
    quote: 'The Skill Growth card finally explained why my braises tasted flat — acid at the finish, not more salt.',
    name: 'Beta tester',
    context: 'Growing home cook',
  },
  {
    quote: 'Clara knew I shop at H-E-B and flagged farmers market spinach in the same reply. That is actually useful.',
    name: 'Founding kitchen',
    context: 'Couple · buy local',
  },
];

export const TRUST_PILLARS = [
  { label: `${SITE_STATS.recipeCountCompact} recipes`, detail: `${SITE_STATS.cuisines} cuisines · ${SITE_STATS.courses} courses` },
  { label: 'Kitchen Learning Engine', detail: `Taste · rhythm · skills · identity` },
  { label: 'Training Kitchen', detail: `${SITE_STATS.techniques} techniques · ${SITE_STATS.flavorProfiles} taste profiles` },
  { label: 'Your data stays yours', detail: 'No selling food habits' },
];
