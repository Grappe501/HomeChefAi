/** Production marketing content — FAQ, trust, site config · v4 */

export const SITE_URL = import.meta.env?.VITE_SITE_URL || 'https://home-chef-ai.netlify.app';
export const SITE_NAME = 'SousChef';
export const SITE_TAGLINE = 'Your kitchen has a memory.';
export const SITE_VERSION = '4.0';
export const LEGAL_VERSION = '2.3';
export const SUPPORT_EMAIL = 'hello@homechef.ai';
export const LEGAL_ENTITY = 'HomeChef AI';

/** Single source of truth for marketing stats — update here only */
export const SITE_STATS = {
  knowledgeNodes: '270+',
  platformLayers: '5',
  liveFunctions: '22',
  visionTopics: '8',
  deepDives: '14+',
  techniques: '15+',
  brainVersion: '4.0',
} as const;

export const BRAIN_4_PILLARS = [
  {
    id: 'tool-router',
    title: 'Clara Tool Router',
    summary: 'Deterministic tools run before GPT — pantry lookup, substitutions, brain signals, ledger context.',
  },
  {
    id: 'proactive',
    title: 'Proactive Intelligence',
    summary: 'Expiring items, likely meals, and ledger feedback surface on Home and Brain — zero credits.',
  },
  {
    id: 'pantry-vision',
    title: 'Pantry Vision',
    summary: 'Photo your fridge or shelf — items link to the knowledge graph. 2 credits per scan.',
  },
  {
    id: 'hosting-studio',
    title: 'Hosting Studio',
    summary: 'Dinner party, game day, potluck, holiday — menu, timeline, and shopping list in one UI.',
  },
] as const;

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
      'SousChef is a Household Food Operating System — not a recipe app. It tracks your pantry, learns your cooking patterns, plans meals from what you actually have, and builds a kitchen memory that compounds over time. Brain 4.0 adds proactive intelligence and a tool-first Clara.',
  },
  {
    id: 'brain-4',
    question: 'What is Brain 4.0?',
    answer:
      'Brain 4.0 is the Clara Reasoning Loop: a tool router that runs graph lookups and brain signals before any GPT call, proactive cards that surface expiring food and likely meals, pantry photo scan, graph-first cook log inference, expert council synthesis for complex asks, and Hosting Studio for events.',
  },
  {
    id: 'ai-credits',
    question: 'What happens when AI credits run out?',
    answer:
      'Your pantry, inventory, Brain insights, proactive predictions, and deterministic substitutions keep working. AI-heavy actions like meal plan generation pause until credits refresh — you are never locked out of your kitchen data. See our AI Usage Policy for credit costs.',
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
      'Take a photo of your fridge, shelf, or pantry. Vision AI identifies items; you review and confirm before adding. Each item links to our knowledge graph when possible. Pantry photo scan costs 2 credits; receipt scan costs 1 credit.',
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
      'Clara is your Sous Chef — Brain 4.0 routes every message through deterministic tools first (pantry, substitutions, brain patterns, ledger), then synthesizes expert advisors when the question is complex. Basic pantry Q&A uses zero credits.',
  },
  {
    id: 'site-search',
    question: 'How do I learn about features before signing up?',
    answer:
      'Press ⌘K (or Ctrl+K) on any marketing page to search the site or ask questions about SousChef. For your personal pantry and meal plans, sign in to the app.',
  },
];

export interface Testimonial {
  quote: string;
  name: string;
  context: string;
}

export const TESTIMONIALS: Testimonial[] = [
  {
    quote: 'The proactive cards told me to use spinach before it wilted — I didn\'t even ask Clara yet.',
    name: 'Early beta household',
    context: 'Austin, TX · family of 4',
  },
  {
    quote: 'Pantry photo beat typing after a Costco run. Knowledge IDs on items feel like the app actually knows food.',
    name: 'Beta tester',
    context: 'Mobile-first cook',
  },
  {
    quote: 'Hosting Studio gave us a timeline for twelve guests. Finally not a recipe app pretending to be a sous chef.',
    name: 'Founding kitchen',
    context: 'Couple · entertain monthly',
  },
];

export const TRUST_PILLARS = [
  { label: 'Tools before GPT', detail: 'Graph-first Clara routing' },
  { label: 'Proactive at zero credits', detail: 'Brain predicts — no LLM' },
  { label: 'Evidence you can read', detail: 'Chips, ledger, Why this?' },
  { label: 'Your data stays yours', detail: 'No selling food habits' },
];
