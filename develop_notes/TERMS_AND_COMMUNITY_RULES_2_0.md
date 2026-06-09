# Terms & Community Rules 2.0

**Status:** Legal framework — requires attorney review before publish or first charge  
**Product:** SousChef · **Legal entity:** HomeChef AI  
**Date:** June 2026  
**Supersedes:** `TERMS_FRAMEWORK_1_0.md` (community + terms sections)  
**Related:** `AI_CREDITS_AND_FAIR_USE_2_0.md`, `PRIVACY_AND_DATA_POSITIONING_2_0.md`

> **Disclaimer:** Product/legal architecture, not legal advice. Licensed attorney review required before charging customers.

---

## Document suite (publish at billing launch)

| Document | URL | Status |
|----------|-----|--------|
| Terms of Service | `/legal/terms` | Draft outline |
| Privacy Policy | `/legal/privacy` | See PRIVACY_AND_DATA_POSITIONING_2_0 |
| AI Usage Policy | `/legal/ai-usage` | Draft ready |
| Community & Cookbook Rules | `/legal/community` | Draft outline |
| Acceptable Use Policy | `/legal/aup` | Merged into Terms + Community |

---

## 1. Terms of Service — outline

### 1.1 Agreement

- Binding agreement between user and **HomeChef AI**, operating the **SousChef** service ("we," "us")  
- User accepts Terms + Privacy + AI Usage Policy at account creation  
- Age 18+ or verifiable parental consent  
- Consumer-facing name is always **SousChef**; **HomeChef AI** appears in legal footer and app store seller field only  

### 1.2 Service description

SousChef is a **Household Food Operating System** providing, as available:

- Inventory and receipt management  
- Kitchen Memory (Brain insights)  
- AI-assisted meal planning and Sous Chef assistant  
- Cook Together household coordination  
- Community cookbook and dinner club features *(as shipped)*  

Service evolves; features may be added, changed, or retired with notice. Not medical, dietary, or food safety advice — **Chef verifies** allergies and expiration.

### 1.3 Accounts

- One account per person  
- Household sharing via official invite only  
- User responsible for credential security  
- Accurate registration information  

### 1.4 Subscriptions & billing

| Tier | Price |
|------|-------|
| Free | $0 |
| Plus | $9/month |
| Family | $18/month |

- Billing via Stripe; auto-renew until cancelled  
- **Refund:** 7-day satisfaction on first paid month (recommendation)  
- Price changes: 30 days notice to active subscribers  
- Downgrade: core kitchen data preserved; tier limits apply — see PRICING_AND_USAGE_2_0  
- **No surprise AI overage charges** without explicit opt-in purchase  

### 1.5 AI-assisted features

- Incorporated by reference: `AI_CREDITS_AND_FAIR_USE_2_0.md`  
- No guarantee of AI accuracy  
- Credits and fair use apply by tier  
- Core functionality continues when credits exhausted  

### 1.6 User content & ownership

**User retains ownership** of original content they create:

- Original recipes and variations  
- Photos and notes  
- Recipe stories and family narratives  
- Cook log entries  
- Community posts and swap listings  

**License to SousChef:** non-exclusive, worldwide, royalty-free license to host, process, display, and backup user content **solely to operate the service**.

**Public content:** additional rules in Community Rules §2.

### 1.7 Prohibited conduct

- AI abuse (see AI policy)  
- Harassment, hate speech, impersonation  
- Illegal content  
- Scraping, reverse engineering, unauthorized automation  
- Misrepresenting recipe authorship  
- Circumventing tier limits or credits  
- Commercial resale of AI output without written permission  

### 1.8 Termination

- User may delete account anytime  
- We may suspend for Terms violation  
- **30-day export window** after termination  
- Inventory and recipes not deleted as punishment — export first  

### 1.9 Liability

- Standard SaaS limitations (attorney draft)  
- Not liable for food spoilage, allergic reactions, illness from AI suggestions  
- Cap: fees paid in prior 12 months  

### 1.10 Disputes & changes

- Governing law: TBD (attorney)  
- Material changes: 30 days email notice  

---

## 2. Community & Cookbook Rules

*Required before Cookbook Social public launch. Partial rules apply to Neighbor Swap today.*

### 2.1 Recipe ownership

| Rule | Detail |
|------|--------|
| **Creator owns original** | User who authored original recipe owns their expression |
| **Attribution required** | Public display: `[Recipe Name] by [Creator Name]` |
| **Kitchen name optional** | `The Grappe Family Kitchen` may display |
| **Platform does not claim recipes** | SousChef hosts; does not acquire copyright |

### 2.2 Sharing & license

When user marks recipe **public** or shares to community:

- SousChef may display within platform  
- Other members may **view, try, and fork** within platform  
- **No commercial rights** outside platform without explicit opt-in  
- User may unpublish anytime  

### 2.3 Forks & variations

```
Original: Steve Grappe's Saturday Gumbo
    └── Fork: Sarah's Smokier Version (by Sarah Grappe)
            └── Fork: Holiday Batch (by Sarah Grappe + Mom)
```

| Rule | Enforcement |
|------|-------------|
| Fork creates new node with lineage | Schema: `origin_recipe_id` |
| Fork author owns variation content | |
| **Original author credit preserved** on all forks | Cannot strip attribution |
| Co-authors listed when credited | `co_author_ids` |
| Display: "Adapted from [Original] by [Author]" | Product rule, not optional metadata |

### 2.4 Plate Score & "I Tried It"

- User feedback is user content  
- Aggregated Plate Score is platform-derived metric  
- Constructive variation notes public only if user opts in  

### 2.5 Recipe stories & culture memory

- Narrative content ("Grandpa taught me…") — user owns  
- Licensed to platform for display as above  
- Not platform IP  

### 2.6 Removal & disputes

| Scenario | Action |
|----------|--------|
| User unpublishes | Hidden from community; forks retain lineage link "[Recipe removed]" |
| User deletes account | Recipes unpublished; 30-day export |
| Copyright complaint | DMCA process (attorney draft) |
| AUP violation | Platform may remove without deleting user's private copies |

### 2.7 Dinner clubs & households

| Entity | Visibility | Ownership |
|--------|------------|-------------|
| **Household** | Invited members only | Shared pantry, Brain, settings |
| **Dinner club** | Club members only | Host owns menu; members own contributions |
| **Neighbor swap** | Zip-scoped listings | Poster owns post content |

Household admin may remove members. Club host may remove members. No cross-household data access without invite.

### 2.8 Community behavior

**Expectations:**

- Respectful, constructive feedback  
- Accurate attribution  
- No spam, scams, or off-platform commercial solicitation  
- Report abuse: support@souschef.app *(future)*  

**Prohibited:**

- Harassment, discrimination  
- Fake attribution or plagiarism  
- Posting others' private recipes without permission  
- AI-generated spam recipes for manipulation  

---

## 3. Product enforcement rules

These become **code constraints**, not just legal text:

```
1. Every public recipe MUST have creator display name
2. Forks MUST link to parent with attribution
3. Co-authors MUST appear on variation nodes when credited
4. User cannot remove another author's attribution from a fork
5. Household invite requires accepting member consent
6. Swap posts must include zip code — no exact address in public fields
7. Brain insights must show evidence — no black-box claims in UI
```

Schema reserved: `creator_first_name`, `origin_recipe_id`, `recipe_variations.co_author_ids`, `profiles.household_display_name`.

---

## 4. Audit of Terms Framework 1.0

| Section | 1.0 | 2.0 update |
|---------|-----|------------|
| ToS outline | ✅ | ✅ Billing + downgrade clarity |
| Cookbook policy | ✅ | ✅ Fork diagram + enforcement |
| Dinner clubs | Brief | ✅ Expanded |
| Households | Brief | ✅ Expanded |
| Neighbor swap | Missing | ✅ Added |
| Brain explainability | Missing | ✅ Product rule #7 |
| Attorney review | Not started | Still required |

---

## 5. Pre-billing checklist

| Item | Owner | Status |
|------|-------|--------|
| Attorney review full suite | Legal | 🔴 Not started |
| `/legal/*` routes | Dev | 🔴 Not built |
| Checkout ToS + Privacy checkbox | Dev | 🔴 Blocked on Stripe |
| Community rules link in share flow | Dev | 🔴 Blocked on Cookbook |
| DMCA agent registration | Legal | 🔴 If public cookbook |

---

*Legal follows product. Ownership follows respect for Chef and creator.*
