# AI Credits & Fair Use 2.0

**Status:** Launch-ready policy — supersedes `AI_USAGE_POLICY_1_0.md`  
**Product:** SousChef (HomeChef AI legal entity)  
**Date:** June 2026  
**Related:** `PRICING_AND_USAGE_2_0.md`, `TERMS_AND_COMMUNITY_RULES_2_0.md`

> **Publish at:** `/legal/ai-usage` before first paid charge. Incorporated by reference in Terms.

---

## Purpose

Define exact AI usage rules so that:

- Variable OpenAI cost stays predictable  
- Abuse cannot destabilize the service  
- **No surprise bills**  
- **No hidden charges**  
- **No broken kitchens**

---

## Core principle

> **Never limit core functionality. Limit premium AI actions only.**

When credits are exhausted, the kitchen keeps working. Only AI-assisted generation pauses.

---

## Public-facing language

**Never say:**

- Unlimited AI  
- Unlimited GPT  
- Infinite meal plans  
- No usage limits  

**Always say:**

> AI-assisted features are included with your plan and subject to fair-use limits designed to keep the service reliable for every kitchen.

> Your pantry, recipes, grocery lists, and kitchen data always work — even when you've reached your AI-assisted limit for the month.

---

## Monthly credit pools

| Tier | Credits/month | Resets |
|------|---------------|--------|
| Free | 30 | Calendar month (UTC) or billing anchor |
| Plus ($9) | 150 | Billing cycle date |
| Family ($18) | 300 | Billing cycle date |

Unused credits **do not roll over** (Family rollover perk — evaluate at 1,000 customers).

---

## Credit cost table (exact)

| Action | Credits | Tier | Notes |
|--------|---------|------|-------|
| **Receipt parsing (OCR)** | 1 | All | Per receipt image/batch |
| **Assistant — basic reply** | 0 | All | Pantry lookup, simple Q&A |
| **Assistant — complex reasoning** | 1 | All | Multi-step planning, substitution chains |
| **Meal plan — up to 3 days** | 1 | All | |
| **Meal plan — 4–7 days** | 2 | All | |
| **Meal plan — 8+ days** | 3 | Plus+ | |
| **"What can I make tonight?"** | 1 | All | Uses inventory context |
| **Brain insight — view / query** | 0 | All | Reading memories is free |
| **Brain insight — deterministic generation** | 0 | All | Brain 1.0A math — no OpenAI |
| **Brain insight — LLM phrasing layer** | 1 | Plus+ | Optional; off by default in 1.0A |
| **Advanced planning (budget + constraints)** | 2 | Plus+ | |
| **Dinner party / experience plan** | 5 | Family | When Experience Engine ships |
| **Flavor reasoning / creativity mode** | 1 | Plus+ | Future |
| **Leftover masterpiece generation** | 1 | Plus+ | Future |
| **Future: photo of fridge/pantry** | 2 | Plus+ | Image analysis |
| **Future: recipe import from photo** | 2 | Plus+ | |
| **Future: Brain 1.0B recommendation batch** | 1 | Plus+ | Per generation run |

**Normal family use:** 150 credits/month is designed to be invisible. Power users hit ceiling → upgrade, not overage.

---

## Soft limits (before hard credit stop)

| Threshold | Behavior |
|-----------|----------|
| 50% used | No UI (avoid anxiety) |
| 80% used | Single subtle banner in Settings: "AI credits running low" |
| 100% used | Pre-action block on credit actions only + clear message |
| 100% + retry | Same message — no charge, no overage auto-bill |

---

## Overage strategy

| Option | Decision |
|--------|----------|
| Auto overage billing | **NO** — ever, without explicit opt-in |
| Credit packs ($5 for 50) | **Maybe** — post-1,000 customers, evaluate |
| Wait for reset | **Default** |
| Upgrade tier | **Primary CTA** |

**No surprise bills.** If credit packs launch later, require explicit purchase — never silent overage.

---

## System behavior when credits exhausted

| Feature | Behavior |
|---------|----------|
| View inventory | ✅ Works |
| Manual pantry add | ✅ Works |
| Pantry wizard | ✅ Works |
| Cook log | ✅ Works |
| View recipes / cookbook | ✅ Works |
| Manual grocery list | ✅ Works |
| View existing Brain insights | ✅ Works |
| New Brain deterministic sync | ✅ Works (0 credits) |
| Receipt scan | ⏸ Blocked — offer manual entry |
| AI meal plan | ⏸ Blocked — offer manual plan |
| Complex assistant query | ⏸ Blocked — basic replies still 0 credit if possible |

**Message template:**

> You've used your AI credits for [Month]. Your kitchen data is safe and fully accessible. Credits refresh on [date]. [Upgrade to Plus] or continue with manual entry.

---

## Rate limits (technical — all tiers)

Independent of credits. Abuse protection only.

| Endpoint | Limit |
|----------|-------|
| Receipt scan | 10/hour/user |
| Assistant message | 30/hour/user |
| Meal plan generate | 5/hour/user |
| Brain sync trigger | 20/hour/user |
| Auth | Supabase defaults |

429 response with retry-after — never account termination for rate limit alone.

---

## Abuse prevention

### Permitted use

- Personal or household kitchen management  
- Receipt scanning for your family's groceries  
- Meal planning for your household  
- Dinner club coordination for your members *(future)*  
- Reasonable assistant conversation  

### Prohibited use

| Type | Example | Response |
|------|---------|----------|
| Automation / bots | Scripting API, headless spam | Stage 3–5 enforcement |
| Scraping | Bulk receipt upload for price data | Suspension |
| Reselling | Commercial meal-planning service using SousChef | Termination |
| Credential sharing | One paid account, unrelated households | Warning → suspension |
| Prompt flooding | Rapid assistant calls | Rate limit → suspension |
| Circumvention | Multiple free accounts | Merge or block |
| Jailbreak / harmful content | Standard OpenAI AUP violations | Log + suspend |

---

## Enforcement ladder

| Stage | Action | Data impact |
|-------|--------|-------------|
| 1 | Credit info + upgrade prompt | None |
| 2 | AI actions paused | None — core app works |
| 3 | Warning email + 24h AI suspension | None |
| 4 | Account suspension | Export offered |
| 5 | Termination per Terms | 30-day export window |

**Never** delete inventory, recipes, or Brain memories as punishment.

---

## Deterministic vs AI Brain (Brain 1.0A alignment)

| Feature | Engine | Credits |
|---------|--------|---------|
| Consumption cycle ("milk every 8 days") | Deterministic | 0 |
| Waste detection | Rule-based | 0 |
| Habit / day-of-week patterns | Statistics | 0 |
| Archetype matching | JSON rules | 0 |
| Insight display / evidence expand | Client + DB | 0 |
| Optional prose polish | OpenAI | 1 |

Brain 1.0B recommendations will be **hybrid** — graph-first, LLM-second. Assign credit cost before ship.

---

## Data processing disclosure

| Data sent to OpenAI | Purpose | Retention |
|-------------------|---------|-----------|
| Receipt images | OCR parse | Not stored by OpenAI (API) |
| Assistant prompts | Reply generation | Not used for training (API) |
| Meal plan context | Generation | Ephemeral per request |

We do **not** sell prompts or household food data to third parties.

Sub-processors: OpenAI (AI), Supabase (database/auth), Stripe (billing), Netlify (hosting).

---

## Transparency at billing launch

Users must see:

1. Current tier and credit balance (Settings)  
2. Credit cost **before** action ("Uses 1 credit")  
3. Renewal / reset date  
4. Link to full AI Usage Policy  
5. What still works when credits are out  

---

## Contractual placement

- Terms of Service § AI-Assisted Features  
- Checkout checkbox on first paid conversion  
- Account creation: link + implicit acceptance  
- Material policy changes: 30 days email notice  

---

## Review triggers

| Event | Action |
|-------|--------|
| OpenAI price change >20% | Recompute credit costs |
| New AI feature | Assign credit cost before ship |
| Abuse incident | Update enforcement table |
| 1,000 paying customers | Evaluate credit pack + rollover |
| Annual | Full policy review + attorney check |

---

## Audit of AI Usage Policy 1.0

| Item | 1.0 | 2.0 |
|------|-----|-----|
| Core principle | ✅ | ✅ Reinforced |
| Credit pools | ✅ | ✅ Unchanged |
| Brain 1.0A deterministic free | Stated | ✅ Explicit table |
| Overage | Vague | ✅ No auto-bill locked |
| Image analysis | Not listed | ✅ Future rows |
| Brain 1.0B | Not listed | ✅ Placeholder row |
| Exhaustion behavior | Good/bad examples | ✅ Feature matrix |

---

*Protect the service. Never hold the kitchen hostage.*
