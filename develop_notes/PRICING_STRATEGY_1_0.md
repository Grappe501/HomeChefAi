# Pricing Strategy 1.0

**Status:** Architecture documentation — no Stripe, no billing UI  
**Date:** June 2026  
**Related:** `AI_USAGE_POLICY_1_0.md`, `src/types/billing.ts` (legacy limits — will align on billing launch)

---

## Pricing philosophy

1. **Clean prices** — no `.99` psychology. Simple, honest numbers.
2. **Free proves value** — generous enough to hook, limited enough to upgrade.
3. **Never brick core functionality** — inventory, recipes, cookbook, lists always work.
4. **Limit premium AI actions only** — see AI credit system.
5. **Architecture now, billing later** — tiers inform Brain 1.0A feature gates.

---

## Product tiers (locked)

| Tier | Price | Billing name (internal) | Target ICP |
|------|-------|-------------------------|------------|
| **Free** | $0 | `free` | Trial household, prove value |
| **Plus** | **$9/mo** | `plus` (maps to legacy `pro`) | Busy family kitchen |
| **Family** | **$18/mo** | `family` | Multi-adult, dinner clubs, hosting |

**Annual (future):** 2 months free — $90/yr Plus, $180/yr Family.

**Not using:** $9.99, $14.99, $19.99, $24.99.

---

## Tier comparison

### Free — Prove value

Designed to complete the core loop once, then feel the Brain ceiling.

| Feature | Limit |
|---------|-------|
| Households | 1 |
| Household members | 2 |
| Inventory items | 100 |
| Receipt scans | 25/month |
| Basic meal planning | 3 plans/month |
| Assistant messages | 50/month |
| Brain insights | 3 visible/month (teaser) |
| Cook Together | Join only (cannot create club) |
| Cookbook | Personal only, no public sharing |
| AI credits | 30/month |

**Always works (no limits):**

- View and edit inventory manually
- Pantry wizard
- Cook log + inventory subtraction
- View saved recipes
- Grocery list (manual)
- Settings, onboarding, gamification XP

---

### Plus — $9/mo — Full household kitchen

| Feature | Access |
|---------|--------|
| Households | 1 |
| Household members | Up to 6 |
| Inventory | Unlimited |
| Receipt scans | Unlimited (AI credits apply) |
| Meal planning | Unlimited (AI credits apply) |
| Assistant | Unlimited chat (AI credits apply) |
| **Full Kitchen Brain** | All insights, consumption tracking, inference |
| Grocery intelligence | Smart lists, "why is this here?" |
| Family Cookbook | Private + share to community |
| Cook Together | Create household, invite members |
| Journey Engine | Basic (when shipped) |
| AI credits | **150/month** |
| Buy local nudges | Full |

---

### Family — $18/mo — Connect & host

Everything in Plus, plus:

| Feature | Access |
|---------|--------|
| Household members | Up to 12 |
| **Dinner Club** | Create clubs, rotating hosts, shared menus |
| **Experience Engine** | Dinner Party Mode, potluck, game day (when shipped) |
| Event planning | Timelines, guest dietary tracking |
| Wine & cellar | Pairing suggestions, cellar (when shipped) |
| Advanced Journey | Skill paths, flavor reasoning |
| Culture memory | Holiday traditions, recipe stories |
| Priority AI pool | **300/month credits** |
| Multiple adults | Separate preference profiles per member |

---

## AI credit system

Credits apply to **premium AI actions only**. Core system never stops.

| Action | Credits | Tier notes |
|--------|---------|------------|
| Receipt OCR (scan) | 1 | Free: counts toward 30 pool |
| Basic assistant reply | 0 | Always free |
| Advanced meal plan (7+ days) | 2 | |
| "What can I make?" | 1 | |
| Complex dinner party plan | 5 | Family only |
| Flavor reasoning / creativity mode | 1 | Plus+ |
| Leftover Masterpiece generation | 1 | Plus+ |
| Brain insight generation (batch) | 0 | Deterministic stats — no credit |
| OpenAI-heavy summarization | 1 | Optional phrasing only |

**Normal users never notice.** 150 credits ≈ 150 receipt scans OR 75 meal plans OR mix.

**Power users** hit ceiling → upgrade prompt, never hard block on inventory/recipes.

### Credit exhaustion behavior

```
❌ Bad:  "Sorry, your kitchen is disabled."

✅ Good: "You've used your AI credits this month. Your pantry, recipes,
         and lists still work. Upgrade for more AI-assisted planning,
         or wait until [date] for credits to refresh."
```

---

## Usage limits vs AI credits

| Mechanism | Purpose |
|-----------|---------|
| **Hard limits (Free only)** | Cap inventory count, member count — structural |
| **AI credits** | Fair use on expensive OpenAI calls |
| **Rate limits** | Abuse prevention (all tiers) — see AI_USAGE_POLICY |

Legacy code (`FREE_LIMITS` in `billing.ts`) aligns roughly with Free tier. Update on billing launch:

```typescript
// Future alignment (not implemented yet)
PLUS_PRICE = 900   // cents, $9.00
FAMILY_PRICE = 1800 // cents, $18.00
```

---

## Trial strategy (future)

| Option | Recommendation |
|--------|----------------|
| 30-day full Plus trial on signup | **Yes** — current beta behavior |
| Credit card required for trial | **No** — until Brain proves value |
| Trial → Free (not hard cancel) | **Yes** — graceful downgrade |

---

## Upgrade triggers (UX, future)

Show upgrade when user hits:

1. 4th Brain insight on Free (teaser worked)
2. 80% AI credits used
3. Attempts to create Dinner Club on Plus
4. 3rd household member invite on Free
5. Inventory hits 100 items on Free

**Never** trigger on: viewing pantry, cook log, manual grocery list.

---

## Revenue model assumptions (planning)

| Metric | Assumption |
|--------|------------|
| Free → Plus conversion | 8–12% at 90 days |
| Plus → Family conversion | 15–20% of Plus (hosting households) |
| Churn (Plus) | <5%/month target |
| ARPU target | ~$11 blended |

---

## What NOT to build now

- Stripe integration
- Pricing page UI
- Usage meter in app (hidden until billing)
- Credit countdown anxiety UI

**Do build in Brain 1.0A:** feature flags / tier checks as comments or env-only gates for future.

---

## Alignment checklist (billing launch)

When Stripe goes live:

- [ ] Update `marketing/index.html` with $9 / $18
- [ ] Map `subscriptions.tier`: `free | plus | family`
- [ ] Migrate legacy `pro` → `plus`
- [ ] Implement `ai_credits` table + monthly reset
- [ ] Publish AI Usage Policy URL in checkout
- [ ] Terms of Service live before first charge

---

*$9 and $18. Simple. Family-sized. No tricks.*
