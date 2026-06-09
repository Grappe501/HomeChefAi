import type { LucideIcon } from 'lucide-react';
import {
  Brain,
  ChefHat,
  Heart,
  ScanLine,
  Sparkles,
  Users,
  Wifi,
  BookOpen,
  Trophy,
  Utensils,
} from 'lucide-react';

export type FeatureStatus = 'live' | 'beta' | 'vision';

export interface SiteFeature {
  id: string;
  title: string;
  status: FeatureStatus;
  summary: string;
  details: string[];
  /** Historical context for marketing drill-down */
  history?: string;
  origins?: string;
  /** What Clara can teach about this capability */
  teachings?: string[];
  /** Deeper rabbit holes — sub-features or concepts */
  children?: SiteFeature[];
}

export interface PlatformLayer {
  id: string;
  level: string;
  title: string;
  tagline: string;
  icon: LucideIcon;
  status: FeatureStatus;
  intro: string;
  features: SiteFeature[];
  goDeeper?: { label: string; href: string }[];
}

export interface VisionTopic {
  id: string;
  title: string;
  tagline: string;
  icon: LucideIcon;
  audience: string;
  summary: string;
  sections: { heading: string; body?: string; bullets?: string[] }[];
  relatedExplore?: string;
}

export const STATUS_LABEL: Record<FeatureStatus, string> = {
  live: 'Live today',
  beta: 'Beta',
  vision: 'On the roadmap',
};

export const PLATFORM_LAYERS: PlatformLayer[] = [
  {
    id: 'inventory',
    level: '01',
    title: 'Inventory',
    tagline: 'Know what you have.',
    icon: ScanLine,
    status: 'live',
    intro:
      'The foundation of every smart kitchen — truth about what is in your pantry, fridge, and freezer. Every item can link to a 250+ node culinary knowledge graph.',
    features: [
      {
        id: 'receipt-scan',
        title: 'Receipt Scanning',
        status: 'live',
        summary: 'Snap a grocery receipt — OpenAI Vision parses line items into your pantry.',
        details: [
          'Automatic item name, quantity, and price extraction',
          'Verify before adding — you stay in control',
          'XP rewards for verified scans',
          'AI credits apply per fair-use policy',
        ],
      },
      {
        id: 'pantry-wizard',
        title: 'Pantry Wizard',
        status: 'live',
        summary: 'Tap-to-add categories when you don\'t have a receipt — human-sized units, not grams nobody uses.',
        details: [
          '82+ wizard items with sensible defaults',
          'Pantry, fridge, and freezer locations',
          'Knowledge-linked ingredient IDs on add',
          'Food taxonomy families: cheese, tomatoes, rice, chicken, and more',
        ],
      },
      {
        id: 'inventory-mgmt',
        title: 'Inventory Management',
        status: 'live',
        summary: 'Track quantities, locations, and expiration across your whole kitchen.',
        details: [
          'One-thumb +/- quantity controls',
          'Filter by location',
          'Expiration-aware sorting',
          'Cook log auto-subtracts what you used',
        ],
      },
      {
        id: 'knowledge-graph',
        title: 'Knowledge-Linked Items',
        status: 'live',
        summary: '258+ JSON nodes — ingredients, techniques, cuisines, substitutions, hosting, traditions.',
        details: [
          'Variant nodes (paprika.smoked, rice.white, chicken.breast)',
          'Substitution engine with dietary reasons',
          'Flavor pairings and cuisine staples',
          'Powers Clara\'s reasoning — not generic prompts',
        ],
        children: [
          {
            id: 'substitutions',
            title: 'Substitution Intelligence',
            status: 'live',
            summary: 'Vegan, gluten-free, dairy-free swaps from the graph — with notes on ratio and heat.',
            details: ['Reason-aware: missing, vegan, gluten-free', 'Pantry-first swap suggestions in meal Why panels'],
          },
        ],
      },
    ],
    goDeeper: [{ label: 'How the knowledge graph grows', href: '/vision/knowledge' }],
  },
  {
    id: 'memory',
    level: '02',
    title: 'Kitchen Memory',
    tagline: 'Your kitchen remembers.',
    icon: Brain,
    status: 'live',
    intro:
      'Brain 2.0 turns receipts, cook logs, and plan reviews into a Household Food Graph — patterns that compound every week you cook.',
    features: [
      {
        id: 'brain-insights',
        title: 'Brain Insights',
        status: 'live',
        summary: 'Deterministic memories with evidence — what you buy, cook, waste, and repeat.',
        details: [
          'Explainable insights with confidence scores',
          'Pattern detectors: waste, repeats, seasonal drift',
          'Kitchen identity and inferred cooking style',
          'Deterministic math — no LLM cost for core insights',
        ],
      },
      {
        id: 'decision-ledger',
        title: 'Decision Ledger',
        status: 'live',
        summary: 'Every Keep, Replace, and Why feeds learning — Clara remembers what you actually wanted.',
        details: [
          'Meal plan review syncs to ledger',
          'Reject history shapes next plans',
          'Evidence and expert IDs stored per decision',
          'Honest Why this? — never invents history you didn\'t create',
        ],
      },
      {
        id: 'household-graph',
        title: 'Household Food Graph',
        status: 'live',
        summary: 'Purchases → inventory → consumption → waste → preferences → traditions.',
        details: [
          'Household-scoped with Cook Together invites',
          'RLS isolation between households',
          'Switching cost rises every week you cook',
          'The moat is memory that compounds',
        ],
      },
      {
        id: 'brain-sync',
        title: 'Brain Sync',
        status: 'live',
        summary: 'Runs after cook logs, receipts, and key events — keeps insights fresh.',
        details: ['Manual sync from Brain page', 'Legacy and skill memories generated on sync'],
      },
    ],
    goDeeper: [{ label: 'Brain 1.0B conversational frame', href: '/vision/brain' }],
  },
  {
    id: 'intelligence',
    level: '03',
    title: 'Kitchen Intelligence',
    tagline: 'Cook with confidence.',
    icon: Sparkles,
    status: 'live',
    intro:
      'Not “here’s a recipe.” Three directions, grounded reasoning, and a Sous Chef that learns from your rejections.',
    features: [
      {
        id: 'meal-planner',
        title: 'AI Meal Planner',
        status: 'live',
        summary: '1–14 day plans from your inventory, coverage presets, and planning goals.',
        details: [
          'Dinners only, breakfast+lunch+dinner, or custom counts',
          'Cook N nights / easy nights for leftovers',
          'Kitchen Supply Plan grouped shopping list',
          'Coverage metrics and inventory utilization score',
        ],
      },
      {
        id: 'three-directions',
        title: 'Three-Direction Flow',
        status: 'live',
        summary: 'What can I make? → pick Cajun, Italian, or comfort — then build the plan.',
        details: [
          'Reasoning engine from pantry + profile',
          'Evidence from knowledge graph',
          'Expert registry orchestration',
        ],
      },
      {
        id: 'why-this',
        title: 'Why This?',
        status: 'live',
        summary: 'Per-meal intelligence — pantry facts, plan fit, substitutions, ingredient trivia.',
        origins: 'Meal explainers exist because recipe apps tell you what to cook, not why it fits your kitchen tonight.',
        history: 'SousChef v2 adds deep dives: dish origins, ingredient timelines, and teach-me moments — grounded in the knowledge graph, never invented household history.',
        teachings: [
          'Tap Why this? on any meal card for history and origins',
          'Teaching moments appear when we match ingredients to Kitchen Academy entries',
          'Ledger history only counts meals you explicitly kept or replaced',
        ],
        details: [
          'Only cites ledger history you actually created',
          'Ingredient trivia from knowledge graph',
          'Complexity, wine hints, hosting prep expandable',
        ],
      },
      {
        id: 'replace-meal',
        title: 'Replace Meal',
        status: 'live',
        summary: 'One tap regenerates a single slot — ledger learns the rejection.',
        details: ['Keeps rest of plan intact', 'Writes replace outcome to decision ledger'],
      },
      {
        id: 'clara',
        title: 'Clara Sous Chef',
        status: 'live',
        summary: 'Voice-friendly assistant with intent routing — meal plan, hosting, substitutions, directions.',
        details: [
          'Pantry-aware JSON responses',
          'Hosting intent → experience timeline sketch',
          'Ledger reject history in prompts',
          'Cook log ingredient confirmation flow',
        ],
      },
      {
        id: 'what-can-i-make',
        title: 'What Can I Make?',
        status: 'live',
        summary: 'Pantry-only suggestions — retention hook that always works, even when AI credits exhausted.',
        details: ['Free tier friendly', 'Directions or quick suggestion mode'],
      },
    ],
  },
  {
    id: 'growth',
    level: '04',
    title: 'Kitchen Growth',
    tagline: 'Get better every cook.',
    icon: ChefHat,
    status: 'live',
    intro:
      'Micro-lessons from your actual cook log — not generic YouTube. Clara coaches like a sous chef, not a quiz app.',
    features: [
      {
        id: 'micro-lessons',
        title: 'Technique Micro-Lessons',
        status: 'live',
        summary: '15+ techniques with embedded micro_lesson copy in the knowledge graph.',
        origins: 'Technique teaching in kitchens predates written recipes — apprentices watched, then did.',
        history: 'Escoffier codified French technique in the 1900s; home cooks learned from Joy of Cooking and TV. SousChef embeds micro-lessons in the graph so Clara can teach at the moment you need sear, roux, or braise.',
        teachings: [
          'Browse Kitchen Academy for full technique histories',
          'Cook Together coach surfaces the right tip mid-recipe',
          'Each technique links to substitutions and pairings in the graph',
        ],
        details: ['Sear, roux, braise, emulsion, and more', 'Surfaced during Cook Together coach'],
      },
      {
        id: 'cook-coach',
        title: 'Cook Together Coach',
        status: 'live',
        summary: 'Tips on cook log based on inferred techniques from meal + ingredients.',
        details: ['Technique IDs logged to usage', 'Skill practice recorded automatically'],
      },
      {
        id: 'skill-journey',
        title: 'Skill Journey',
        status: 'live',
        summary: 'Practice count and comfort level per technique — from real cooks, not fake progress.',
        details: [
          'Brain skill_learned memories after 3+ logs',
          'Supabase skill_journey_progress table',
        ],
      },
      {
        id: 'gamification',
        title: 'XP & Quests',
        status: 'live',
        summary: 'Levels from First Meal to Master Chef — scan, plan, cook rewards.',
        details: ['Professional academy progression — vision expands this', 'See Kitchen Academy on roadmap'],
      },
    ],
    goDeeper: [{ label: 'Kitchen Academy vision', href: '/vision/academy' }],
  },
  {
    id: 'legacy',
    level: '05',
    title: 'Kitchen Legacy',
    tagline: 'Preserve what matters.',
    icon: Heart,
    status: 'beta',
    intro:
      'Hosting timelines, tradition memories, and recipe lineage — the long game no recipe app builds.',
    features: [
      {
        id: 'hosting',
        title: 'Experience Hosting',
        status: 'beta',
        summary: 'Potluck, dinner party, game day, holiday — menu + timeline + shopping list.',
        details: [
          'Hosting knowledge nodes with timeline templates',
          'experience-plan API + assistant routing',
          'Full hosting UI — deepening next',
        ],
      },
      {
        id: 'traditions',
        title: 'Tradition Memories',
        status: 'beta',
        summary: 'Grandma\'s potato salad, Sunday chili — patterns from cook history.',
        details: ['Tradition nodes in knowledge graph', 'legacyMemories on Brain sync'],
      },
      {
        id: 'recipe-lineage',
        title: 'Recipe Lineage',
        status: 'beta',
        summary: 'serve_count, last_served_at, origin_recipe_id, tradition_id on recipes.',
        details: [
          'Cook log increments serve count on title match',
          'Cookbook social UI — vision',
        ],
      },
      {
        id: 'cook-together',
        title: 'Cook Together',
        status: 'live',
        summary: 'Household invites, shared pantry context, family cooking coordination.',
        details: ['Invite codes', 'Household members in Settings', 'Shared Brain scope'],
      },
    ],
    goDeeper: [
      { label: 'Famous style inspiration (legal)', href: '/vision/famous-styles' },
      { label: 'Cookbook & social', href: '/vision/cookbook' },
    ],
  },
];

export const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Capture',
    body: 'Scan receipts. Log cooks. Track pantry. Voice when your hands are messy.',
  },
  {
    step: '02',
    title: 'Remember',
    body: 'Brain builds your Household Food Graph — with evidence you can read, not black-box guesses.',
  },
  {
    step: '03',
    title: 'Act',
    body: 'Plan with Why this?. Replace what doesn\'t fit. Host with timelines. Preserve traditions.',
  },
];

export const VISION_TOPICS: VisionTopic[] = [
  {
    id: 'roadmap',
    title: 'Full Roadmap',
    tagline: 'For readers who want the whole map.',
    icon: BookOpen,
    audience: 'Committed builders, investors, early believers',
    summary: 'Everything paused, planned, and imagined — honest status, no vaporware marketed as live.',
    sections: [
      {
        heading: 'Shipped (Foundation 1.0 Phases 1–8)',
        body: 'Knowledge graph, Brain 2.0, reasoning engine, decision ledger, skills, hosting API, legacy schema, landing site.',
      },
      {
        heading: 'Next (Phase 9–11)',
        body: 'Clara-first UX, hosting UI, recipes/cookbook restore, famous style layer, Kitchen Academy, one social wedge.',
        bullets: [
          'Hosting UI calling experience-plan',
          '/recipes with lineage and forks',
          'Famous Recipe Inspiration Layer (legal)',
          'Leftover Masterpiece or Plate Score',
        ],
      },
      {
        heading: 'Paused engines (resume after foundation)',
        body: 'From AI Save Point — not cancelled, sequenced.',
        bullets: [
          'Brain 1.0B conversational frame',
          'Journey Engine (full curriculum)',
          'Cookbook Engine + Cookbook Social',
          'Creativity Engine',
          'Culture Engine',
          'Dinner Club',
          'Wine & Bourbon Cellar',
        ],
      },
    ],
  },
  {
    id: 'famous-styles',
    title: 'Famous Style Inspiration',
    tagline: 'We teach styles — we don\'t steal recipes.',
    icon: Utensils,
    audience: 'Food enthusiasts, legal-safe content strategy',
    summary:
      'SousChef never scrapes protected recipe text. We teach famous styles, credit sources, link outward, and create original household-adapted versions.',
    sections: [
      {
        heading: 'The rule',
        body: 'Ingredient lists are often not copyright-protected; expressive directions, headnotes, photos, and collections are. We respect that.',
        bullets: [
          'Style summaries: Texas brisket vs Kansas City sweet-smoke',
          'Credited source links — not copied instructions',
          'Original SousChef versions from your pantry',
          'Licensed API evaluation: Edamam, Spoonacular',
        ],
      },
      {
        heading: 'Clara says',
        body: '"Chef, for brisket there are a few famous styles worth studying…" — then your household version from what you actually have.',
      },
    ],
    relatedExplore: 'legacy',
  },
  {
    id: 'social',
    title: 'Social & Challenges',
    tagline: 'Training kitchen, not another feed.',
    icon: Trophy,
    audience: 'Families who want fun without childish gimmicks',
    summary: 'Plate Score, I Tried It, Leftover Masterpiece, dinner clubs, skill badges, household streaks — Gordon Ramsay would recognize the discipline.',
    sections: [
      {
        heading: 'Challenge layer',
        bullets: [
          'Leftover Masterpiece — weekly pantry challenge',
          'Cook this famous style — from inspiration layer',
          'Dinner club menus — Experience Engine extension',
          'Plate Score & I Tried It — contribution, not vanity',
          'Family recipe forks with lineage',
          'Neighborhood supper clubs (beyond neighbor swap)',
          'Household streaks and pro skill badges',
        ],
        body: 'Neighbor Swap is live today. The rest is sequenced after cookbook and academy foundations.',
      },
    ],
    relatedExplore: 'legacy',
  },
  {
    id: 'smart-kitchen',
    title: 'Smart Kitchen Integrations',
    tagline: 'Appliances that talk to Clara — when the time is right.',
    icon: Wifi,
    audience: 'Deep readers planning the connected kitchen',
    summary: 'Architecture first, code later. Samsung SmartThings, LG ThinQ, smart ovens, thermometers, NFC pantry tags.',
    sections: [
      {
        heading: 'Tier 1 — Read-only',
        bullets: ['Fridge/freezer temperature status', 'Smart fridge interior image import where available'],
      },
      {
        heading: 'Tier 2 — Inventory sync',
        bullets: ['Inventory hints from smart fridge systems', 'Freezer temperature alerts'],
      },
      {
        heading: 'Tier 3 — Clara commands',
        bullets: [
          '"Clara, preheat the oven to 375" where supported',
          'Bluetooth meat thermometer',
          'Smart scale support',
          'NFC pantry tags and QR freezer labels',
          'Appliance-aware cooking instructions',
        ],
      },
    ],
  },
  {
    id: 'academy',
    title: 'Kitchen Academy',
    tagline: 'Professional progression — not participation trophies.',
    icon: ChefHat,
    audience: 'Growing home cooks',
    summary: 'Knife skills → roux → smoke management → sauce building → leftovers mastery → plating → multi-dish timing.',
    sections: [
      {
        heading: 'Today',
        body: 'Micro-lessons on cook log, skill journey DB, comfort levels from practice count.',
      },
      {
        heading: 'Vision',
        body: '"Nice work, Chef. You\'ve handled three roux-based dishes. Next time we explore darker roux and gumbo." — Clara as coach, not quiz app.',
        bullets: [
          'Structured technique paths',
          'Milestone unlocks tied to real cook logs',
          'Replaces generic XP level names over time',
        ],
      },
    ],
    relatedExplore: 'growth',
  },
  {
    id: 'cookbook',
    title: 'Cookbook & Community',
    tagline: 'Your family\'s story — not the internet\'s recipe dump.',
    icon: Users,
    audience: 'Legacy-minded households',
    summary: 'Public feed, likes, saves, forks, stories — built on recipe lineage and tradition memories.',
    sections: [
      {
        heading: 'Live today',
        body: 'Recipes from cook log, like/save API, neighbor swap by zip. Recipes route restoring soon.',
      },
      {
        heading: 'Vision',
        bullets: [
          'Family cookbook with serve counts and last served',
          'Recipe forks with origin_recipe_id lineage',
          'Community rules and attribution',
          'Dinner club coordination',
        ],
      },
    ],
    relatedExplore: 'legacy',
  },
  {
    id: 'knowledge',
    title: 'Knowledge Graph Expansion',
    tagline: '258 nodes today — culinary database tomorrow.',
    icon: Brain,
    audience: 'Technical readers, moat believers',
    summary: 'nutrition/, culture/, equipment/, food_safety/, preservation/, famous_styles/ — the legal KB Clara queries.',
    sections: [
      {
        heading: 'Live directories',
        bullets: ['ingredients', 'techniques', 'cuisines', 'substitutions', 'hosting', 'traditions', 'food_science', 'flavor_profiles', 'meal_patterns'],
      },
      {
        heading: 'Planned directories',
        bullets: ['nutrition', 'culture', 'equipment', 'food_safety', 'preservation', 'famous_styles', 'gardening'],
      },
    ],
    relatedExplore: 'inventory',
  },
  {
    id: 'brain',
    title: 'Brain 1.0B',
    tagline: 'Conversational kitchen memory.',
    icon: Brain,
    audience: 'Users who want Clara to feel alive',
    summary: 'Beyond deterministic insights — natural language Brain frame, still grounded in evidence.',
    sections: [
      {
        heading: '1.0A today',
        body: 'Deterministic pattern detection, explainable cards, zero LLM cost for core math.',
      },
      {
        heading: '1.0B vision',
        body: 'Optional LLM phrasing for insights — credit-gated — while graph math stays free.',
      },
    ],
    relatedExplore: 'memory',
  },
];

export function getLayer(id: string): PlatformLayer | undefined {
  return PLATFORM_LAYERS.find((l) => l.id === id);
}

export function getFeature(layerId: string, featureId: string): { layer: PlatformLayer; feature: SiteFeature; parent?: SiteFeature } | undefined {
  const layer = getLayer(layerId);
  if (!layer) return undefined;
  for (const f of layer.features) {
    if (f.id === featureId) return { layer, feature: f };
    if (f.children) {
      const child = f.children.find((c) => c.id === featureId);
      if (child) return { layer, feature: child, parent: f };
    }
  }
  return undefined;
}

export function getVisionTopic(id: string): VisionTopic | undefined {
  return VISION_TOPICS.find((t) => t.id === id);
}

/** In-app route when logged in — shown on feature drill-down pages */
export const FEATURE_IN_APP: Record<string, string> = {
  'receipt-scan': '/receipt',
  'pantry-wizard': '/wizard',
  'inventory-mgmt': '/inventory',
  'brain-insights': '/brain',
  'meal-planner': '/meals',
  'why-this': '/meals',
  'replace-meal': '/meals',
  clara: '/assistant',
  'what-can-i-make': '/meals',
  'cook-coach': '/cook',
  'micro-lessons': '/learn',
  'cook-together': '/settings',
  hosting: '/assistant',
};

export const ROADMAP_PHASES = [
  { phase: 'Shipped', status: 'live' as const, items: ['Knowledge graph (258 nodes)', 'Brain 2.0 + ledger', 'Reasoning + Why this?', 'Skills + hosting API', 'Legacy schema', 'Marketing site v1'] },
  { phase: 'Phase 9', status: 'beta' as const, items: ['Hosting UI', 'Recipes restore', 'Clara-first navigation', 'Honest Why this? v2'] },
  { phase: 'Phase 10', status: 'vision' as const, items: ['Famous style layer', 'Kitchen Academy paths', 'Knowledge expansion'] },
  { phase: 'Phase 11', status: 'vision' as const, items: ['Plate Score / challenges', 'Cookbook social', 'Dinner Club'] },
  { phase: 'Future', status: 'vision' as const, items: ['Smart kitchen integrations', 'Brain 1.0B', 'Wine cellar', 'Culture engine'] },
];

export const PRICING_COMPARISON = [
  { feature: 'Pantry & manual inventory', free: true, plus: true, family: true },
  { feature: 'Brain deterministic insights', free: true, plus: true, family: true },
  { feature: 'AI credits / month', free: '30', plus: '150', family: '300' },
  { feature: 'Receipt OCR', free: true, plus: true, family: true },
  { feature: 'AI meal plans', free: true, plus: true, family: true },
  { feature: 'Why this? + replace meal', free: 'Limited', plus: true, family: true },
  { feature: 'Hosting experience plans', free: false, plus: true, family: true },
  { feature: 'Cook Together household', free: '2 members', plus: true, family: true },
  { feature: 'Priority AI', free: false, plus: false, family: true },
  { feature: 'Kitchen always works (no credits)', free: true, plus: true, family: true },
];

export function getAdjacentFeatures(layerId: string, featureId: string): SiteFeature[] {
  const layer = getLayer(layerId);
  if (!layer) return [];
  const all = layer.features.flatMap((f) => [f, ...(f.children ?? [])]);
  const idx = all.findIndex((f) => f.id === featureId);
  if (idx < 0) return [];
  return all.filter((_, i) => i !== idx).slice(0, 3);
}

export const LAYER_HERO_CLASS: Record<string, string> = {
  inventory: 'layer-hero-inventory',
  memory: 'layer-hero-memory',
  intelligence: 'layer-hero-intelligence text-white',
  growth: 'layer-hero-growth',
  legacy: 'layer-hero-legacy',
};

