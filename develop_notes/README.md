# develop_notes — Business & Brand Architecture Index

**Status:** 🔒 **Brand Freeze 1.0** — see [BRAND_FREEZE_1_0.md](./BRAND_FREEZE_1_0.md)

**Next product work:** Brain 1.0A — after V3.1 phone smoke test.

---

## Business documents

| File | Contents |
|------|----------|
| [MARKETING_REBUILD_1_0.md](./MARKETING_REBUILD_1_0.md) | Positioning, ICPs, pillars, launch messaging |
| [PRICING_STRATEGY_1_0.md](./PRICING_STRATEGY_1_0.md) | **Free · Plus $9 · Family $18**, AI credits, tier limits |
| [AI_USAGE_POLICY_1_0.md](./AI_USAGE_POLICY_1_0.md) | Fair use, abuse, never brick core functionality |
| [TERMS_FRAMEWORK_1_0.md](./TERMS_FRAMEWORK_1_0.md) | ToS, cookbook policy, privacy outline, recipe ownership |
| [COMPETITIVE_POSITIONING_1_0.md](./COMPETITIVE_POSITIONING_1_0.md) | Landscape, moats, matrix, GTM wedge |

## Brand & design documents (🔒 frozen)

| File | Contents |
|------|----------|
| [BRAND_FREEZE_1_0.md](./BRAND_FREEZE_1_0.md) | **Freeze declaration** · Promise · Product pyramid · next steps |
| [HOUSEHOLD_FOOD_GRAPH_1_0.md](./HOUSEHOLD_FOOD_GRAPH_1_0.md) | Master model — nodes, edges, memories |
| [BRAND_GUIDE_1_0.md](./BRAND_GUIDE_1_0.md) | SousChef · Chef · Sous Chef · Promise · pyramid |
| [DESIGN_SYSTEM_1_0.md](./DESIGN_SYSTEM_1_0.md) | Tokens, typography, cards, buttons |
| [LOGO_CONCEPTS_1_0.md](./LOGO_CONCEPTS_1_0.md) | Toque + bubble primary |
| [MARKETING_SITE_ARCHITECTURE_1_0.md](./MARKETING_SITE_ARCHITECTURE_1_0.md) | Page specs, hero, rebuild phases |

---

## Related product docs

| File | Contents |
|------|----------|
| [../docs/NORTH_STAR.md](../docs/NORTH_STAR.md) | Product vision, engine stack, build order |
| [../docs/BRAIN_1_0A_SPEC.md](../docs/BRAIN_1_0A_SPEC.md) | **Next build** — acceptance test, explainability, scope |

---

## Locked (Brand Freeze 1.0)

| Decision | Value |
|----------|-------|
| Product | **SousChef** |
| User | **Chef** |
| Assistant | **Sous Chef** (default Clara, renameable) |
| Relationship | Chef leads · Sous Chef supports |
| Headline | **Your Kitchen Has A Memory.** |
| Promise | 7 feature gates — see BRAND_FREEZE |
| Pyramid | Foundation → Memory → Intelligence → Growth → Connection → Legacy |
| Plus / Family | **$9 / $18** |
| Master model | Household Food Graph |
| Freeze until | Brain 1.0B ships |

---

## Build order

```
✅ V3.1 Hardening
✅ Business + brand architecture (frozen)
✅ Household Food Graph
→ V3.1 phone smoke test
→ Brain 1.0A          ← BUILT (deploy + acceptance test)
→ Brain 1.0B
→ Brand unfreeze + marketing rebuild
→ Billing
```

> Now it's time to teach SousChef how to remember.

---

*Brand Freeze 1.0 · June 2026*
