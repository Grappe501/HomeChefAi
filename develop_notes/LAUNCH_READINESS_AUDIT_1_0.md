# Launch Readiness Audit 1.0

**Status:** Business architecture catch-up audit — June 2026  
**Purpose:** Green/yellow/red before paid launch, Brain 1.0B, or marketing spend  
**Related:** All `*_2_0.md` documents in `develop_notes/`

> **No feature work in this pass.** Audit reflects current production state.

---

## Legend

| Status | Meaning |
|--------|---------|
| 🟢 **Green** | Launch-ready or acceptable for beta |
| 🟡 **Yellow** | Gap identified — must resolve before charging money |
| 🔴 **Red** | Blocker — do not launch paid or market broadly |

---

## Audit matrix

| Area | Status | Notes |
|------|--------|-------|
| **Brand** | 🟢 | SousChef, Chef, Sous Chef locked. Brand Freeze 1.0 intact. |
| **Design** | 🟢 | Design System 1.1 shipped. Copper restraint applied. Command-center dashboard. |
| **Product — core** | 🟡 | Inventory, receipt, cook log, onboarding live. P0 auth/profile hotfix shipped — **re-verify smoke test**. |
| **Product — Brain 1.0A** | 🟡 | Built + deployed. **Acceptance test pending** (3 receipts, 5 cook logs, evidence UI). |
| **Product — Brain 1.0B** | ⚪ | Out of scope — do not build before paid launch decision. |
| **Marketing docs** | 🟢 | 2.0 suite complete (this pass). |
| **Marketing site** | 🔴 | `marketing/index.html` still HomeChef AI / meal planner. Rebuild required. |
| **App Store presence** | 🔴 | Not submitted. Assets not created. |
| **Pricing architecture** | 🟢 | $9 / $18 locked. PRICING_AND_USAGE_2_0 complete. |
| **AI credits framework** | 🟢 | AI_CREDITS_AND_FAIR_USE_2_0 complete. Not implemented in code. |
| **Terms & community** | 🟡 | TERMS_AND_COMMUNITY_RULES_2_0 draft ready. **Attorney review required.** |
| **Privacy** | 🟡 | PRIVACY_AND_DATA_POSITIONING_2_0 draft ready. Export/delete not built. |
| **Billing / Stripe** | 🔴 | Not integrated. `ENABLE_BILLING=false`. |
| **Support** | 🔴 | No support email, help center, or status page. |
| **Analytics** | 🔴 | No product analytics. Cannot measure conversion or retention. |
| **Email onboarding** | 🔴 | Sequence documented — not implemented. |
| **Compliance** | 🟡 | Supabase RLS live. DPA/GDPR flows not complete. |

---

## Must-have before charging money

| # | Item | Owner | Status |
|---|------|-------|--------|
| 1 | V3.1 phone smoke test pass (clean account) | Human | 🔴 Pending |
| 2 | Brain 1.0A acceptance test pass | Human + Product | 🔴 Pending |
| 3 | Attorney-reviewed Terms + Privacy | Legal | 🔴 Not started |
| 4 | `/legal/terms`, `/legal/privacy`, `/legal/ai-usage` live | Dev + Marketing | 🔴 Not built |
| 5 | Stripe integration + tier enforcement | Dev | 🔴 Not built |
| 6 | AI credits system in code | Dev | 🔴 Not built |
| 7 | Account deletion + data export (minimum viable) | Dev | 🔴 Not built |
| 8 | Support email + auto-reply | Ops | 🔴 Not set up |
| 9 | Marketing site rebuild (SousChef positioning) | Marketing | 🔴 Stale |
| 10 | Onboarding completes without 500 errors in prod | Dev | 🟡 Hotfix shipped — verify |

**Rule:** Do not enable `ENABLE_BILLING=true` until items 1–8 are green.

---

## Should-have before charging money

| # | Item | Status |
|---|------|--------|
| 1 | App Store / Play Store listing | 🔴 |
| 2 | Email onboarding sequence (5 emails) | 🔴 |
| 3 | Subtle usage meter in Settings | 🔴 |
| 4 | Pre-action credit confirmation | 🔴 |
| 5 | 5 beta Chef testimonials | 🔴 |
| 6 | Product analytics (privacy-respecting) | 🔴 |
| 7 | Refund policy published | 🟡 In docs, not live |
| 8 | Status page (e.g. Instatus) | 🔴 |

---

## Nice-to-have before charging money

| # | Item |
|---|------|
| 1 | Annual billing option |
| 2 | Referral program |
| 3 | Blog / SEO content |
| 4 | Press kit |
| 5 | Family tier dinner club marketing *(feature not shipped)* |

---

## Document audit (1.0 → 2.0)

| 1.0 Document | Superseded by | Action |
|--------------|---------------|--------|
| `MARKETING_REBUILD_1_0.md` | `MARKETING_REBUILD_2_0.md` | Keep 1.0 for history |
| `PRICING_STRATEGY_1_0.md` | `PRICING_AND_USAGE_2_0.md` | Keep 1.0 for history |
| `AI_USAGE_POLICY_1_0.md` | `AI_CREDITS_AND_FAIR_USE_2_0.md` | Keep 1.0 for history |
| `TERMS_FRAMEWORK_1_0.md` | `TERMS_AND_COMMUNITY_RULES_2_0.md` + `PRIVACY_AND_DATA_POSITIONING_2_0.md` | Keep 1.0 for history |
| `COMPETITIVE_POSITIONING_1_0.md` | `COMPETITIVE_MOAT_2_0.md` | Keep 1.0 for history |
| `BRAND_FREEZE_1_0.md` | — | Still authoritative for brand visual/naming |
| `BRAND_GUIDE_1_0.md` | — | Still authoritative |
| `DESIGN_SYSTEM_1_0.md` | — | Tokens applied in app (1.1 implementation) |
| `marketing/index.html` | — | 🔴 Must rebuild |

---

## Risk assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Onboarding 500 in production | **Critical** | Hotfix deployed — smoke test immediately |
| Marketing site misrepresents product | **High** | Block paid ads until site rebuild |
| Launch without attorney review | **High** | Budget legal review before Stripe |
| AI cost overrun at scale | **Medium** | Credit system + deterministic Brain |
| Brain insights feel wrong | **Medium** | Acceptance test + evidence UI |
| No analytics | **Medium** | Add minimal analytics before paid launch |
| Competitor copies receipt scan | **Low** | Moat is graph, not OCR |
| Brand confusion (HomeChef vs SousChef) | **Medium** | App fixed; marketing site + legal footer pending |

**Overall launch readiness: 🔴 NOT READY for paid launch**

**Overall readiness for continued beta: 🟡 CONDITIONAL** — if smoke test + Brain acceptance pass.

---

## Recommended path to first paying customer

**Timeline: 4–8 weeks after blockers cleared**

```
Week 1–2: Verify
├── V3.1 phone smoke test (clean account, full onboarding)
├── Brain 1.0A acceptance test
└── Fix any P0 bugs found

Week 2–3: Legal + compliance
├── Attorney review Terms, Privacy, AI policy
├── Publish /legal/* routes
└── Account deletion MVP

Week 3–5: Billing
├── Stripe products: Plus $9, Family $18
├── ai_credits table + monthly reset
├── Tier enforcement (feature flags)
├── Usage meter + pre-action credit UX
└── Checkout with ToS checkbox

Week 5–6: Marketing minimum
├── Rebuild marketing/index.html (SousChef positioning)
├── Support email live
└── 3 beta testimonials

Week 6–8: Soft launch
├── ENABLE_BILLING=true for new signups
├── Existing beta users: 30-day Plus trial → convert
├── Monitor: onboarding completion, credit usage, churn
└── First paying customer target: convert highest-engagement beta Chef
```

**First customer profile:** Busy family beta user who completed Brain loop, hit Free insight teaser, and received personal outreach.

---

## Recommended path to first 100 customers

**Timeline: 3–6 months after first paying customer**

| Phase | Focus | Channel |
|-------|-------|---------|
| **0–10** | Founder-led conversion of beta Chefs | Direct email, phone |
| **10–30** | App Store launch + word of mouth | Organic, family invites (Cook Together) |
| **30–60** | Content: "Your Kitchen Has A Memory" | SEO blog, local food communities |
| **60–100** | Testimonials + Brain screenshot marketing | Instagram/Pinterest (outcome metrics, not recipes) |

**Metrics to hit:**

- Onboarding completion >70%  
- D7 retention >40%  
- Free → Plus conversion >8% at 90 days  
- NPS >40 from first 50 users  

**Do not:** paid ads until marketing site green and churn understood.

---

## Recommended path to first 1,000 customers

**Timeline: 12–18 months after first 100**

| Milestone | Unlock |
|-----------|--------|
| Brain 1.0B shipped | Market recommendations truthfully |
| Cookbook Social shipped | Community + lineage network effects |
| App Store rating >4.5 | Paid acquisition becomes viable |
| CAC payback <6 months | Scale ad spend |

| Channel | Role |
|---------|------|
| **Organic / SEO** | "food waste app," "pantry tracker family" — long tail |
| **Cook Together virality** | Household invite = 1.5–2x viral coefficient target |
| **Local food / homesteader communities** | ICP 3 wedge |
| **Dinner club hosts** | Family tier anchor (post-Experience Engine) |
| **Partnerships** | Farmers markets, CSAs — align with local food values |

**Revenue at 1,000 customers (illustrative):**

| Mix | Calculation |
|-----|-------------|
| 700 Free | $0 |
| 220 Plus @ $9 | $1,980/mo |
| 80 Family @ $18 | $1,440/mo |
| **Total MRR** | **~$3,420** |

Blended ARPU ~$3.42 at this stage — expect ARPU to rise as Free converts.

---

## Immediate next actions (priority order)

1. **Human:** V3.1 smoke test on production (clean account)  
2. **Human:** Brain 1.0A acceptance test  
3. **Legal:** Engage attorney for Terms + Privacy review  
4. **Product:** Do NOT start Brain 1.0B until 1–2 green  
5. **Marketing:** Rebuild `marketing/index.html` when smoke test green  
6. **Dev:** Plan Stripe + credits sprint (separate from this doc pass)  

---

## Sign-off criteria for paid launch

All must be true:

- [ ] Smoke test green  
- [ ] Brain acceptance green  
- [ ] Attorney sign-off on legal suite  
- [ ] Stripe + credits live  
- [ ] Export + delete live  
- [ ] Marketing site shows SousChef positioning  
- [ ] Support channel live  
- [ ] No P0 bugs open  

**Until then:** Beta continues. Full access. No charge. Build memory.

---

*Business architecture caught up. Product must prove memory before we sell memory.*
