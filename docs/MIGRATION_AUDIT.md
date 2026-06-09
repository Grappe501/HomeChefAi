# Migration Audit — June 2026

## Local migration files (source control)

| File | Purpose |
|------|---------|
| `20260608000000_v2_schema.sql` | Early V2 (superseded content) |
| `20260608100000_v3_features.sql` | V3 partial |
| `20260608110000_full_schema.sql` | Canonical full schema |
| `20260609100000_platform_hooks.sql` | Cook Together, recipe social hooks |
| `20260609110000_success_engine_hooks.sql` | Success Engine, food_priorities |
| `20260609120000_experience_engine_hooks.sql` | Dinner Club, Experience, Wine/cellar |

## Supabase production (applied via MCP)

| Version | Name |
|---------|------|
| 20260609034728 | full_schema_v3 |
| 20260609034746 | v3_social_and_swap |
| 20260609034753 | v3_kitchen_tables |
| 20260609034756 | v3_rls_policies |
| 20260609043930 | platform_hooks |
| 20260609044239 | success_engine_hooks |
| 20260609044738 | experience_engine_hooks |

## Discrepancy

**Version timestamps differ** between local filenames and Supabase `schema_migrations` table. Content is aligned — all expected tables exist in production.

**Rule going forward:** All schema changes MUST be added as new files under `supabase/migrations/` and applied via Supabase CLI or MCP `apply_migration` using the same SQL committed to git. No manual dashboard edits.

## Production tables verified (2026-06-09)

Core: profiles, inventory_items, receipts, meal_plans, usage_logs, calendar_events, recipes, swap_posts

Platform hooks: households, household_members, recipe_tries, recipe_variations, recipe_shares

Success: household_food_scores

Experience: dinner_clubs, dinner_club_members, dinner_club_events, dinner_club_contributions, experiences, cellar_items
