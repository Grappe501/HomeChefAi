# Contracts & Marketing Status 2.2

**Date:** June 2026  
**Product:** SousChef · **Legal entity:** HomeChef AI  
**Version:** 2.2.0

## Shipped surfaces

| Surface | Status | Notes |
|---------|--------|-------|
| `/landing` + marketing routes | ✅ Production | v2.2 — site search, full sitemap, OG image |
| `public/legal/terms.html` | ✅ v2.2 live | Expanded Terms — attorney review before first charge |
| `public/legal/privacy.html` | ✅ v2.2 live | Retention, household, AI processing |
| `public/legal/ai-usage.html` | ✅ v2.2 live | Full credit cost table |
| `public/legal/community.html` | ✅ v2.2 live | Neighbor swap + cookbook rules |
| `public/legal/sub-processors.html` | ✅ v2.2 live | Supabase, OpenAI, Stripe, Netlify |
| `marketing/index.html` | ✅ Redirect | Points to `/landing` |
| `README.md` | ✅ Updated | v2.2 features |
| Site search (⌘K) | ✅ Production | Find + Ask on marketing site |

## Authoritative frameworks (develop_notes)

| Document | Purpose |
|----------|---------|
| `MARKETING_REBUILD_2_0.md` | Positioning, ICPs, messaging hierarchy |
| `PRICING_AND_USAGE_2_0.md` | Free / Plus $9 / Family $18 |
| `TERMS_AND_COMMUNITY_RULES_2_0.md` | Full Terms outline + community rules |
| `PRIVACY_AND_DATA_POSITIONING_2_0.md` | Privacy philosophy + policy outline |
| `AI_CREDITS_AND_FAIR_USE_2_0.md` | Credit pools, what pauses vs never pauses |

## Still pending (pre-launch billing)

- Attorney review of all `/legal/*` pages (frameworks v2.2 published)
- Stripe live mode + checkout copy alignment
- Unified credit ledger in code (quotas.ts still uses legacy per-action caps)
- App Store seller field: HomeChef AI

## Marketing rule (unchanged)

Consumer-facing name is always **SousChef**. **HomeChef AI** appears in legal footer, Terms, and app store seller field only.
