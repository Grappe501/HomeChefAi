# Pricing & Usage 2.0

**Status:** Launch-ready architecture — supersedes `PRICING_STRATEGY_1_0.md`  
**Date:** June 2026  
**Aligned with:** Brand Freeze 1.0 · Brain 1.0A · `AI_CREDITS_AND_FAIR_USE_2_0.md`  
**Related:** `src/types/billing.ts` (legacy — align at Stripe launch)

> **No Stripe. No billing UI in this pass.** Architecture only.

---

## Pricing philosophy (revalidated)

1. **Clean prices** — $9 and $18. No `.99` tricks.  
2. **Free proves value** — complete the core loop once.  
3. **Never brick the kitchen** — inventory, recipes, cookbook, lists always work.  
4. **Premium intelligence consumes credits** — AI-assisted actions only.  
5. **Deterministic Brain is free** — Brain 1.0A math costs nothing; optional LLM phrasing costs credits.

---

## Tiers (locked)

| Tier | Price | Internal ID | Target |
|------|-------|-------------|--------|
| **Free** | $0 | `free` | Trial household, prove value |
| **Plus** | **$9/mo** | `plus` | Busy family, primary revenue |
| **Family** | **$18/mo** | `family` | Multi-adult, hosting, clubs |

**Annual (launch +90 days):** $90/yr Plus · $180/yr Family (2 months free).

**Legacy mapping:** `pro` → `plus` at billing migration.

---

## The core rule

```
┌─────────────────────────────────────────────────────────┐
│  ALWAYS WORKS (all tiers, credits exhausted, past due)  │
├─────────────────────────────────────────────────────────┤
│  Inventory view/edit (manual)                           │
│  Pantry wizard                                          │
│  Cook log + inventory updates                           │
│  Saved recipes (personal)                               │
│  Cookbook (personal, when shipped)                      │
│  Grocery lists (manual)                                 │
│  Brain 1.0A deterministic insights (generation)       │
│  Settings, onboarding, XP                               │
│  Household membership (within tier limits)              │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  SUBJECT TO AI CREDITS / TIER GATES                      │
├─────────────────────────────────────────────────────────┤
│  Receipt OCR (OpenAI vision)                            │
│  AI meal planning (multi-day)                             │
│  Advanced assistant reasoning                             │
│  Optional LLM insight phrasing                          │
│  Experience / dinner party generation (future)            │
│  Image analysis (future)                                  │
└─────────────────────────────────────────────────────────┘
```

**No customer should lose access to their kitchen.**

---

## Tier comparison

### Free — Prove value

| Dimension | Limit |
|-----------|-------|
| Households | 1 |
| Household members | 2 |
| Inventory items | 100 |
| Receipt scans | 25/month (also credit-gated) |
| Meal plans (AI) | 3/month |
| Assistant messages | 50/month |
| Brain insights visible | 3/month (teaser — full history stored) |
| Brain memory retention | 90 days rolling |
| Cook Together | Join only |
| Cookbook | Personal, no public share |
| Storage (receipt images) | 50 MB |
| **AI credits** | **30/month** |

### Plus — $9/mo — Full household kitchen

| Dimension | Access |
|-----------|--------|
| Household members | Up to 6 |
| Inventory | Unlimited |
| Receipt scans | Unlimited (credits apply) |
| Meal planning | Unlimited (credits apply) |
| Assistant | Unlimited chat (credits apply) |
| **Full Kitchen Brain** | All insights, unlimited visibility |
| Brain memory retention | 24 months |
| Grocery intelligence | Smart lists *(when shipped)* |
| Cook Together | Create + invite |
| Cookbook | Private + community share *(when shipped)* |
| Storage | 500 MB |
| **AI credits** | **150/month** |

### Family — $18/mo — Connect & host

Everything in Plus, plus:

| Dimension | Access |
|-----------|--------|
| Household members | Up to 12 |
| Dinner Club | Create clubs *(when shipped)* |
| Experience Engine | Party mode *(when shipped)* |
| Culture memory | Traditions, stories *(when shipped)* |
| Per-member preference profiles | Yes *(when shipped)* |
| Brain memory retention | Unlimited |
| Storage | 2 GB |
| **AI credits** | **300/month** |

---

## Limit types

| Mechanism | Applies to | Purpose |
|-----------|------------|---------|
| **Structural hard limits** | Free tier only | Inventory count, members, retention window |
| **AI credits** | All tiers | Fair use on OpenAI-cost actions |
| **Rate limits** | All tiers | Abuse / DDoS protection |
| **Feature flags** | Tier gates | Dinner club, experience — future features |

Credits and hard limits are **independent**. Hitting credit cap does not reduce inventory cap.

---

## AI credit costs (summary)

Full table: `AI_CREDITS_AND_FAIR_USE_2_0.md`.

| Action | Credits |
|--------|---------|
| Receipt OCR | 1 |
| Basic assistant reply | 0 |
| "What can I make?" | 1 |
| Meal plan (7+ days) | 2 |
| Complex dinner party plan | 5 |
| Flavor / creativity mode | 1 |
| Brain insight LLM phrasing (optional) | 1 |
| Brain deterministic sync | 0 |
| Brain query / view insights | 0 |
| Future: image analysis | 2 |

**150 credits ≈** 150 scans OR 75 seven-day plans OR realistic mix for busy family.

---

## Credit exhaustion UX

```
❌  "Your kitchen is disabled."
❌  Silent failure / infinite spinner
❌  Surprise overage charge

✅  "You've used your AI credits for this month. Your pantry, recipes,
    and lists still work. Credits refresh on [date]. Upgrade for more,
    or continue manually."
```

Show before credit-consuming action:

> This scan uses 1 AI credit. [Balance: 47 remaining]

Subtle meter in Settings — not anxiety-inducing countdown on every screen.

---

## Brain retention limits

| Tier | Retention | On downgrade |
|------|-----------|--------------|
| Free | 90 days rolling | Older memories archived, not deleted |
| Plus | 24 months | Archive beyond window |
| Family | Unlimited | Full history |

**Rule:** Never delete memories as punishment. Archive with restore on upgrade.

Brain 1.0A deterministic generation remains **free** — retention gates visibility/history depth, not core inventory.

---

## Storage limits

| Tier | Receipt/image storage | Behavior at limit |
|------|----------------------|-------------------|
| Free | 50 MB | New uploads blocked; manual inventory works |
| Plus | 500 MB | Prompt to upgrade or delete old receipt images |
| Family | 2 GB | Same |

Images sent to OpenAI for OCR are not retained by OpenAI per their API terms. We store truncated parse results.

---

## Trial strategy

| Decision | Value |
|----------|-------|
| 30-day Plus trial on signup | **Yes** — matches current beta |
| Credit card for trial | **No** — until Brain 1.0B proves upgrade value |
| Trial → Free downgrade | **Graceful** — no data loss |
| Trial → paid conversion email | Day 25, 28, 30 |

---

## Upgrade triggers (UX)

Show upgrade prompt when:

1. Free user views 4th Brain insight (teaser worked)  
2. 80% AI credits consumed  
3. Inventory hits 100 items on Free  
4. 3rd member invite on Free  
5. Attempts Dinner Club on Plus *(future)*  
6. Brain memory beyond 90 days on Free  

**Never trigger on:** viewing pantry, cook log, manual list, reading saved recipes.

---

## Revenue planning

| Metric | Target |
|--------|--------|
| Free → Plus @ 90 days | 8–12% |
| Plus → Family | 15–20% of Plus |
| Monthly churn (Plus) | <5% |
| Blended ARPU | ~$11 |
| CAC payback | <6 months (organic-first GTM) |

---

## Audit of Pricing 1.0

| Item | 1.0 | 2.0 change |
|------|-----|------------|
| Tier prices | $9 / $18 | ✅ Unchanged |
| AI credits | 30 / 150 / 300 | ✅ Unchanged |
| Core never brick | Stated | ✅ Explicit matrix |
| Brain retention | Not defined | ✅ Added by tier |
| Storage limits | Not defined | ✅ Added |
| Brain 1.0A free gen | Implied | ✅ Explicit: deterministic = 0 credits |
| `billing.ts` alignment | Pending | Still pending at Stripe launch |

---

## Stripe launch checklist

- [ ] `subscriptions.tier`: `free | plus | family`  
- [ ] `ai_credits` table + monthly reset job  
- [ ] Migrate `pro` → `plus`  
- [ ] Usage meter in Settings (subtle)  
- [ ] Pre-action credit confirmation  
- [ ] Terms + Privacy + AI policy URLs at checkout  
- [ ] Webhook: graceful downgrade preserves data  
- [ ] Attorney-reviewed Terms before first charge  

---

## What NOT to build now

- Stripe integration  
- Pricing page UI  
- Credit anxiety UI on every screen  
- Brain 1.0B feature gates  

---

*$9 and $18. The kitchen always works. Intelligence is what you pay for.*
