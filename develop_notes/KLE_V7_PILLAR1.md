# Kitchen Learning Engine v7 — Pillar 1

**Status:** Shipped (foundation)  
**Version:** 7.0.0

## Pillar 1 — Taste & Preference Learner

Closes the learning loop: preferences and meal ratings write back to the household model and feed every AI surface.

### Features

| Feature | Surface | Credits |
|---------|---------|---------|
| `get_taste_profile` agent tool | Clara agent loop | 0 |
| `remember_preference` agent tool | Clara → confirm card | 0 save |
| Post-cook meal ratings | Cook Log | 0 |
| `taste_profile` on profiles | Brain / planner / Clara context | 0 |
| Preference domain ledger | Decision ledger | 0 |

### API

- `GET /.netlify/functions/learning?action=profile`
- `POST learning` — `save-preference`, `rate-meal`, `refresh-profile`

### Migration

`20260610210000_taste_learning_v7.sql` — `profiles.taste_profile`, `meal_outcomes` table.

### Next pillars (v7.x)

- Pillar 2: Behavior & Rhythm Learner
- Pillar 3: Skill & Growth Learner
- Pillar 4: Household Identity Learner
- Pillar 5: Outcome & Success Learner
- Pillar 6: Proactive Experience Orchestrator
