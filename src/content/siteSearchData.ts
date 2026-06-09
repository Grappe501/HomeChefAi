/**
 * Searchable site index — pages, platform, vision, FAQ (no React icons).
 */

import { PLATFORM_LAYERS, VISION_TOPICS, HOW_IT_WORKS, PRICING_COMPARISON } from './siteContent';
import { MARKETING_FAQ, TRUST_PILLARS, SITE_TAGLINE } from './marketingContent';
import type { SiteSearchCategory, SiteSearchEntry } from '@/types/siteSearch';

const STATIC_PAGES: SiteSearchEntry[] = [
  {
    id: 'page-landing',
    title: 'Home',
    href: '/landing',
    category: 'page',
    summary: 'SousChef — Household Food Operating System. Your kitchen has a memory.',
    keywords: 'home start free souschef',
  },
  {
    id: 'page-explore',
    title: 'Platform overview',
    href: '/explore',
    category: 'page',
    summary: 'Five layers: Inventory, Memory, Intelligence, Growth, Legacy — every live feature mapped.',
    keywords: 'features stack platform map',
  },
  {
    id: 'page-how',
    title: 'How it works',
    href: '/how',
    category: 'page',
    summary: 'Capture receipts and cooks. Remember with Brain. Act with meal plans and Clara.',
    keywords: 'how capture remember act workflow',
  },
  {
    id: 'page-pricing',
    title: 'Pricing',
    href: '/pricing',
    category: 'pricing',
    summary: 'Free $0, Plus $9/mo, Family $18/mo. Pantry always works at zero AI credits.',
    keywords: 'price cost plan subscription credits stripe',
  },
  {
    id: 'page-story',
    title: 'Our story',
    href: '/story',
    category: 'page',
    summary: 'Why SousChef exists — kitchen memory that compounds, not another recipe feed.',
    keywords: 'mission moat privacy why',
  },
  {
    id: 'page-vision',
    title: 'Vision & roadmap',
    href: '/vision',
    category: 'vision',
    summary: 'Honest roadmap — shipped, beta, and future vision topics.',
    keywords: 'roadmap future phases',
  },
  {
    id: 'page-learn',
    title: 'Kitchen Academy',
    href: '/learn',
    category: 'learn',
    summary: 'Deep dives on techniques, taste profiles, cultural cuisines, food sourcing — history, origins, and teach-me moments.',
    keywords: 'learn academy training kitchen farmers market grocery techniques flavor',
  },
  {
    id: 'page-login',
    title: 'Sign in / Start free',
    href: '/login',
    category: 'page',
    summary: 'Create your kitchen — receipt scan, meal plans, Clara sous chef.',
    keywords: 'login signup register account app',
  },
  {
    id: 'legal-privacy',
    title: 'Privacy policy',
    href: '/legal/privacy.html',
    category: 'legal',
    summary: 'We do not sell household food data. How we use inventory and cook logs.',
    keywords: 'privacy data gdpr',
  },
  {
    id: 'legal-terms',
    title: 'Terms of service',
    href: '/legal/terms.html',
    category: 'legal',
    summary: 'Terms of use for SousChef / HomeChef AI.',
    keywords: 'terms legal',
  },
  {
    id: 'legal-ai',
    title: 'AI usage policy',
    href: '/legal/ai-usage.html',
    category: 'legal',
    summary: 'Fair-use AI credits, per-action costs, what pauses vs never pauses when credits run out.',
    keywords: 'ai credits fair use openai',
  },
  {
    id: 'legal-community',
    title: 'Community & cookbook rules',
    href: '/legal/community.html',
    category: 'legal',
    summary: 'Rules for neighbor swap, shared recipes, and future cookbook social features.',
    keywords: 'community cookbook swap rules',
  },
  {
    id: 'legal-subprocessors',
    title: 'Sub-processors',
    href: '/legal/sub-processors.html',
    category: 'legal',
    summary: 'Supabase, OpenAI, Stripe, Netlify — vendors that process data for SousChef.',
    keywords: 'sub-processors vendors gdpr',
  },
];

function flattenPlatform(): SiteSearchEntry[] {
  const out: SiteSearchEntry[] = [];
  for (const layer of PLATFORM_LAYERS) {
    out.push({
      id: `layer-${layer.id}`,
      title: `${layer.title} layer`,
      href: `/explore/${layer.id}`,
      category: 'platform',
      summary: layer.tagline + ' — ' + layer.intro.slice(0, 120),
      keywords: `${layer.id} ${layer.title} layer platform`,
      status: layer.status,
    });
    for (const f of layer.features) {
      out.push({
        id: `feature-${layer.id}-${f.id}`,
        title: f.title,
        href: `/explore/${layer.id}/${f.id}`,
        category: 'feature',
        summary: f.summary,
        keywords: `${f.id} ${f.title} ${layer.title} ${f.details.join(' ')}`.slice(0, 200),
        status: f.status,
      });
      for (const c of f.children ?? []) {
        out.push({
          id: `feature-${layer.id}-${c.id}`,
          title: c.title,
          href: `/explore/${layer.id}/${c.id}`,
          category: 'feature',
          summary: c.summary,
          keywords: `${c.id} ${c.title} ${f.title}`,
          status: c.status,
        });
      }
    }
  }
  return out;
}

function visionEntries(): SiteSearchEntry[] {
  return VISION_TOPICS.map((t) => ({
    id: `vision-${t.id}`,
    title: t.title,
    href: `/vision/${t.id}`,
    category: 'vision' as SiteSearchCategory,
    summary: t.summary + ' — ' + t.tagline,
    keywords: `${t.id} ${t.audience} ${t.sections.map((s) => s.heading).join(' ')}`,
  }));
}

function faqEntries(): SiteSearchEntry[] {
  return MARKETING_FAQ.map((f) => ({
    id: `faq-${f.id}`,
    title: f.question,
    href: '/landing#faq',
    category: 'faq' as SiteSearchCategory,
    summary: f.answer,
    keywords: f.question,
  }));
}

function howEntries(): SiteSearchEntry[] {
  return HOW_IT_WORKS.map((s) => ({
    id: `how-${s.step}`,
    title: s.title,
    href: '/how',
    category: 'page' as SiteSearchCategory,
    summary: s.body,
    keywords: `how ${s.title} step ${s.step}`,
  }));
}

function pricingEntries(): SiteSearchEntry[] {
  return PRICING_COMPARISON.map((row, i) => ({
    id: `pricing-row-${i}`,
    title: `Pricing: ${row.feature}`,
    href: '/pricing',
    category: 'pricing' as SiteSearchCategory,
    summary: `Free: ${row.free} · Plus: ${row.plus} · Family: ${row.family}`,
    keywords: row.feature,
  }));
}

/** Full marketing site search corpus (client + build script). */
export function buildSiteSearchEntries(extraLearn: SiteSearchEntry[] = []): SiteSearchEntry[] {
  const trust = TRUST_PILLARS.map((p, i) => ({
    id: `trust-${i}`,
    title: p.label,
    href: '/landing',
    category: 'page' as SiteSearchCategory,
    summary: p.detail,
    keywords: p.label,
  }));

  return [
    ...STATIC_PAGES,
    ...flattenPlatform(),
    ...visionEntries(),
    ...faqEntries(),
    ...howEntries(),
    ...pricingEntries(),
    ...trust,
    {
      id: 'meta-tagline',
      title: 'SousChef tagline',
      href: '/landing',
      category: 'page',
      summary: SITE_TAGLINE,
      keywords: 'tagline memory kitchen',
    },
    ...extraLearn,
  ];
}

/** Client-side keyword search */
export function searchSiteEntries(entries: SiteSearchEntry[], query: string, limit = 12): SiteSearchEntry[] {
  const q = query.toLowerCase().trim();
  if (!q) return entries.filter((e) => e.category === 'page').slice(0, 8);

  const terms = q.split(/\s+/).filter(Boolean);

  const scored = entries
    .map((e) => {
      const blob = `${e.title} ${e.summary} ${e.keywords ?? ''} ${e.category}`.toLowerCase();
      let score = 0;
      if (e.title.toLowerCase().includes(q)) score += 10;
      if (blob.includes(q)) score += 5;
      for (const t of terms) {
        if (e.title.toLowerCase().includes(t)) score += 3;
        if (blob.includes(t)) score += 1;
      }
      return { entry: e, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((x) => x.entry);
}
