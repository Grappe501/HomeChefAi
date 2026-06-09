/** Production marketing content — FAQ, trust, site config · v5.1 */

export const SITE_URL = import.meta.env?.VITE_SITE_URL || 'https://home-chef-ai.netlify.app';
export const SITE_NAME = 'SousChef';
export const SITE_TAGLINE = 'Your kitchen has a memory.';
export const SITE_VERSION = '5.1';
export const LEGAL_VERSION = '2.5';
export const SUPPORT_EMAIL = 'hello@homechef.ai';
export const LEGAL_ENTITY = 'HomeChef AI';

/** Single source of truth for marketing stats — update here only */
export const SITE_STATS = {
  recipeCount: '280,000+',
  cuisines: '48',
  knowledgeNodes: '400+',
  platformLayers: '5',
  liveFunctions: '22',
  visionTopics: '8',
  deepDives: '150+',
  techniques: '45+',
  flavorProfiles: '18',
  foodSources: '21',
  claraTools: '9',
  brainVersion: '5.1',
} as const;

export const BRAIN_PILLARS = [
  {
    id: 'recipe-library',
    title: '280,000+ Recipe Library',
    summary: '48 cuisines · 10 course types — combinatorial corpus matched to your pantry at zero credits.',
  },
  {
    id: 'tool-router',
    title: 'Clara Tool Router',
    summary: 'Agent Suite v6 — nine selective tools before GPT: pantry, dishes, knowledge, skills, sourcing, ledger, brain.',
  },
  {
    id: 'training-kitchen',
    title: 'Training Kitchen',
    summary: '45+ techniques, 18 taste profiles, 48 cultural cuisines, grocery & farmers market sourcing — Clara teaches in context.',
  },
  {
    id: 'ai-impact',
    title: 'AI Impact Suite',
    summary: 'Unified household intelligence — memories, ledger learning, and patterns feed every planner and Clara call.',
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
      'SousChef is a Household Food Operating System — not a recipe app. It tracks your pantry, learns your cooking patterns, plans multi-course meals from what you actually have, and builds a kitchen memory that compounds over time. Brain 5.1 adds a 280,000+ recipe library, Training Kitchen education, AI Impact Suite, and nine-tool Clara routing.',
  },
  {
    id: 'brain-5',
    question: 'What is Brain 5.1?',
    answer:
      'Brain 5.1 connects everything: a 280,000+ structured recipe library across 48 cuisines; Training Kitchen (techniques, taste profiles, cultural cuisine, local & chain food sourcing); Clara\'s Agent Suite v6 tool router; AI Impact Suite that injects household learning into meal plans; proactive cards with inline recipe directions; multi-course meal planning; and graph-first cook log at zero credits.',
  },
  {
    id: 'recipes',
    question: 'How big is the recipe library?',
    answer:
      'Over 280,000 structured recipes across 48 world cuisines and 10 course types — mains, appetizers, soups, salads, sides, desserts, breads, breakfast, snacks, and beverages. Recipe Ideas at /recipes filters by course and matches to your pantry. Browsing matched recipes uses zero AI credits.',
  },
  {
    id: 'training-kitchen',
    question: 'What is the Training Kitchen?',
    answer:
      'Training Kitchen is our culinary education layer: 45+ cooking techniques with micro-lessons and steps, 18 taste profiles that teach salt/acid/fat/heat balance, 48 cultural cuisine nodes, 21 food source nodes (Walmart, Kroger, Whole Foods, farmers markets, CSAs, butchers, and more), and 150+ Kitchen Academy deep dives with six structured learning paths. Skill coaching and Academy browse use zero credits.',
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
      'Clara is your Sous Chef — Brain 5.1 routes every message through nine deterministic tools first (pantry, dish library, knowledge lookup, skill coach, local sourcing, ledger, brain memories, substitutions, directions, proactive signals), then synthesizes expert advisors when the question is complex. Recipe lookups, Academy browse, and basic pantry Q&A use zero credits.',
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
    quote: 'Two hundred eighty thousand recipes sounds impossible — until Recipe Ideas matched six appetizers to what I already had.',
    name: 'Early beta household',
    context: 'Austin, TX · family of 4',
  },
  {
    quote: 'Kitchen Academy finally explained why my braises tasted flat — acid at the finish, not more salt.',
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
  { label: '280k+ recipes', detail: '48 cuisines · 10 courses' },
  { label: 'Training Kitchen', detail: '45 techniques · 18 taste profiles' },
  { label: 'Tools before GPT', detail: '9 Clara tools · graph-first' },
  { label: 'Your data stays yours', detail: 'No selling food habits' },
];
