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
import { SITE_STATS } from './marketingContent.js';

const R = SITE_STATS.recipeCount;
const RC = SITE_STATS.recipeCountCompact;

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
      'The foundation of every smart kitchen — truth about what is in your pantry, fridge, and freezer. Every item can link to a 400+ node culinary knowledge graph with sensible kitchen units.',
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
          '1 AI credit per receipt scan',
        ],
      },
      {
        id: 'pantry-photo-scan',
        title: 'Pantry Photo Scan',
        status: 'live',
        summary: 'Point your phone at a fridge or shelf — vision AI identifies items and links them to the knowledge graph.',
        details: [
          'Mobile-first capture — no receipt required',
          'Review and edit before adding to inventory',
          'Knowledge_id linking via graph search',
          'Unit normalization — jar, bag, lb (not generic "unit")',
          '2 AI credits per photo scan',
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
        summary: '400+ JSON nodes — ingredients, techniques (53+), culture (48), flavor profiles (18), food sources (21), substitutions, hosting, traditions.',
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
      {
        id: 'proactive-intelligence',
        title: 'Proactive Kitchen Intelligence',
        status: 'live',
        summary: 'Brain 5.2 — expiring items, kitchen staples, likely meals, buy-never-use, and ledger feedback with inline recipe directions.',
        origins: 'Most apps wait for you to open chat. SousChef reads patterns and pushes actionable cards to Home and Brain.',
        details: [
          'Use-before-waste with inline direction chips → recipe library',
          'Kitchen staple predictions from cook rhythm',
          'Likely-this-week from pantry + ledger prefers/avoids',
          'Tap any card → Clara opens with context pre-filled',
          'Deterministic — zero AI credits',
        ],
      },
      {
        id: 'ai-impact-suite',
        title: 'AI Impact Suite',
        status: 'live',
        summary: 'Household memories, ledger learning, and dish corpus feed every planner prompt and Clara tool call.',
        details: [
          'kitchenBrainContext injects brain memories + ledger tags',
          'Planner intelligence feedback from decision ledger',
          'Unified context — not siloed features',
          'Deterministic assembly before any GPT call',
        ],
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
      `Brain ${SITE_STATS.brainVersion} Clara — nine tools first, expert council when needed. ${R} recipe library, Training Kitchen, multi-course plans, and proactive cards on your dashboard.`,
    features: [
      {
        id: 'recipe-library',
        title: 'Recipe Ideas Library',
        status: 'live',
        summary: `${R} structured recipes across ${SITE_STATS.cuisines} cuisines and ${SITE_STATS.courses} course types — matched to your pantry at zero credits.`,
        details: [
          'Filter by course: mains, appetizers, soups, salads, sides, desserts, breads, breakfast, snacks, beverages',
          'Occasion tags: weeknight, holiday, game day, date night, and more',
          'Pantry match score — uses what you have',
          'recipe:dish_id fast path in Clara — full recipe at 0 credits',
        ],
      },
      {
        id: 'clara-tool-router',
        title: 'Clara Tool Router',
        status: 'live',
        summary: 'Nine deterministic tools before GPT — pantry, dishes, knowledge, skills, ledger, brain memories, substitutions.',
        details: [
          'lookup_pantry, match_dishes, lookup_knowledge, skill_coach',
          'brain_memories, ledger context, find_substitutes, suggest_directions',
          'Proactive predictions pulled into tool context',
          'Evidence chips show what Clara actually used',
        ],
      },
      {
        id: 'expert-synthesis',
        title: 'Expert Council Synthesis',
        status: 'live',
        summary: 'Complex asks invoke Nutritionist, Budget Analyst, Executive Chef — structured JSON merged into one Clara voice.',
        details: [
          '1 credit for multi-constraint planning',
          'Each expert cites evidence — no black box',
          '10 expert personas in brain registry',
        ],
      },
      {
        id: 'evidence-chips',
        title: 'Clara Evidence Chips',
        status: 'live',
        summary: 'Intent, credits, expert IDs, and graph evidence visible in every assistant reply.',
        details: ['expiring:, kept:, replaced:, memory: prefixes', 'Builds trust — see what Clara knows'],
      },
      {
        id: 'meal-planner',
        title: 'AI Meal Planner',
        status: 'live',
        summary: '1–14 day plans from your inventory, coverage presets, multi-course slots, and planning goals.',
        details: [
          'Multi-course: dinner 1/3/4/5, lunch 2/3, optional breakfast',
          'Slot drill-down — per-course Why this? and shopping lists',
          'Cook N nights / easy nights for leftovers',
          'Kitchen Supply Plan grouped shopping list',
          'Planner intelligence feedback from ledger + brain memories',
        ],
      },
      {
        id: 'multi-course-meals',
        title: 'Multi-Course Meal Plans',
        status: 'live',
        summary: 'Plan appetizer through dessert — each slot opens full course detail at /meals/:planId/slot/:slotId.',
        details: [
          'Simple slot cards on planner — tap to drill down',
          'Per-slot Why this?, substitutions, and shopping',
          'Works with AI Impact Suite context',
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
        summary: 'Brain 5.2 assistant — nine-tool router, dish recipe fast path, local sourcing, mobile session refresh, expert synthesis.',
        details: [
          'Graph-first substitutions and directions (0 credits)',
          'recipe:dish_id → full structured recipe at 0 credits',
          'Skill coach from knowledge graph (0 credits)',
          'Tool context + ledger + brain memories in every GPT call',
          'Hosting intent → experience timeline or Hosting Studio',
        ],
      },
      {
        id: 'pwa-install',
        title: 'Install on Home Screen',
        status: 'beta',
        summary: 'Add SousChef to your phone home screen — manifest and install prompt live; offline service worker on roadmap.',
        details: [
          'Web app manifest with SousChef branding',
          'InstallPrompt component on mobile',
          'Full offline PWA — roadmap',
        ],
      },
      {
        id: 'cook-log-infer',
        title: 'Graph-First Cook Log',
        status: 'live',
        summary: 'Log "grilled cheese" — template + pantry match infers ingredients at zero credits.',
        details: [
          'Common meal templates + inventory mention detection',
          'Falls back to Clara only when confidence is low',
          'Technique coach still runs on confirm',
        ],
      },
      {
        id: 'kitchen-calendar',
        title: 'Kitchen Calendar',
        status: 'live',
        summary: 'Meal plan events sync to a household calendar — see the week at a glance.',
        details: ['Sync from meal planner', 'Mark complete from calendar view'],
      },
      {
        id: 'what-can-i-make',
        title: 'What Can I Make?',
        status: 'live',
        summary: 'Pantry-only suggestions — retention hook that always works, even when AI credits exhausted.',
        details: ['Free tier friendly', 'Directions or quick suggestion mode'],
      },
      {
        id: 'nutrition-estimates',
        title: 'Nutrition Estimates',
        status: 'live',
        summary: 'Per-serving macro estimates on meal cards — approximate, evidence-linked, with full drill-down in Why this?.',
        details: [
          'USDA-style reference servings in knowledge base',
          'Household-size per-serving math',
          'Compact view on planner cards; full panel in Why this?',
          'Not medical or dietary advice — estimates only',
        ],
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
        summary: '53+ techniques with micro_lessons, steps, and Kitchen Academy deep dives.',
        origins: 'Technique teaching in kitchens predates written recipes — apprentices watched, then did.',
        history: 'Escoffier codified French technique in the 1900s; home cooks learned from Joy of Cooking and TV. SousChef embeds micro-lessons in the graph so Clara can teach at the moment you need sear, roux, or braise.',
        teachings: [
          'Browse Kitchen Academy for full technique histories',
          'Cook Together coach surfaces the right tip mid-recipe',
          'Each technique links to substitutions and pairings in the graph',
        ],
        details: ['Sear, braise, emulsion, fermentation, and 40+ more', '18 taste profiles teach salt, acid, fat, heat balance', 'Surfaced during Cook Together coach'],
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
        id: 'kitchen-academy',
        title: 'Kitchen Academy',
        status: 'live',
        summary: '150+ deep dives — techniques, taste profiles, 48 cuisines, grocery & farmers market sourcing.',
        origins: 'Cooking education works best in context — while you sear, shop, or explore a new cuisine.',
        history: 'Training Kitchen v1 adds structured learning paths, flavor balance education, and local food source intelligence tied to your profile.',
        teachings: [
          'Browse taste profiles to learn salt, acid, fat, and heat balance',
          'Culture nodes explain how each cuisine builds depth',
          'Set preferred store and local food prefs for tailored shopping tips',
        ],
        details: ['6 learning paths', '21 food source nodes (chains + local)', 'Clara surfaces sourcing in chat'],
      },
      {
        id: 'gamification',
        title: 'XP & Quests',
        status: 'live',
        summary: 'Levels from First Meal to Master Chef — scan, plan, cook rewards.',
        details: ['Six structured learning paths live', 'Clara surfaces sourcing from preferred store + local food prefs'],
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
    status: 'live',
    intro:
      'Hosting Studio, tradition memories, neighbor swap, and recipe lineage — the long game no recipe app builds.',
    features: [
      {
        id: 'hosting',
        title: 'Hosting Studio',
        status: 'live',
        summary: 'Potluck, dinner party, game day, holiday — full UI with menu, timeline, and shopping list.',
        details: [
          'experience-plan API + optional AI menu refine',
          '5 credits per hosting plan',
          'Hosting knowledge nodes with timeline templates',
          'Also reachable via Clara chat',
        ],
      },
      {
        id: 'neighbor-swap',
        title: 'Neighbor Swap',
        status: 'live',
        summary: 'Post surplus ingredients by zip — local community exchange, not a global feed.',
        details: ['Zip-scoped listings', 'Community rules in legal policy'],
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
    body: 'Scan receipts or snap pantry photos. Log cooks. Voice when your hands are messy. Graph-linked inventory from day one.',
  },
  {
    step: '02',
    title: 'Remember',
    body: 'Brain builds your Household Food Graph — proactive cards, ledger learning, evidence you can read.',
  },
  {
    step: '03',
    title: 'Act',
    body: `Browse ${RC} recipes matched to your pantry. Learn techniques in Kitchen Academy. Clara runs nine tools first. Plan multi-course meals with Why this?. Host with timelines.`,
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
        heading: 'Shipped (Brain 5.2)',
        body: `Training Kitchen — ${SITE_STATS.techniques} techniques, ${SITE_STATS.flavorProfiles} taste profiles, ${SITE_STATS.cuisines} cultural cuisines, ${SITE_STATS.foodSources} food sources, ${SITE_STATS.deepDives} Academy deep dives. AI Impact Suite, ${R} recipe library (${SITE_STATS.cuisines} cuisines), Agent Suite v6 Phase 4, KLE v${SITE_STATS.productVersion}, multi-course meal planning, proactive inline directions, inventory unit normalization, PWA install prompt.`,
      },
      {
        heading: 'Shipped (Brain 5.0)',
        body: 'AI Impact Suite foundation, 40k+ recipe corpus v2, nine-tool Clara router, multi-course meal planning, proactive inline directions.',
      },
      {
        heading: 'Shipped (Brain 4.0)',
        body: 'Clara Tool Router foundation, proactive intelligence, pantry vision, expert synthesis, cook log infer, Hosting Studio, mobile Clara fixes.',
      },
      {
        heading: 'Next (Phase 10–11)',
        body: 'Stripe billing launch, cookbook social feed, famous style layer, Brain 1.0B optional phrasing.',
        bullets: [
          'Cookbook social UI (API partial — Recipes.tsx not routed)',
          'Famous Recipe Inspiration Layer (legal)',
          'Leftover Masterpiece or Plate Score',
          'Full offline PWA service worker',
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
    summary: 'Knife skills → roux → smoke → flavor balance → local sourcing → leftovers mastery.',
    sections: [
      {
        heading: 'Live today',
        body: '150+ Kitchen Academy deep dives — techniques, taste profiles, cultural cuisines, food sourcing. Six learning paths. Micro-lessons on cook log, skill journey DB, comfort levels from practice count. Browse at /learn.',
        bullets: [
          '53+ techniques with steps and micro-lessons',
          '18 taste profiles — salt, acid, fat, heat education',
          '48 cultural cuisine nodes + 21 grocery & local food sources',
          'Clara skill coach and sourcing tips at zero credits',
        ],
      },
      {
        heading: 'Vision',
        body: '"Nice work, Chef. You\'ve handled three roux-based dishes. Next time we explore darker roux and gumbo." — Clara as coach, not quiz app.',
        bullets: [
          'Milestone unlocks tied to real cook logs',
          'Video and visual learning modes',
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
        body: `Recipe Ideas at /recipes — ${R} library with pantry match. Recipes from cook log, like/save API, neighbor swap by zip. Social feed UI on roadmap.`,
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
    tagline: `${SITE_STATS.knowledgeNodes} nodes + ${SITE_STATS.recipeCountExact} recipes — culinary database today.`,
    icon: Brain,
    audience: 'Technical readers, moat believers',
    summary: 'Structured JSON knowledge nodes plus partitioned dish corpus — the legal KB and recipe library Clara queries.',
    sections: [
      {
        heading: 'Live directories',
        bullets: ['ingredients', `techniques (${SITE_STATS.techniques}+)`, `cuisines & culture (${SITE_STATS.cuisines})`, `flavor_profiles (${SITE_STATS.flavorProfiles})`, `food_sources (${SITE_STATS.foodSources} chains + local)`, 'substitutions', 'hosting', 'traditions', 'food_science', 'meal_patterns', 'nutrition', `dishes/corpus — ${R} recipes across ${SITE_STATS.cuisines} cuisines`],
      },
      {
        heading: 'Planned directories',
        bullets: ['equipment', 'food_safety', 'preservation', 'famous_styles', 'gardening'],
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
  'pantry-photo-scan': '/pantry-scan',
  'pantry-wizard': '/wizard',
  'inventory-mgmt': '/inventory',
  'brain-insights': '/brain',
  'proactive-intelligence': '/brain',
  'ai-impact-suite': '/brain',
  'recipe-library': '/recipes',
  'meal-planner': '/meals',
  'supply-list': '/shop',
  'kitchen-supply': '/shop',
  'multi-course-meals': '/meals',
  'why-this': '/meals',
  'replace-meal': '/meals',
  'nutrition-estimates': '/meals',
  clara: '/assistant',
  'clara-tool-router': '/assistant',
  'expert-synthesis': '/assistant',
  'evidence-chips': '/assistant',
  'cook-log-infer': '/cook',
  'what-can-i-make': '/meals',
  'kitchen-calendar': '/calendar',
  'cook-coach': '/cook',
  'skill-journey': '/cook',
  'micro-lessons': '/learn',
  'kitchen-academy': '/learn',
  'cook-together': '/settings',
  'pwa-install': '/settings',
  hosting: '/hosting',
  'neighbor-swap': '/community',
  traditions: '/brain',
};

export const ROADMAP_PHASES = [
  { phase: 'Shipped', status: 'live' as const, items: [`SousChef v${SITE_STATS.productVersion} — KLE (taste, rhythm, skills, identity)`, `Brain ${SITE_STATS.brainVersion} — Training Kitchen (${SITE_STATS.techniques} techniques, ${SITE_STATS.flavorProfiles} flavors, ${SITE_STATS.cuisines} cultures, ${SITE_STATS.foodSources} food sources, ${SITE_STATS.deepDives} Academy)`, `${RC} recipe library · Agent Suite v6 Phase 4`, 'Multi-course meal planning + slot drill-down', 'Proactive inline directions + kitchen staple predictions', 'Inventory unit normalization · PWA install prompt', `Knowledge graph (${SITE_STATS.knowledgeNodes} nodes) + unified AI credits (30/150/300)`] },
  { phase: 'Phase 10', status: 'beta' as const, items: ['Stripe billing launch', 'Cookbook social feed UI', 'Brain 1.0B optional phrasing', 'Full offline PWA service worker', 'Grocery price APIs'] },
  { phase: 'Phase 11', status: 'vision' as const, items: ['Famous style layer', 'Plate Score / challenges', 'Video Academy modules'] },
  { phase: 'Phase 12', status: 'vision' as const, items: ['Cookbook social feed', 'Dinner Club', 'Culture engine'] },
  { phase: 'Future', status: 'vision' as const, items: ['Smart kitchen integrations', 'PWA push + weekly digest', 'Wine & bourbon cellar'] },
];

export const PRICING_COMPARISON = [
  { feature: 'Pantry & manual inventory', free: true, plus: true, family: true },
  { feature: 'Recipe library match (0 credits)', free: true, plus: true, family: true },
  { feature: 'Brain + proactive predictions', free: true, plus: true, family: true },
  { feature: 'Kitchen Academy browse (0 credits)', free: true, plus: true, family: true },
  { feature: 'Skill coach + food sourcing tips (0 credits)', free: true, plus: true, family: true },
  { feature: 'Graph substitutions (0 credits)', free: true, plus: true, family: true },
  { feature: 'AI credits / month', free: '30', plus: '150', family: '300' },
  { feature: 'Receipt OCR (1 credit)', free: true, plus: true, family: true },
  { feature: 'Pantry photo scan (2 credits)', free: true, plus: true, family: true },
  { feature: 'AI meal plans', free: true, plus: true, family: true },
  { feature: 'Expert synthesis / complex Clara', free: 'Limited', plus: true, family: true },
  { feature: 'Why this? + replace meal', free: 'Limited', plus: true, family: true },
  { feature: 'Hosting Studio (5 credits)', free: false, plus: true, family: true },
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

