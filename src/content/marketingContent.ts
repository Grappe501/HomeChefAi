/** Production marketing content — FAQ, trust, site config */

export const SITE_URL = import.meta.env?.VITE_SITE_URL || 'https://home-chef-ai.netlify.app';
export const SITE_NAME = 'SousChef';
export const SITE_TAGLINE = 'Your kitchen has a memory.';
export const SUPPORT_EMAIL = 'hello@homechef.ai';

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
      'Your pantry, inventory, brain insights, and deterministic features keep working. AI-heavy actions like meal plan generation pause until credits refresh — you are never locked out of your kitchen data.',
  },
  {
    id: 'privacy',
    question: 'Do you sell my food or shopping data?',
    answer:
      'No. SousChef learns your kitchen to serve you, not to sell you. We do not sell household food data, shopping habits, or family traditions. See our privacy policy for full detail.',
  },
  {
    id: 'household',
    question: 'Can my whole family share one kitchen?',
    answer:
      'Yes — Family tier supports household members, shared pantry context, and Cook Together sessions. Free and Plus work for solo kitchens today.',
  },
  {
    id: 'beta',
    question: 'Why is billing listed as beta?',
    answer:
      'Core product is live and free during beta. Stripe billing for Plus and Family activates at launch — full access now so you can prove the loop before paying.',
  },
  {
    id: 'clara',
    question: 'Who is Clara?',
    answer:
      'Clara is your Sous Chef — the intelligence layer that reads your pantry, explains why a meal fits, coaches techniques, and remembers what your household keeps or replaces.',
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
  { label: 'Evidence-based AI', detail: 'Why this? cites real data' },
  { label: 'Your data stays yours', detail: 'No selling food habits' },
  { label: '258+ knowledge nodes', detail: 'Culinary graph, not guesses' },
];
