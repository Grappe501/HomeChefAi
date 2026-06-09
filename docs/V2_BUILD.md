# HomeChef AI — V2 Build Plan (LOCKED)

**Decisions confirmed:**
- Auth & DB: **Supabase** (existing account)
- Payments: **Fresh Stripe account**
- Netlify app: [home-chef-ai](https://app.netlify.com/projects/home-chef-ai/overview)
- Neighbor swap: **V3** (skipped in V2)
- Trial model: **30-day Pro trial on signup** OR **free-tier limits** — whichever bites first

---

## Access model (30 days OR limit)

```
Signup → 30-day Pro trial (tier=trial, full access)
         ↓
Trial expires → free tier (5 scans, 3 meal plans, 50 assistant msgs / month)
         ↓
Hit any limit → upgrade modal → Stripe Checkout
         ↓
Paid Pro/Family → unlimited
```

"What can I make?" stays **free** (retention hook).

---

## Sprint 1 — Supabase foundation ✅ (in progress)

| Task | Status |
|------|--------|
| Migration SQL (`supabase/migrations/20260608000000_v2_schema.sql`) | Done |
| Supabase client + Login page | Done |
| JWT auth in Netlify functions | Done |
| Profile bootstrap on first login | Done |
| Dev store fallback for local dev | Done |

**You do:**
1. Supabase Dashboard → SQL Editor → paste & run `supabase/migrations/20260608000000_v2_schema.sql`
2. Settings → API → copy URL, anon key, service_role key into `.env.local` + Netlify env
3. Authentication → Email → enable Email provider (confirm email optional for dev)

---

## Sprint 2 — Stripe billing

| Task | Status |
|------|--------|
| `billing-status` function (usage + checkout + portal) | Done |
| `billing-webhook` function | Done |
| Usage quota middleware (receipts, meals, assistant) | Done |
| Settings page + UsageMeter | Done |

**You do (Stripe Dashboard):**
1. Create products:
   - **HomeChef Pro** — $9.99/mo recurring
   - **HomeChef Family** — $14.99/mo recurring
2. Copy Price IDs → `STRIPE_PRICE_PRO`, `STRIPE_PRICE_FAMILY`
3. Developers → Webhooks → add endpoint:
   `https://YOUR_NETLIFY_URL/.netlify/functions/billing-webhook`
   Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
4. Copy webhook secret → `STRIPE_WEBHOOK_SECRET`
5. Copy secret key → `STRIPE_SECRET_KEY`

**Netlify env vars (all):**
```
OPENAI_API_KEY
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PRICE_PRO
STRIPE_PRICE_FAMILY
USE_DEV_STORE=false
```

---

## Sprint 3 — Social (recipes only)

| Task | Status |
|------|--------|
| `recipes` table + RLS | Done (in migration) |
| `recipes` Netlify function | Done |
| Recipes page (community feed) | Done |
| Share from Cook Log | TODO |
| Upgrade marketing branch | TODO |

**Skipped V2:** Neighbor pantry swap → V3

---

## Sprint 4 — Launch QA

- [ ] Netlify deploy from `main` green
- [ ] Signup → onboarding → receipt scan → meal plan → cook log
- [ ] Trial shows in Settings with countdown
- [ ] Free limits enforce after trial (or simulate by setting trial_ends_at past)
- [ ] Stripe test card `4242 4242 4242 4242` completes checkout
- [ ] Webhook upgrades tier to `pro`
- [ ] Marketing branch updated with live app URL + trial CTA
- [ ] Full GitHub push `main` + `marketing`

---

## V3 preview (not V2)

- Neighbor pantry swap (zip-based)
- Walmart/Kroger price APIs
- Inventory dollar value
- Push notifications / calendar
- Email digest

---

## File map (V2 additions)

```
supabase/migrations/20260608000000_v2_schema.sql
src/lib/supabase.ts
src/types/billing.ts
src/pages/Login.tsx
src/pages/Settings.tsx
src/pages/Recipes.tsx
src/components/UsageMeter.tsx
netlify/functions/billing-status.ts
netlify/functions/billing-webhook.ts
netlify/functions/recipes.ts
netlify/functions/utils/supabase.ts
netlify/functions/utils/quotas.ts
docs/V2_BUILD.md  (this file)
```

---

## Local dev with your `.env.local`

```powershell
cd H:\HomeChefAi
npm run netlify:dev
# Open http://localhost:8888
```

Ensure `.env.local` contains at minimum:
- `OPENAI_API_KEY`
- `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (for functions)

Set `USE_DEV_STORE=true` until Supabase migration is run, then flip to `false`.
