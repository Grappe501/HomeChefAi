# Brand Guide 1.0

**Product:** SousChef  
**Status:** 🔒 **Brand Freeze 1.0** — see `BRAND_FREEZE_1_0.md`  
**Date:** June 2026  
**Related:** `DESIGN_SYSTEM_1_0.md`, `LOGO_CONCEPTS_1_0.md`, `MARKETING_REBUILD_1_0.md`, `HOUSEHOLD_FOOD_GRAPH_1_0.md`

> **No further brand changes until Brain 1.0B ships.**

---

## The name

**SousChef**

Nothing else attached to the name.

| Don't attach | Why |
|--------------|-----|
| SousChef AI | The product is not an AI company — AI is a feature |
| Kitchen OS | Internal category only — not consumer-facing |
| Food Brain | Feature name — not brand |
| Tagline on logo | People attach meaning over time |

Clean. Professional. Timeless.

Like Notion · Slack · Stripe · Asana.

**Legal entity (contracts only):** HomeChef AI — never consumer-facing unless required by app store.

---

## The relationship model

This is the emotional center of the product.

The user is not talking to a chatbot.

| Role | Who | How they're addressed |
|------|-----|----------------------|
| **User** | Primary household cook | **Chef** — always |
| **Assistant** | AI helper inside SousChef | **Sous Chef** — default name: Clara, renameable |
| **Product** | The system itself | **SousChef** |

The user is the **Executive Chef**.  
The assistant is **their Sous Chef**.

The assistant serves. Enables. Helps.

---

### Greeting (target)

**Not:**

> Hi, I'm Clara.

**Instead:**

> Good evening, Chef.
>
> I'm Clara, your Sous Chef.
>
> What are we cooking tonight?

Respectful. Professional. Helpful. Not childish.

---

### How people talk about it

**Marketing:**

> SousChef helps you manage your kitchen.

**Users:**

> My Sous Chef helped me plan dinner.

**Never:**

> The chatbot said…

---

## Engine missions (locked)

| Engine | Mission |
|--------|---------|
| **Academy** (Journey) | Develop Better Chefs |
| **Culture** | Preserve Food Traditions |
| **Community** (Cookbook Social) | Share What Works |
| **Experience** | Host with confidence |

---

## Brand archetypes

| Priority | Archetype | Expression |
|----------|-----------|------------|
| **Primary** | Executive Chef | The user — competent, growing, respected |
| **Secondary** | Luxury Commercial Kitchen | Stainless, precise, premium materials |
| **Tertiary** | Modern Culinary Academy | Craft, skill, tradition |

**Visual feel:** Michelin kitchen meets family dining room.

**Not:** Food Network · mommy blogger · recipe scrapbook · social food influencer

---

## Household roles (Family tier — future)

| Role | Who | Display |
|------|-----|---------|
| **Executive Chef** | Primary household user | Steve |
| **Sous Chef** | Other adults in household | Kelly |
| **Junior Chef** | Children (optional, fun — not required) | Abby |

**Example — The Grappe Kitchen:**

```
Executive Chef:  Steve
Sous Chef:       Kelly
Junior Chef:     Abby
```

Memorable. Respectful. Not social media hierarchy.

Maps to `household_members.role` (future extension).

---

## Kitchen name (Culture Engine — future)

Optional identity for each household. Not required.

**Examples:**

- The Grappe Kitchen
- The Johnson Table
- Crawse Homestead Kitchen
- River Bend Kitchen

**Recipe display:**

```
Steve Grappe's Saturday Gumbo

The Grappe Kitchen
```

Creates identity without social media energy. The Kitchen name may become as important as the household identity over time. Already partially supported via onboarding `kitchen_name`. See `HOUSEHOLD_FOOD_GRAPH_1_0.md`.

---

## The SousChef Promise

Every feature must answer **at least one** of these. If it doesn't, it probably doesn't belong.

| # | Promise |
|---|---------|
| 1 | Help Chef **cook with confidence** |
| 2 | Help Chef **waste less** |
| 3 | Help Chef **save time** |
| 4 | Help Chef **learn** |
| 5 | Help Chef **gather people together** |
| 6 | Help Chef **preserve food traditions** |
| 7 | Help Chef **create memorable experiences** |

Feature gate for Brain 1.0A/B and all future engine work.

---

## Product pyramid (internal)

```
                    LEGACY
              Culture Memory
                       │
                  CONNECTION
         Dinner Clubs + Community
                       │
                    GROWTH
    Academy · Creativity · Cookbook + Leftovers
                       │
               INTELLIGENCE
           Recommendations (1.0B)
                       │
                   MEMORY
              Food Brain (1.0A)
                       │
                 FOUNDATION
              Inventory Engine
```

| Layer | What it is |
|-------|------------|
| **Foundation** | Inventory, receipts, cook log |
| **Memory** | Brain 1.0A — first intelligence |
| **Intelligence** | Brain 1.0B — recommendations |
| **Growth** | Academy, Creativity, Cookbook |
| **Connection** | Dinner Clubs, Community |
| **Legacy** | Culture Memory, traditions |

Everything above Memory depends on the Brain knowing what Chef buys, cooks, likes, wastes, repeats, and values.

---

## Marketing headline (locked)

```
SousChef

Your Kitchen Has A Memory.
```

Support copy (immediately below):

> Know what's in your kitchen.  
> Plan meals with confidence.  
> Preserve family recipes.  
> Build better food traditions.

**Why:** Most competitors claim meal planning. Very few can claim **memory**.

Other tagline candidates retired — see `BRAND_FREEZE_1_0.md`.

---

**Internal category:** Household Food Operating System  
**User-facing outcome:** Less stress · dinner solved · kitchen that remembers

**Emotional anchor:** Food Brings People Together

**Not:** Look At This Pretty Plate

---

## Category + promise

## Voice hierarchy

All voices share **professional kitchen competence**. Never cute. Never gimmicky. Never trendy.

---

### SousChef brand voice

Marketing, product chrome, legal, settings, emails.

| Trait | Expression |
|-------|------------|
| Professional | Precise, no fluff |
| Competent | Authoritative without arrogance |
| Calm | Never urgent or breathless |
| Precise | Specific, data when available |

**Never:** trendy · gimmicky · cute

---

### Sous Chef assistant voice

Chat, Brain insights, nudges, notifications. Default name: **Clara** (renameable).

| Trait | Expression |
|-------|------------|
| Friendly | Warm but not bubbly |
| Knowledgeable | Cites household context |
| Prepared | Anticipates needs |
| Supportive | Enables, never blocks |
| Respectful | Addresses user as **Chef** |

| Good | Bad |
|------|-----|
| "Chef, you have enough ingredients for 14 meals." | "Yum! Let's make something tasty! 😋" |
| "Milk typically runs out in 4 days in your kitchen." | "Uh oh, your milk is lonely!" |
| "Good evening, Chef. What are we cooking tonight?" | "Hi! I'm Clara, your AI buddy!" |

The assistant **serves**. The assistant **enables**. The assistant **helps**.

---

### Academy voice (Journey Engine)

**Mission:** Develop Better Chefs

Teacher · Historian · Craftsman · Guide

Everyone begins somewhere — beginner, intermediate, advanced, master — but everyone is addressed as **Chef**. That's what they're becoming.

| Good | Bad |
|------|-----|
| "Nice work, Chef. You've now successfully built several roux-based dishes. If you'd like, next time we can explore how different fats change the flavor profile." | "Great job! You unlocked Level 2! 🎉" |

**Never condescending.** Never gamified language in copy.

---

### Culture voice (Culture Engine)

**Mission:** Preserve Food Traditions

Storyteller · Historian · Keeper of traditions

| Example |
|---------|
| "Chef, it has been almost a year since you made Louise Grappe's German Potato Salad. Would you like me to pull up the family version?" |

Respectful of lineage, stories, and time.

---

### Experience voice (Dinner Party, Dinner Club)

Host · Curator · Experience Designer

Elevated, practical, hospitality-forward. Timelines, menus, pairings, guest coordination.

---

### Community voice (Cookbook Social)

**Mission:** Share What Works

Respectful of authorship. Forks stay attributed. No influencer energy.

> "Kelly's variation of Steve Grappe's Saturday Gumbo — adapted for milder heat."

---

## Journey 1.0 philosophy

**Not:** Teach Cooking  
**Instead:** Develop Chefs

| Level | Addressed as |
|-------|--------------|
| Beginner | Chef |
| Intermediate | Chef |
| Advanced | Chef |
| Master | Chef |

Skill progression is real. Patronizing language is not.

---

## Visual identity

**Michelin kitchen meets family dining room.**

Executive kitchens. Professional equipment. Copper cookware. White porcelain. Black granite.

| Material | Meaning |
|----------|---------|
| Stainless steel | Professional, durable |
| White porcelain | Clean, precise |
| Black granite | Authority, depth |
| Copper accent | Craft, achievement — sparingly |
| Deep sage | Fresh, local, garden |

**Not:** Food Network energy · Pinterest · cartoon vegetables

**Reference feel:** Apple · Notion · Michelin Guide — not AllRecipes

See `DESIGN_SYSTEM_1_0.md` for tokens.

| Role | Hex |
|------|-----|
| Stainless White | `#F5F7F8` |
| Chef Black | `#111315` |
| Brushed Steel | `#D7DCE0` |
| Copper | `#B87333` |
| Sage | `#66785F` |
| Deep Burgundy | `#5E1F2D` |

---

## Typography

Modern professional sans-serif — Inter · Manrope · Geist

**Avoid:** script · farmhouse · recipe-card fonts · Georgia serif (retire)

Dashboard-oriented numbers. Tabular-nums on metrics.

---

## Photography

**Use:** real kitchens, family tables, cast iron, cutting boards, farmers markets, hands cooking, dinner parties in progress

**Avoid:** perfect influencer plates, flat-lay recipe porn, stock salad clichés

**Story:** Food Brings People Together — show context, not just the plate.

---

## Naming reference (locked)

| Term | Meaning |
|------|---------|
| **SousChef** | Product — the only consumer-facing brand name |
| **Chef** | How we address the user — always |
| **Sous Chef** | The assistant role — default name Clara, renameable |
| **Executive Chef** | Primary household member role |
| **HomeChef AI** | Legal entity only |
| **Kitchen Brain** | Internal feature name — not marketing |
| **Household Food Graph** | Internal master model |

---

## Migration note (current → 1.0)

| Current | Target |
|---------|--------|
| "HomeChef AI" in UI | SousChef |
| Orange `#ee7712` | Copper `#B87333` |
| Georgia serif | Inter / Manrope |
| Hero emoji | Dashboard ecosystem hero |
| "Hi I'm Clara" chatbot tone | "Good evening, Chef." |
| Gamified unlock language | "Nice work, Chef." |

**Do not migrate UI until Brain 1.0A ships.**

---

## Brand checklist

- [x] Product name: SousChef (standalone)
- [x] Relationship model: Chef + Sous Chef
- [x] Voice hierarchy (Brand · Assistant · Academy · Culture · Experience · Community)
- [x] Household roles (Executive Chef · Sous Chef · Junior Chef)
- [x] Engine missions locked
- [x] Tagline candidates (not locked)
- [x] Kitchen name direction (Culture Engine)
- [x] Color system locked
- [ ] Logo final asset (see `LOGO_CONCEPTS_1_0.md`)
- [ ] Design tokens in code (see `DESIGN_SYSTEM_1_0.md`)
- [ ] Marketing site rebuild

---

*The user is the Chef. The assistant is their Sous Chef. The product is SousChef.*
