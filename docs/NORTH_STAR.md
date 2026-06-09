# SousChef AI — North Star

> We are not building a recipe app, grocery app, or pantry app.
> We are building a system that helps families develop a richer relationship with food over time.

**Product name:** HomeChef AI · **Persona:** Sous Chef  
**Category:** Household Food Operating System for Families + Kitchen Academy

**Bigger North Star:**

> Help households become more confident, more creative, and more connected through food.

---

## What we are

A longitudinal household food intelligence platform that:

- Knows what your family buys, cooks, likes, wastes, and needs
- Teaches techniques and flavor logic so people grow as cooks
- Preserves family recipes, variations, and stories across generations
- Encourages families and friends to **cook together**
- Gently encourages **buy local** and **grow at home** when it fits the household
- Becomes the living food history of a household over years

## What we are not

- Influencer-driven social media
- A barcode scanner with recipes attached
- A preachy wellness app
- A billing-first SaaS experiment

---

## Behavioral goals (every feature should support these)

Not preachy — helpful. Every recommendation, insight, and nudge should gently push toward:

| Goal | Example nudge |
|------|----------------|
| **Cook more** | 17 home-cooked meals this month |
| **Eat together more** | 11 meals shared as a family |
| **Waste less** | 8 lbs used before spoilage |
| **Learn more** | Learned: roux, deglazing |
| **Spend less** | ~$284 saved vs takeout estimate |
| **Buy & grow local** | Seasonal produce from farmers market; herbs from your garden |

These are reinforcement loops, not lectures. Celebrate progress — address the user as **Chef**. See `develop_notes/BRAND_GUIDE_1_0.md`.

---

## Engine missions (brand-aligned)

| Engine | Mission |
|--------|---------|
| Kitchen Journey | **Develop Better Chefs** — not "teach cooking" |
| Culture Memory | **Preserve Food Traditions** |
| Cookbook Social | **Share What Works** |

---

## Core progression

Most apps stop at:

```
Inventory → Recipes → Grocery Lists
```

SousChef becomes:

```
Inventory → Food Brain → Recommendations → Learning → Creativity → Family Traditions → Community
```

---

## Platform stack (product pyramid)

Internal roadmap — see `develop_notes/BRAND_FREEZE_1_0.md` for full pyramid.

```
LEGACY          Culture Memory
CONNECTION      Dinner Clubs + Community
GROWTH          Academy · Creativity · Cookbook
INTELLIGENCE    Recommendations (Brain 1.0B)
MEMORY          Food Brain (Brain 1.0A)
FOUNDATION      Inventory Engine
```

| Level | Name | Purpose |
|-------|------|---------|
| 1 | Inventory Engine | Receipts, pantry, cook log, subtraction |
| 2 | Food Brain | Memory, consumption, waste, inference |
| 3 | Kitchen Archetype Engine | Southern, Cajun, German — kitchen identity |
| 4 | Recommendation Engine | Goal-based, explainable suggestions |
| 5 | Kitchen Journey Engine | Skills, techniques, learn-while-cooking |
| 6 | Family Cookbook Engine | Ownership, versioning, lineage |
| 7 | Creativity Engine | Leftover Masterpiece™, transformations |
| 8 | Culture Memory Engine | Holidays, traditions, recipe stories |

**Cross-cutting:** **Household Food Success Engine** — tracks home-cooked meals, family meals shared, restaurant savings, waste prevented, skills learned, local food choices.

**Levels 1–4 = knowing the household.**  
**Levels 5–8 = growing the household as cooks.**

---

## Household Food Success Engine (design — build after Brain 1.0B)

Tracks monthly household wins (hidden scores early, visible later):

```
Home-cooked meals this month:     17
Family meals eaten together:      11
Estimated restaurant savings:     $284
Food waste prevented:             8 lbs
New skills learned:               roux, deglazing
Local purchases encouraged:       6 farmers market trips
```

Stored in `household_food_scores` (daily snapshot). Drives dashboard celebration cards — not guilt.

---

## Recommendation philosophy

The assistant does not just recommend recipes. It recommends based on **goals + context**.

Example profile: busy parents, intermediate, family of 5, Southern/Cajun, quick meals, reduce waste, buy local.

```
Tonight: 30-minute Cajun chicken pasta

Why:
• Family likes Cajun
• Ingredients already in pantry
• Under 30 minutes · one-pan cleanup
• Uses spinach before it spoils Thursday
• Substitute local farm bell peppers when available
```

Not: *"Here's a recipe."*

---

## Buy local & grow at home

Gently woven throughout — never mandatory.

| Signal | Source |
|--------|--------|
| Shops farmers markets | Onboarding + kitchen identity |
| Grows garden produce | Onboarding + future garden hook |
| Zip code | Local seasonality, market suggestions |
| Receipt store names | Local butcher, ethnic market patterns |

Future nudges:

> Tomatoes are peak season at farmers markets near you this week.

> You marked basil from your garden — here's a pesto that uses it tonight.

> Support local: this recipe works great with farm-fresh eggs from your usual market.

Onboarding captures intent. Brain learns behavior from receipts and cook logs.

---

## Time-based meal tags (first-class — reserve in schema)

| Tag | Use |
|-----|-----|
| Under 15 Minutes | Weeknight rush |
| Under 30 Minutes | Default family dinner |
| Under 45 Minutes | Standard |
| Weekend Projects | Slow cooks, bakes |
| Holiday Meals | Seasonal |
| Crowd Feeders | 8+ servings |
| Potluck Favorites | Transportable |
| Leftover Masterpiece™ | Transform mode |
| Freezer Friendly | Batch |
| Beginner Friendly | Journey entry |
| Skill Builder | Teaches one technique |
| Buy Local | Seasonal/local ingredients highlighted |

Brain + Journey Engine consume these heavily in Phase B+.

---

## Family Gathering Mode (future)

Dedicated mode — different problem than weeknight dinner.

```
How many are you feeding?
  2 · 4 · 6 · 10+ · Church Potluck · Family Gathering
```

Shifts recommendations toward casseroles, slow cookers, large-batch, holiday recipes.

---

## Learn while cooking (not cooking school)

Avoid "Cooking Course." Tiny lessons embedded in the moment:

> Tonight you'll practice building a roux. It only takes about 5 minutes longer and will improve flavor significantly.

Journey Engine delivers micro-lessons during meal selection and cook log — never lectures.

---

## Family Preference Graph (future — Brain memory type)

Per-person preferences within a household:

```
Steve   ✓ Cajun  ✓ BBQ     ✗ Mushrooms
Kelly   ✓ Italian ✓ Chicken ✗ Very spicy
Child A ✓ Tacos  ✓ Burgers
Child B ✓ Breakfast ✗ Onions
```

**Reserved memory type:** `family_preference`  
Examples: *Steve loves gumbo · Kelly dislikes mushrooms · Family rates BBQ highly*

Do not build behavior until Brain 1.0A. Schema and type reserved.

---

## Grocery list evolution

Three list types from day one (design):

| List | Examples |
|------|----------|
| **Grocery List** | Food — milk, chicken, paprika |
| **Household List** | Paper towels, dog food, soap |
| **Event List** | Church potluck, birthday party, holiday dinner |

All assistant-generated with `source` + `reason` ("Why is this on my list?").

---

## Onboarding signals (collect now, use later)

| Step | Field | Drives |
|------|-------|--------|
| Why are you here? | `culinary_profile.priorities` | Recommendation goals |
| Local & homegrown | `culinary_profile.local_food` | Buy local, seasonal nudges |
| Who cooks with you? | `cooks_with` | Cook Together, family meals metric |
| Cooking self-assessment | Journey entry level |
| Kitchen name | Household identity |

**Priority options:** save money, reduce waste, eat healthier, learn to cook, feed a family, meal plan easier, use what I have, preserve family recipes, buy local, grow food at home.

---

## Cook Together (collaboration philosophy)

Food is social. SousChef encourages families and friends to **collaborate in the kitchen**.

1. **One kitchen, many cooks** — shared pantry, lists, meal plans
2. **Contribution over influence** — Kitchen Cred from tries and variations
3. **Cook sessions** — plan and log together (future)
4. **Invite simply** — one code joins the household kitchen
5. **Credit everyone** — co-authors on variations

| Phase | Feature |
|-------|---------|
| **Now (hooks)** | Household groups, invite codes, Cook Together UI |
| **Brain 1.0A** | Shared grocery lists, household-scoped memory |
| **Cookbook 1.0** | Shared family cookbook |
| **Cookbook Social 1.0** | I Tried It, Plate Score, variation webs |
| **Cook Together 1.0** | Live sessions, shared cook log |

---

## Household Culinary Profile

Separate from Kitchen Archetype (what you cook) — **how you cook**:

| Dimension | Values |
|-----------|--------|
| Confidence | Beginner → Expert |
| Creativity | Follower → Modifier → Creator |
| Adventure | Comfort Zone → Explorer → Always Curious |
| Learning style | Quick Tips, Visual, Detailed, Science |
| Priorities | Save money, waste less, learn, feed family, buy local, … |
| Local food | Farmers market, grow garden, local butcher, seasonal |

Stored in `profiles.culinary_profile JSONB`.

---

## Recipe ownership rule

```
Saturday Gumbo
by Steve Grappe
The Grappe Family
```

Optional **Recipe Stories** — culture, not content.

---

## Community philosophy

**Contribution driven, not influencer driven.**

Kitchen Cred from recipes tried, improved, and taught — not posting volume.

---

## Scoring: Plate Score + I Tried It

Three taps — constructive, not punitive. Variations fork into recipe family trees with co-author credit.

---

## Branded concepts

- **Leftover Masterpiece™** — creative opportunity, not old food
- **Plate Score™** — community recipe quality
- **Kitchen Cred** — author reputation
- **Cook Together** — household collaboration
- **Family Gathering Mode** — crowd-scale cooking
- **Dinner Party Mode™** — full experience planning (menu + timeline + wine)
- **Dinner Club** — rotating hosts, socially connected menus
- **Experience Engine** — weeknight to holiday to game day templates

---

## Experience Engine (Level 9 — future flagship)

Sits above Brain, Journey, Cookbook, and Creativity. Answers:

> **What experience are we trying to create?**

Not just *what should we cook?*

Expands the app from *"Help me feed my family"* to **"Help me create experiences."** People remember experiences longer than recipes.

### Experience types (reserved: `experience_type`)

| Type | Goal |
|------|------|
| Weeknight Survival | Fast, cheap, easy cleanup |
| Family Dinner | Everybody eats, favorites, conversation |
| Date Night | Elevated, low stress, impressive |
| **Dinner Party Mode™** | Host well, impress, manage timing |
| Holiday Gathering | Traditions, large groups, family recipes |
| Potluck Mode | Portable, crowd pleasing, reheats well |
| Game Day | Finger foods, make ahead, large batches |
| Backyard BBQ | Outdoor cooking, side coordination |
| Leftover Masterpiece™ | Creativity from leftovers |
| Seasonal Harvest / Farm-to-Table | Buy local, seasonal menus |
| **Dinner Club** | Rotating hosts, shared planning |
| Special Occasion | Birthday, anniversary, reunion, … |

Each template consumes: Food Brain, Journey Engine, Cookbook, Creativity, Culture Memory, buy-local signals.

### Dinner Party Mode example

```
Theme: Louisiana Supper Club · 8 guests · Intermediate skill

Menu: crab dip → jambalaya → bread pudding
Timeline: shop 2 days before → prep AM → jambalaya 4 PM → guests 6 PM
Wine: pairing suggestions + budget tier + from your cellar
Bring list: visible to all dinner club members
```

### Occasion Engine (future)

Birthday, anniversary, graduation, holiday, church gathering, family reunion, casual get-together — dramatically shifts recommendations.

### Skill-aware hosting

Beginner ≠ Beef Wellington. System targets: *"This menu stretches you slightly but remains achievable."*

### Experience memory (Culture Engine)

Remembers last year's Christmas dinner, Smith family dinner club, annual crawfish boil → *"Use last year's successful menu as a starting point?"*

### Social integration (Cookbook Social later)

Share complete packages — not just recipes:

```
Steve Grappe's Cajun Dinner Party Menu
(menu + shopping list + timeline + recipes + guest count + wine plan)
```

Actions: Try It · Adapt It · Host It · Fork It

---

## Dinner Club (socially connected)

Rotating dinner clubs — **members see everything for the upcoming event:**

| Visible to club | Purpose |
|-----------------|---------|
| **Menu** | Appetizer, main, sides, dessert |
| **Theme** | Louisiana Supper Club, Italian Night, … |
| **Who's hosting** | Rotation order (Smith → Jones → Williams → Grappe) |
| **What to bring** | Each member claims/contributions |
| **Wine plan** | Pairings, who brings which bottle |
| **Timeline** | Prep schedule shared across hosts |
| **Dietary notes** | Club-wide restrictions |

Schema: `dinner_clubs`, `dinner_club_members`, `dinner_club_events`, `dinner_club_contributions`

Members are **socially connected in-app** — not just email threads. See the live menu, claim a dish, confirm wine.

Assistant helps clubs: choose themes, balance menus, avoid repeats, match skill levels.

---

## Wine & spirits layer (future — "over the top" tier)

Separate from food pantry. Eventually:

| Feature | Description |
|---------|-------------|
| **Pairing recommendations** | Match wine to menu, cuisine, experience type |
| **Price tier suggestions** | $ · $$ · $$$ — budget-aware for the occasion |
| **Personal cellar** | Track bottles owned (`cellar_items`) |
| **From cellar first** | "You have a Napa Cab that pairs with this" |
| **Shopping suggestions** | What to buy when cellar lacks a match |
| **Dinner club wine plan** | Shared visible plan — who brings what |
| **Bourbon & spirits** | Same cellar model — `item_type: bourbon \| whiskey \| spirits` |

Stored: `profiles.wine_preferences`, `profiles.spirits_preferences`, `cellar_items` table.

Wine plan shape on events: `{ pairings, budget_tier, from_cellar, to_buy, club_assignments }`

**Phase after Experience Engine 1.0** — but schema reserved now.

---

## Experience tree (future documentation)

```
Experience Engine
├── Weeknight Survival
├── Family Dinner
├── Date Night
├── Dinner Party Mode™
├── Potluck
├── Holiday Gathering
├── Backyard BBQ
├── Game Day
├── Leftover Masterpiece™
├── Seasonal Harvest / Farm-to-Table
├── Dinner Club
└── Special Occasion
        └── Wine & Bourbon pairing layer
```

---

## Brain 1.0A reserved memory types

```
preference | consumption | waste | habit | shopping
family_preference | tradition | local_food | skill_learned
experience | occasion | dinner_club | wine_pairing
```

Behavior not built until Brain 1.0A ships. Types reserved in schema notes.

---

## Locked build order

```
1. V3.1 Hardening          — receipt edit, data trust, mobile QA
2. Brain 1.0A              — memory, archetype, inference, grocery lists
3. Brain 1.0B              — goal-based recommendations, flavor paths, why
4. Journey 1.0             — skills, learn-while-cooking
5. Cookbook 1.0            — ownership, versioning, family cookbook
6. Cookbook Social 1.0     — I Tried It, Plate Score, variations
7. Cook Together 1.0       — live sessions, shared cook log
8. Creativity 1.0          — Leftover Masterpiece, flavor reasoning
9. Culture 1.0             — traditions, holidays, recipe stories
10. Success Engine 1.0     — monthly wins dashboard
11. Experience Engine 1.0  — Dinner Party Mode, timelines, occasion engine
12. Dinner Club 1.0        — rotating clubs, social menus, bring-list, wine plan
13. Wine & Cellar 1.0      — pairings, price tiers, personal cellar, bourbon
14. V5 Monetization        — Stripe after the loop is loved
```

**Do not skip levels. Capture ideas in this doc — resist building before Brain exists.**

---

## Hospitality Engine (future — above Experience)

Underlying concept across Family Meals, Dinner Party, Dinner Clubs, Potlucks, and Holidays: **hospitality**.

Help users become better hosts:

- Seating suggestions
- Make-ahead timelines
- Guest dietary tracking
- Recurring guests and preferences
- Signature menus
- Seasonal entertaining
- Beverage pairings (wine, bourbon)
- Host confidence growth

Most cooking apps focus on food. Few focus on bringing people together around food. This becomes another major moat — built on Experience Engine + Wine layer.

---

## Defensible asset

> This system understands how your family cooks, learns, shops, grows, improves, and creates food over years.

Receipt scanning is table stakes. Longitudinal household food intelligence is not.

**The proprietary asset is the Household Food Graph** — nodes (people, ingredients, recipes, techniques, events, experiences, traditions) and relationships (likes, cooks, wastes, teaches, forks) accumulated over time. See `develop_notes/HOUSEHOLD_FOOD_GRAPH_1_0.md`.

Brain, Journey, Cookbook, Creativity, Culture, and Experience are **views and writers** on the same graph — not separate silos.

---

*Last updated: June 2026 · Burt + Ernie*
