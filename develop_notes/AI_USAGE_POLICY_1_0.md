# AI Usage Policy 1.0

**Status:** Policy framework — publish at billing launch  
**Product:** HomeChef AI (Sous Chef)  
**Date:** June 2026  
**Related:** `PRICING_STRATEGY_1_0.md`, `TERMS_FRAMEWORK_1_0.md`

---

## Purpose

Define how AI-assisted features work, what "fair use" means, and how we protect service reliability without disabling core product functionality.

**This is a business risk document.** AI cost is the primary variable expense. Abuse is the primary scaling risk.

---

## Core principle

> **Never limit core functionality. Limit premium AI actions only.**

### Always available (all tiers, unlimited)

- Inventory viewing, editing, manual entry
- Pantry wizard (manual tap-to-add)
- Cook log and inventory subtraction
- Saved recipes and cookbook (personal)
- Manual grocery and household lists
- Brain **deterministic** insights (statistics — cheap)
- Account, settings, household membership
- Gamification XP

### Subject to AI credits / fair use

- Receipt OCR (OpenAI vision)
- AI meal planning (multi-day)
- Complex assistant reasoning
- Dinner party / experience generation
- Flavor reasoning and creativity modes
- LLM phrasing of Brain insights (optional layer)

---

## Public-facing language (use everywhere)

**Do NOT say:**

> Unlimited AI  
> Unlimited GPT access  
> Infinite meal plans

**DO say:**

> AI-assisted features are included with your plan and subject to reasonable fair-use limits designed to ensure reliable service for all members.

> Your pantry, recipes, and kitchen data always work — even if you've reached your AI-assisted planning limit for the month.

---

## AI credit system (summary)

Monthly pools by tier:

| Tier | Credits/month | Approx. equivalent |
|------|---------------|-------------------|
| Free | 30 | ~30 receipt scans |
| Plus ($9) | 150 | Heavy family use |
| Family ($18) | 300 | Hosting + clubs |

Credit costs — see `PRICING_STRATEGY_1_0.md`.

Credits reset on billing cycle date. Unused credits do not roll over (unless we add rollover as Family perk later).

---

## Fair use definition

**Fair use** means AI-assisted features used for personal or household kitchen management in good faith.

### Permitted

- Scanning your household's grocery receipts
- Planning meals for your family
- Asking the sous chef cooking questions
- Generating dinner party menus for personal entertaining
- Dinner club coordination for your club members

### Not permitted (abuse)

| Abuse type | Example |
|------------|---------|
| **Automation / bots** | Scripting API calls, headless receipt spam |
| **Scraping** | Bulk receipt upload to extract pricing data |
| **Reselling** | Using SousChef AI output for commercial meal-planning services |
| **Credential sharing** | One paid account serving unrelated households |
| **Prompt flooding** | Rapid-fire assistant calls to burn credits or stress systems |
| **Circumvention** | Creating multiple free accounts to avoid limits |

---

## Enforcement ladder

| Stage | Action |
|-------|--------|
| 1. Soft limit | User sees credit usage info + upgrade prompt |
| 2. Credit exhausted | AI actions pause; core app continues |
| 3. Abuse detected | Warning email + temporary AI suspension |
| 4. Repeat abuse | Account suspension; data export offered |
| 5. Severe abuse | Termination per Terms of Service |

**Never** delete user inventory or recipes as punishment.

---

## Rate limits (technical, all tiers)

Independent of credits — DDoS / abuse protection:

| Endpoint | Limit |
|----------|-------|
| Receipt scan | 10/hour/user |
| Assistant message | 30/hour/user |
| Meal plan generate | 5/hour/user |
| Auth attempts | Standard Supabase limits |

---

## Data and AI processing

- Receipt images: processed via OpenAI API; truncated storage in DB
- Prompts may include pantry list, profile, Brain memories (tier-dependent)
- We do not sell prompt data to third parties
- Users can request data export (future GDPR/CCPA compliance)

---

## Model assumptions

| Use case | Model (current) | May change |
|----------|-----------------|------------|
| Receipt OCR | gpt-4o-mini vision | Yes — cost optimization |
| Meal planning | gpt-4o-mini | Yes |
| Assistant | gpt-4o-mini | Yes |

Policy applies to **AI-assisted features**, not a specific model. We may swap models to control costs without notice (with quality parity goal).

---

## Deterministic vs AI Brain

**Important distinction for cost control:**

| Brain feature | Type | Credits |
|---------------|------|---------|
| Consumption rate ("milk every 7 days") | Deterministic math | 0 |
| Waste detection | Rule-based | 0 |
| Meal cadence | Statistics | 0 |
| Insight phrasing ("Your family loves Cajun") | Optional LLM | 1 |
| Recommendation engine v2 | Hybrid | 1–2 |

Brain 1.0A is **deterministic first** — aligns with this policy.

---

## Transparency commitments

At billing launch, users see:

1. Current tier and credit balance (not anxiety-inducing — subtle meter)
2. What costs credits before action ("This scan uses 1 AI credit")
3. Link to full AI Usage Policy
4. Clear renewal date

---

## Contractual placement

This policy is incorporated by reference into Terms of Service § AI-Assisted Features.

Users accept on:

- Account creation (checkbox)
- First AI action (implicit, with link)
- Upgrade to paid tier (explicit at checkout)

---

## Review schedule

| Trigger | Action |
|---------|--------|
| OpenAI price change >20% | Review credit costs |
| Abuse incident | Update enforcement section |
| New AI feature | Assign credit cost before ship |
| Annual | Full policy review |

---

*Protect the service. Never hold the kitchen hostage.*
