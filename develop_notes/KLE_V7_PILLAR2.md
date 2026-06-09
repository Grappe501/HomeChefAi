# Kitchen Learning Engine v7 — Pillar 2

**Status:** Shipped  
**Version:** 7.2.0

## Pillar 2 — Behavior & Rhythm Learner

Infers household cooking rhythm from cook logs, receipts, and meal outcomes — then feeds planner, Clara, and dashboard nudges.

### Features

| Feature | Surface | Credits |
|---------|---------|---------|
| `get_kitchen_rhythm` agent tool | Clara agent loop | 0 |
| `behavior_profile` on profiles | Brain / planner / Clara context | 0 |
| Rhythm nudges | Dashboard | 0 |
| Auto-refresh on cook log + receipt verify | Backend hooks | 0 |
| Time budget override | Learning API | 0 |

### Inferred signals

- **Cook nights** — days with ≥18% of recent cook logs
- **Shop day** — most common verified receipt weekday
- **Leftover style** — batch cooker vs cook fresh from log patterns
- **Budget band** — weekly grocery spend range from receipts
- **Time budget** — weeknight max minutes (from outcomes + ledger + user override)

### API

- `GET /.netlify/functions/learning?action=rhythm`
- `GET /.netlify/functions/learning?action=full` — taste + rhythm bundle
- `POST learning` — `refresh-rhythm`, `set-time-budget` (also refreshes on `rate-meal`)

### Migration

`20260610220000_behavior_learning_v7.sql` — `profiles.behavior_profile` JSONB.

### Next pillars (v7.x)

- Pillar 3: Skill & Growth Learner
- Pillar 4: Household Identity Learner
- Pillar 5: Outcome & Success Learner
- Pillar 6: Proactive Experience Orchestrator
