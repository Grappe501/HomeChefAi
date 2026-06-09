# Marketing Site Architecture 1.0

**Status:** Documentation only — rebuild after Brain 1.0A  
**Date:** June 2026  
**Related:** `BRAND_GUIDE_1_0.md`, `MARKETING_REBUILD_1_0.md`, `PRICING_STRATEGY_1_0.md`

> **Current state:** `marketing/index.html` uses Georgia serif, orange palette, hero emoji, and "pantry/meal planning" messaging. **Retire entirely** on rebuild.

---

## Site purpose

Convert visitors who want **professional kitchen competence**, not another recipe app.

**Primary job:** Explain the Household Food OS category and drive free signup.  
**Secondary job:** Establish premium brand before Plus ($9) and Family ($18) billing launch.

---

## Brand application on site

| Element | Treatment |
|---------|-----------|
| Aesthetic | Apple + Notion + Michelin Guide |
| Palette | Stainless White · Chef Black · Copper · Sage · Burgundy |
| Typography | Inter/Manrope — no Georgia, no script |
| Imagery | Dashboard ecosystem hero — not recipe close-up |
| Voice | Clara — professional, confident, never goofy |
| CTAs | Copper primary buttons, 12px radius |

See `BRAND_GUIDE_1_0.md` and `DESIGN_SYSTEM_1_0.md` for full tokens.

---

## Information architecture

```
/                           Home — OS positioning + outcome metrics
/how-it-works               Receipt → Brain → Cook → Remember
/pricing                    Free · Plus $9 · Family $18
/brain                      Kitchen Brain explainer (flagship after 1.0A)
/families                   Cook Together, households, dinner clubs
/about                      Mission — richer relationship with food
/legal/
  /legal/terms              Terms of Service
  /legal/privacy            Privacy Policy
  /legal/ai-usage             AI Usage Policy
  /legal/cookbook             Community Cookbook Policy
```

### Phase gating

| Page | Ship when |
|------|-----------|
| `/` `/how-it-works` `/pricing` `/about` `/legal/*` | Marketing rebuild 1.1 (post Brain 1.0A) |
| `/brain` | Brain 1.0A live with real insights |
| `/families` | Cook Together polished + Dinner Club tease |
| `/cookbook` | Cookbook Social 1.0 |

**Rule:** Do not publish pages for features that aren't live. Tease on roadmap section only.

---

## Page specifications

### `/` — Home

**Goal:** Category creation — "Operating System For Your Kitchen"

#### Hero (locked — Brand Freeze 1.0)

| Element | Content |
|---------|---------|
| Product name | **SousChef** — standalone, no tagline on logo |
| Headline | **Your Kitchen Has A Memory.** |
| Support copy | Know what's in your kitchen. Plan meals with confidence. Preserve family recipes. Build better food traditions. |
| Primary CTA | Start free — scan your first receipt |
| Secondary CTA | See how SousChef works → `/how-it-works` |
| Hero image | Tablet dashboard · cookbook open · family dinner · wine · fresh ingredients |

#### Outcome metrics band

Live counter style (static until Success Engine ships):

> 17 home-cooked meals this month · $284 saved · 8 lbs waste prevented

Not: "472 recipes available."

#### Three pillars (above fold or scroll 1)

| Pillar | Headline | Proof |
|--------|----------|-------|
| Save money | Waste less. Shop smarter. | Receipt scan → pantry truth |
| Save time | Know what to cook. | Brain learns your household |
| Preserve more | Your recipes. Your stories. | Family cookbook + lineage |

#### Social proof (future)

- Household testimonials — real kitchens, not influencers
- "The Grappe Family" style attribution

#### Footer CTA

Repeat primary CTA + pricing link

---

### `/how-it-works`

**Goal:** Visual flow — prove it's a system, not a feature list

#### Flow (horizontal or vertical scroll)

```
1. SCAN          2. LEARN           3. PLAN            4. COOK            5. REMEMBER
Receipt photo    Brain builds       AI-assisted        Cook log           Family cookbook
→ pantry         household          meal plan          subtracts          + memories
                 patterns           from pantry        inventory          + traditions
```

Each step: screenshot or illustration in **dashboard style** — not cartoon.

#### Comparison callout

> Meal planners tell you what to cook Tuesday. SousChef knows what your family actually eats, buys, wastes, and remembers — every Tuesday.

Link → `/brain`

---

### `/pricing`

**Goal:** Clean tier comparison — no `.99` pricing

| Tier | Price | Headline |
|------|-------|----------|
| Free | $0 | Prove value |
| Plus | **$9/mo** | Full household kitchen |
| Family | **$18/mo** | Multiple adults, dinner clubs, hosting |

Full tier details: `PRICING_STRATEGY_1_0.md`

#### Design notes

- Family tier: subtle burgundy accent (premium)
- Plus tier: featured / recommended badge in copper
- AI credits explained with link to `/legal/ai-usage`
- No "unlimited AI" language anywhere

#### FAQ section

- What happens when I run out of AI credits? (Core still works)
- Can I share with my household? (Cook Together)
- Is this a meal planner? (No — Household Food OS)

---

### `/brain` — Kitchen Brain (flagship)

**Goal:** Sell the moat — longitudinal household intelligence

**Ship:** Only when Brain 1.0A produces real insights on production.

#### Sections

1. **Hero:** "Your kitchen finally remembers."
2. **Problem:** One-shot AI vs Brain that learns over months
3. **Insight examples:** Real anonymized insights (consumption cycles, waste patterns, preferences)
4. **Architecture teaser:** Deterministic memory + inference — not black box
5. **CTA:** Start free — build your Brain

#### Visual

Timeline / insight card UI mockup using design system tokens.

---

### `/families`

**Goal:** Household-first positioning — differentiate from single-user apps

#### Sections

- Cook Together — one kitchen, many cooks
- Family preferences (future)
- Dinner clubs (Family tier — tease if not live)
- Outcome: "Connect more — meals eaten together"

---

### `/about`

**Goal:** Mission and trust

> We believe food is how families connect, traditions survive, and skills pass down. SousChef exists to make home cooking easier, smarter, and worth preserving.

Tone: warm but professional. No manifesto length.

Team section: optional, minimal.

---

### `/legal/*`

Publish at billing launch minimum. Drafts in `TERMS_FRAMEWORK_1_0.md` and `AI_USAGE_POLICY_1_0.md`.

| Page | Source doc |
|------|------------|
| Terms | `TERMS_FRAMEWORK_1_0.md` §1 |
| Privacy | `TERMS_FRAMEWORK_1_0.md` §3 |
| AI Usage | `AI_USAGE_POLICY_1_0.md` |
| Cookbook | `TERMS_FRAMEWORK_1_0.md` §2 |

Design: clean prose layout, Notion-style readability. No legal jargon walls without structure.

---

## Global components

### Navigation

```
[Logo: toque-bubble + SousChef]     How it works · Brain · Pricing · About     [Start free →]
```

Product name in nav: **SousChef** only — no tagline, no "AI" suffix.

- Sticky header, white background, 1px steel border bottom
- Mobile: hamburger → slide drawer

### Footer

```
Product          Company           Legal
How it works     About             Terms
Brain            —                 Privacy
Pricing                            AI Usage
Families                           Cookbook Policy

© HomeChef AI · SousChef
```

### CTA patterns

| Type | Label | Destination |
|------|-------|-------------|
| Primary | Start free | App signup `/signup` or app URL |
| Secondary | See pricing | `/pricing` |
| Tertiary | Learn about Brain | `/brain` |

App URL: `https://home-chef-ai.netlify.app`

---

## SEO & meta

### Home

```html
<title>SousChef — Your Kitchen Has A Memory</title>
<meta name="description" content="Know what's in your kitchen. Plan meals with confidence. Preserve family recipes. Build better food traditions." />
```

### Open Graph

- OG image: Dashboard + cookbook ecosystem (1200×630)
- Not: single recipe photo

### Structured data (future)

- `SoftwareApplication` schema
- Pricing tiers when billing live

---

## Technical approach

| Option | Recommendation |
|--------|----------------|
| Static HTML (current) | Replace — too divergent from app |
| Vite marketing route | Possible — shared Tailwind tokens |
| Separate Astro/Next marketing | Overkill for now |
| **Recommended** | Rebuild `marketing/index.html` as multi-page static site sharing CSS tokens from design system |

### Shared assets

- Import design tokens from single `tokens.css`
- Same favicon/logo as app
- Font: Inter via Google Fonts or self-hosted

### Deploy

- Netlify: `marketing/` folder or subdomain `www`
- App remains at `home-chef-ai.netlify.app`

---

## Content migration checklist

| Current (`marketing/index.html`) | Action |
|----------------------------------|--------|
| Georgia serif logo | → Inter wordmark |
| Orange `#ee7712` | → Copper `#B87333` |
| Hero emoji 🍳 | → Dashboard ecosystem photo |
| "Track pantry, plan meals" | → OS positioning headline |
| Feature emoji icons | → Lucide line icons |
| "Never waste food again" guilt | → Outcome metrics (positive) |
| Generic pricing | → Free / $9 / $18 locked tiers |

---

## Rebuild phases

| Phase | When | Deliverable |
|-------|------|-------------|
| **1.0 (now)** | Pre-Brain 1.0A | This architecture + brand docs |
| **1.1** | Brain 1.0A live | Home + How it works + Pricing + `/brain` |
| **1.2** | Cook Together polish | `/families` |
| **2.0** | Billing launch | Stripe checkout links, legal pages live |
| **2.1** | Cookbook Social | `/cookbook` page |

---

## Success metrics (post-launch)

| Metric | Target |
|--------|--------|
| Bounce rate on `/` | < 55% |
| Signup click-through | > 8% of uniques |
| Time on `/brain` | > 90s (engagement) |
| Pricing → signup | > 15% |

---

## Immediate actions

- [x] Site architecture documented (this file)
- [x] Brand tokens locked (`BRAND_GUIDE`, `DESIGN_SYSTEM`)
- [x] Logo direction chosen (`LOGO_CONCEPTS`)
- [ ] Brain 1.0A insights on production
- [ ] Hero photography or high-fidelity mockup
- [ ] Logo vector assets (Option C)
- [ ] Rebuild `marketing/` — **after Brain 1.0A**

---

*The marketing site sells a kitchen command center. Not a recipe homepage.*
