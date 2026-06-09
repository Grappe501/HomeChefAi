# Terms Framework 1.0

**Status:** Legal framework — not published; requires attorney review before launch  
**Product:** HomeChef AI · Sous Chef  
**Date:** June 2026  
**Related:** `AI_USAGE_POLICY_1_0.md`, `PRICING_STRATEGY_1_0.md`

> **Disclaimer:** This is a product/legal architecture document, not legal advice. Have a licensed attorney review before publishing or charging customers.

---

## Document suite (publish at billing launch)

| Document | Purpose | URL (future) |
|----------|---------|--------------|
| **Terms of Service** | Core legal agreement | `/legal/terms` |
| **Privacy Policy** | Data collection, Supabase, OpenAI | `/legal/privacy` |
| **AI Usage Policy** | Fair use, credits, abuse | `/legal/ai-usage` |
| **Community Cookbook Policy** | Recipes, sharing, forks, co-authorship | `/legal/cookbook` |
| **Acceptable Use Policy** | General conduct | `/legal/aup` |

---

## 1. Terms of Service — outline

### 1.1 Agreement

- Binding agreement between user and HomeChef AI ("SousChef," "we," "us")
- By creating account or using service, user accepts Terms + Privacy + AI Usage Policy
- Must be 18+ or have parental consent

### 1.2 Service description

- Household food management platform: inventory, meal planning, AI assistant, Brain insights, cookbook, social features (as available)
- Service provided **as-is** with ongoing development; features may change
- Not a substitute for professional dietary, medical, or food safety advice

### 1.3 Accounts

- One person per account; household sharing via official invite mechanism
- User responsible for credential security
- Accurate registration information required

### 1.4 Subscription and billing (future)

- Tiers: Free, Plus ($9/mo), Family ($18/mo)
- Billing via Stripe; auto-renew unless cancelled
- Refund policy: TBD (recommend 7-day satisfaction for first paid month)
- Price changes: 30 days notice to existing subscribers

### 1.5 AI-assisted features

- Incorporated by reference: `AI_USAGE_POLICY_1_0.md`
- No guarantee of AI accuracy (allergies, expiration dates, nutrition — user verifies)
- AI credits and fair use limits apply by tier

### 1.6 User content

- User retains ownership of original recipes, photos, and content they create
- User grants SousChef a **non-exclusive, worldwide license** to host, display, and process content solely to operate the service
- Public/shared content governed by Community Cookbook Policy

### 1.7 Prohibited conduct

- Abuse of AI systems (see AI Usage Policy)
- Harassment in community features
- Uploading illegal content
- Reverse engineering, scraping, automated access without permission
- Misrepresenting recipe authorship

### 1.8 Termination

- User may delete account anytime
- We may suspend for Terms violation
- On termination: export window for user data (30 days recommended)

### 1.9 Limitation of liability

- Standard SaaS limitations (attorney to draft)
- Not liable for food spoilage, allergic reactions, or reliance on AI suggestions
- Maximum liability: amount paid in prior 12 months

### 1.10 Dispute resolution

- Governing law: TBD (user's state or Delaware — attorney decision)
- Arbitration clause: optional — attorney decision

### 1.11 Changes

- Material changes: 30 days notice via email
- Continued use = acceptance

---

## 2. Community Cookbook Policy — outline

*Required before Cookbook Social 1.0 ships publicly.*

### 2.1 Recipe ownership

- **Original creator** owns their original recipe content
- Display format: `[Recipe Name] by [Creator Name]` — attribution required
- Household name may display: `The Grappe Family`

### 2.2 License on share

When user marks recipe **public** or shares to community:

- User grants SousChef license to display within platform
- User grants other members license to **view, try, and fork** within platform
- User does **not** grant commercial rights outside platform without explicit opt-in

### 2.3 Forks and variations

- Fork creates new recipe node with lineage to parent
- Fork author owns their variation content
- **Original author retains credit** on all forks ("Adapted from Steve Grappe's Saturday Gumbo")
- Co-authors listed when variation credits parent author

### 2.4 Plate Score and "I Tried It"

- User feedback (tries, tweaks, ratings) is their content
- Aggregated Plate Score is platform-derived data
- Constructive variation notes may become public if user opts in

### 2.5 Recipe stories

- Optional narrative ("Grandpa taught me this…") — user owns, licenses as above
- Cultural / family stories are user content, not platform IP

### 2.6 Removal

- User may unpublish or delete their recipes
- Forks of deleted recipes: lineage preserved, link shows "[Recipe removed]"
- Platform may remove content violating AUP

### 2.7 Dinner club menus

- Shared menus within club visible to club members only
- Host owns menu composition; members own their contribution claims

---

## 3. Privacy Policy — key points (outline)

| Data | Storage | Shared with |
|------|---------|-------------|
| Account (email) | Supabase Auth | Not sold |
| Profile, preferences | Supabase Postgres | Not sold |
| Inventory, receipts | Supabase Postgres | Household members only |
| Receipt images | Truncated in DB; sent to OpenAI for OCR | OpenAI (processor) |
| AI prompts | OpenAI API | OpenAI (processor) |
| Usage / analytics | Future — minimal | Not sold |

- GDPR/CCPA: export and deletion on request (build before EU marketing)
- Cookies: Supabase session only initially
- Children's privacy: not directed at under-13; COPPA compliance if minors added

---

## 4. Acceptable Use Policy — summary

- Use for personal/household kitchen management
- No commercial resale of AI output
- No harassment, impersonation, spam in community
- No attempting to bypass AI credits or tier limits
- Report abuse: support@ (future email)

---

## 5. Implementation checklist (pre-billing)

| Item | Owner | Status |
|------|-------|--------|
| Attorney review | Legal | Not started |
| Privacy policy draft | Legal + Burt | Outline only |
| Terms draft | Legal | Outline only |
| AI policy publish | Product | Draft ready |
| Cookbook policy | Product | Draft ready |
| Cookie banner | Dev | Not needed until analytics |
| Checkout ToS checkbox | Dev | Blocked on Stripe |
| `/legal/*` routes | Marketing | Blocked on rebuild |

---

## 6. Recipe ownership — platform rules (product enforcement)

These become **product rules**, not just legal text:

```
1. Every public recipe MUST have creator display name
2. Forks MUST link to parent with attribution
3. Co-authors MUST appear on variation nodes
4. User cannot remove attribution from fork they didn't create
5. "Steve Grappe's Saturday Gumbo" is a display convention, not optional metadata
```

Schema already reserved: `creator_first_name`, `origin_recipe_id`, `recipe_variations.co_author_ids`.

---

*Legal follows product. Product follows ownership philosophy. Get attorney before first dollar.*
