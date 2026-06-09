# Privacy & Data Positioning 2.0

**Status:** Consumer-facing philosophy + policy outline — attorney review required  
**Product:** SousChef · **Legal entity:** HomeChef AI  
**Date:** June 2026  
**Related:** `TERMS_AND_COMMUNITY_RULES_2_0.md`, `AI_CREDITS_AND_FAIR_USE_2_0.md`

> **Publish at:** `/legal/privacy` before first charge or EU marketing.

---

## Privacy philosophy (consumer-facing)

Use this language in marketing, app, and Privacy Policy preamble:

> **SousChef learns your kitchen — not to sell you, but to serve you.**

> We build a memory of how your household shops, cooks, and eats so you can waste less, cook with confidence, and preserve what matters.

> **We do not sell your household food data.**  
> **We do not sell your shopping habits.**  
> **We do not sell your family traditions.**

Your kitchen is yours. SousChef is the Sous Chef — not the data broker.

---

## What we collect (plain language)

| Category | Examples | Why |
|----------|----------|-----|
| **Account** | Email, password hash | Login, recovery |
| **Profile** | Name, dietary prefs, allergies, household size, zip | Personalize Sous Chef |
| **Kitchen identity** | Kitchen name, cooking level, priorities | Memory + onboarding |
| **Inventory** | Pantry items, quantities, locations, expiration | Core product |
| **Receipts** | Store, items, prices, parse results | Pantry automation |
| **Cook log** | Meals cooked, ingredients used | Brain + inventory |
| **Brain memories** | Patterns, insights, confidence scores | Kitchen Memory |
| **Household** | Members, invites, shared kitchen | Cook Together |
| **AI interactions** | Assistant messages, meal plans | Feature delivery |
| **Usage** | Feature usage, credit consumption | Fair use + product improvement |
| **Community** *(future)* | Public recipes, forks, stories | Social features |
| **Billing** | Stripe customer ID, tier | Subscriptions |

---

## What we do NOT do

| We do not | Detail |
|-----------|--------|
| Sell personal data | No data broker relationships |
| Sell shopping habits | Receipt data stays in your kitchen graph |
| Sell food preferences to advertisers | No ad network |
| Train public AI models on your data | OpenAI API: no training on API data |
| Share household data across households | RLS + invite-only |
| Require unnecessary data | Zip optional; minimal signup |

---

## Who processes data (sub-processors)

| Processor | Role | Data shared |
|-----------|------|-------------|
| **Supabase** | Database, auth, storage | All app data |
| **OpenAI** | Receipt OCR, assistant, planning | Images, prompts (ephemeral) |
| **Stripe** | Billing | Email, payment method |
| **Netlify** | Hosting, serverless functions | Request metadata |
| **Future: analytics** | Product analytics | Anonymized events only — TBD |

Sub-processor list maintained at `/legal/sub-processors`.

---

## Household & family data

- Inventory, Brain memories, and cook logs in a **household are visible to invited household members**  
- Each member has their own account  
- Household admin can remove members  
- Leaving household: member loses access to shared kitchen; personal account data retained  
- **Children:** Service not directed at under-13. Parental consent required for minors. COPPA compliance before marketing to families with children explicitly.

---

## AI & receipt processing

| Step | What happens |
|------|--------------|
| Receipt upload | Image sent to OpenAI for OCR |
| Parse result | Stored in Supabase (truncated image optional) |
| OpenAI retention | API data not used for model training (per OpenAI API terms) |
| Assistant | Prompt includes pantry/profile context tier-appropriate |
| Brain 1.0A | Deterministic — computed on our servers, no OpenAI |

User may use manual pantry entry to avoid receipt OCR entirely.

---

## Retention philosophy

| Data type | Retention | Deletion |
|-----------|-----------|----------|
| Account | Until deletion request | Full delete on request |
| Inventory | Until user deletes or account delete | Immediate on delete |
| Brain memories | Tier-based window (see PRICING) | Archive on downgrade; delete on account delete |
| Receipt images | User-controlled; storage tier limits | Deletable in app |
| AI logs | 90 days operational | Auto-purge |
| Billing records | 7 years (legal requirement) | Anonymized after |
| Backups | 30 days rolling | Purged with primary delete |

**Philosophy:** Keep what serves the kitchen memory. Delete what doesn't. Never hoard for resale.

---

## Deletion policy

**User-initiated account deletion:**

1. Confirm via email or in-app  
2. 7-day grace period (cancel restore)  
3. Permanent deletion of personal data from primary DB  
4. Backups purged within 30 days  
5. Billing history anonymized per legal requirements  
6. Public community content: unpublished; attribution may remain on forks as "[Deleted user]"  

**We do not delete as punishment** without export opportunity except severe abuse (illegal content).

---

## Export policy

**Before billing launch:** manual export on request (support email).

**At billing launch:**

- Settings → Export My Kitchen  
- JSON bundle: profile, inventory, recipes, cook logs, Brain memories, meal plans  
- Receipt images: optional zip  
- Delivered via download link, expires 7 days  
- GDPR / CCPA: fulfill within 30 days  

**Portability philosophy:** Your kitchen should never be a trap.

---

## Security

- Supabase Row Level Security on all user tables  
- HTTPS everywhere  
- Auth tokens in secure session  
- Founder/admin tools: `FOUNDER_EMAILS` env gate  
- No production secrets in client bundle  
- Incident response: notify affected users within 72 hours of confirmed breach  

---

## Cookies & tracking

| Current | Future |
|---------|--------|
| Supabase session cookie only | Same + optional analytics |
| No third-party ad cookies | Never for ads |
| No Facebook pixel at launch | Evaluate post-launch |

Cookie banner required if analytics added or EU traffic significant.

---

## Regional compliance

| Regulation | Status |
|------------|--------|
| US state privacy (CCPA/CPRA) | Export + delete before CA marketing |
| GDPR | Export + delete + DPA with Supabase before EU |
| COPPA | No under-13; parental flow before kid features |

---

## Consumer-facing FAQ snippets

**Does SousChef sell my data?**  
No. We do not sell household food data, shopping habits, or personal information.

**Who sees my pantry?**  
You and household members you invite. Not other SousChef users.

**What does OpenAI see?**  
Receipt images and assistant prompts when you use those features. Not your full database.

**Can I delete everything?**  
Yes. Account deletion removes your kitchen data. Export first if you want a copy.

**Does SousChef work without AI?**  
Yes. Manual inventory, cook log, and lists always work.

---

## Audit of Privacy in Terms Framework 1.0

| Item | 1.0 | 2.0 |
|------|-----|-----|
| Data table | Basic | ✅ Expanded categories |
| Consumer philosophy | Missing | ✅ Added |
| Retention | Vague | ✅ Tier + deletion matrix |
| Export | Mentioned | ✅ Product spec |
| Brain 1.0A deterministic | N/A | ✅ Clarified no OpenAI |
| Sub-processors | Partial | ✅ Full list |

---

## Pre-launch checklist

- [ ] Attorney-reviewed Privacy Policy  
- [ ] `/legal/privacy` route  
- [ ] Export My Kitchen feature  
- [ ] Account deletion flow  
- [ ] Supabase DPA signed  
- [ ] OpenAI DPA / enterprise terms if scale requires  
- [ ] Cookie policy if analytics added  

---

*Your kitchen. Your memory. Your data.*
