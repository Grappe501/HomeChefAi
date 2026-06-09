# V3.1 Hardening — QA Notes

**Date:** June 2026  
**Production URL:** https://home-chef-ai.netlify.app

## Automated validation

| Check | Result |
|-------|--------|
| `npm run build` | PASS |
| `npm run typecheck` | PASS |
| `npm run lint` | N/A — not configured (skipped per protocol) |
| Production homepage loads | PASS — HTTP 200, React root present |
| Production bundle | PASS — `index-ClgD7fwE.js` served |
| Functions return 401 (not 502) | PASS — inventory endpoint verified |
| No `alert()` in src | PASS — grep clean |
| Last automated run | June 8, 2026 |

## Gate before Brain 1.0A

- [ ] Complete mobile checklist below on a **real phone**
- [ ] Confirm: onboarding → receipts → inventory → cook log → XP → household
- [ ] Say **"Start Brain 1.0A"** to begin build (`docs/BRAIN_1_0A_SPEC.md`)

---

### Global
- [ ] Bottom nav tap targets ≥ 48px
- [ ] Toast notifications visible above nav bar
- [ ] No `alert()` dialogs blocking UI
- [ ] Buttons use min-h 52px on primary actions

### Signup & onboarding
- [ ] Email/password signup works
- [ ] 10-step onboarding scrolls and advances
- [ ] Priorities + buy local steps tappable
- [ ] Kitchen name saves

### Cook Together
- [ ] Settings → Create Household Kitchen
- [ ] Invite code copies
- [ ] Second account joins with code
- [ ] Dashboard Cook Together card updates

### Receipt scan (V3.1 focus)
- [ ] Camera/upload works
- [ ] Edit item: name, qty, unit, category, location, price
- [ ] Ignore / restore item
- [ ] Approve all / restore all
- [ ] Confirm adds only non-ignored items
- [ ] XP toast shows on verify (+30)

### Inventory & wizard
- [ ] Pantry wizard saves with XP toast (+15)
- [ ] Inventory +/- controls thumb-friendly

### Cook log
- [ ] Voice/text meal log
- [ ] Confirm subtracts inventory
- [ ] XP toast (+25) and dashboard XP updates

### Meal planner
- [ ] Plan generates with XP toast (+50)

### Assistant & recipes
- [ ] Assistant chat loads
- [ ] Recipes feed loads

## Known issues remaining

1. Full manual E2E requires human pass on checklist above
2. ESLint not configured
3. Receipt scan requires OPENAI_API_KEY for real parsing
4. Brain features not started (by design)

## V3.1 deliverables shipped

- Receipt line-item editing before verify
- Gamification XP on Supabase (cook, receipt, meal plan, wizard)
- Toast system (success, error, info, loading)
- Mobile tap target improvements (52px buttons, spacing)
- `gamification.ts` shared server utility
