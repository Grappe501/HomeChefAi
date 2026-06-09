/** Production marketing content — FAQ, trust, site config */

export const SITE_URL = import.meta.env?.VITE_SITE_URL || 'https://home-chef-ai.netlify.app';
export const SITE_NAME = 'SousChef';
export const SITE_TAGLINE = 'Your kitchen has a memory.';
export const SUPPORT_EMAIL = 'hello@homechef.ai';
export const LEGAL_ENTITY = 'HomeChef AI';

/** Single source of truth for marketing stats — update here only */
export const SITE_STATS = {
  knowledgeNodes: '270+',
  platformLayers: '5',
  liveFunctions: '20',
  visionTopics: '8',
  deepDives: '14+',
  techniques: '15+',
} as const;

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
      'SousChef is a Household Food Operating System — not a recipe app. It tracks your pantry, learns your cooking patterns, plans meals from what you actually have, and builds a kitchen memory that compounds over time.',
  },
  {
    id: 'ai-credits',
    question: 'What happens when AI credits run out?',
    answer:
      'Your pantry, inventory, Brain insights, and deterministic features keep working. AI-heavy actions like meal plan generation pause until credits refresh — you are never locked out of your kitchen data. See our AI Usage Policy for credit costs.',
  },
  {
    id: 'privacy',
    question: 'Do you sell my food or shopping data?',
    answer:
      'No. SousChef learns your kitchen to serve you, not to sell you. We do not sell household food data, shopping habits, or family traditions. See our Privacy Policy for full detail.',
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
      'Clara is your Sous Chef — the intelligence layer that reads your pantry, explains why a meal fits, coaches techniques, and remembers what your household keeps or replaces. Basic pantry Q&A uses zero credits.',
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
    quote: 'Finally something that knows what is actually in my fridge before suggesting dinner.',
    name: 'Early beta household',
    context: 'Austin, TX · family of 4',
  },
  {
    quote: 'The Why this? panel stopped the guesswork — I can see pantry facts, not vibes.',
    name: 'Beta tester',
    context: 'Home cook · meal planner',
  },
  {
    quote: 'Receipt scan → pantry → plan is the first loop that stuck for us.',
    name: 'Founding kitchen',
    context: 'Couple · weeknight cooks',
  },
];

export const TRUST_PILLARS = [
  { label: 'Pantry always works', detail: 'Even at zero AI credits' },
  { label: 'Deterministic Brain', detail: 'Free insights — no black box' },
  { label: 'Evidence-based AI', detail: 'Why this? cites real data' },
  { label: 'Your data stays yours', detail: 'No selling food habits' },
];
