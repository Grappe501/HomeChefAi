# Kitchen Learning Engine v7 — Pillar 4

**Status:** Shipped  
**Version:** 7.4.0

## Pillar 4 — Household Identity Learner

Unifies graph-based cooking style with KLE taste, rhythm, and skill signals into one household identity model.

### Features

| Feature | Surface | Credits |
|---------|---------|---------|
| `get_household_identity` agent tool | Clara agent loop | 0 |
| `identity_profile` on profiles | Brain / planner / Clara context | 0 |
| Syncs `kitchen_identity` + `inferred_cooking_style` | Brain compatibility | 0 |
| Identity nudges | Dashboard | 0 |
| Auto-refresh on cook log, receipt verify, meal rating | Backend hooks | 0 |

### Inferred signals

- **Primary/secondary style** — from household graph + cuisine preferences
- **Archetype label** — e.g. "Southern comfort · batch-cook · family kitchen"
- **Taste identity** — spicy-forward, comfort-food, kid-friendly, etc.
- **Rhythm identity** — batch-cook, shop day, cook nights
- **Skill level** — overall confidence from skill profile
- **Priorities & cooks_with** — from onboarding culinary profile

### API

- `GET /.netlify/functions/learning?action=identity`
- `GET /.netlify/functions/learning?action=full` — all four KLE pillars
- `POST learning` — `refresh-identity`

### Migration

`20260610240000_identity_learning_v7.sql` — `profiles.identity_profile` JSONB.

### Next pillars (v7.x)

- Pillar 5: Outcome & Success Learner
- Pillar 6: Proactive Experience Orchestrator
