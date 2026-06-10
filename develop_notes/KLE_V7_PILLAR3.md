# Kitchen Learning Engine v7 — Pillar 3

**Status:** Shipped  
**Version:** 7.3.0

## Pillar 3 — Skill & Growth Learner

Closes the skill loop: cook logs and journey progress write back to a household skill model that feeds coaching, planner, and Clara.

### Features

| Feature | Surface | Credits |
|---------|---------|---------|
| `get_skill_profile` agent tool | Clara agent loop | 0 |
| `skill_coach` uses per-technique comfort | Clara + Cook Log | 0 |
| `skill_profile` on profiles | Brain / planner / Clara context | 0 |
| Growth nudges | Dashboard | 0 |
| Auto-refresh on cook log + meal rating | Backend hooks | 0 |

### Inferred signals

- **Strong techniques** — practiced ≥3 times
- **Building techniques** — 1–2 practices, next-focus candidate
- **Stretch edges** — techniques linked to `too_hard` meal ratings
- **Milestones** — first roux/braise/emulsion, comfortable sauté, ten techniques
- **Overall confidence** — blended from top techniques + onboarding self-assessment

### API

- `GET /.netlify/functions/learning?action=skills`
- `GET /.netlify/functions/learning?action=full` — taste + rhythm + skills bundle
- `POST learning` — `refresh-skills` (also refreshes on `rate-meal`)

### Migration

`20260610230000_skill_learning_v7.sql` — `profiles.skill_profile` JSONB.

Builds on existing `skill_journey_progress` table and `usage_logs.technique_ids`.

### Next pillars (v7.x)

- Pillar 4: Household Identity Learner — **shipped in v7.4.0** (`KLE_V7_PILLAR4.md`)
- Pillar 5: Outcome & Success Learner
- Pillar 6: Proactive Experience Orchestrator
