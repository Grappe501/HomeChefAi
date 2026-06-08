# HomeChef AI

Your personal kitchen sous chef — pantry inventory, receipt scanning, AI meal planning, and voice-first cooking assistant.

Built by **Burt** (Cursor) + **Ernie** (ChatGPT) for fast monetization and family kitchen management.

## V1 Features

- **Onboarding wizard** — dietary needs, cuisines, household size, allergies
- **Receipt scanning** — OpenAI Vision parses grocery receipts into inventory
- **Pantry wizard** — tap-to-add categories (canned goods, dairy, spices, etc.)
- **Inventory management** — pantry/fridge/freezer with +/- quantity controls
- **AI meal planner** — 1–14 day plans using your inventory + budget
- **"What can I make?"** — meals from current pantry only
- **Cook logging** — "I made grilled cheese" → auto inventory subtraction
- **Voice assistant** — speech-to-text + text-to-speech sous chef
- **Gamification** — XP, levels, quests (First Meal → Master Chef)
- **Meal memory** — remembers what you cooked, suggests repeats

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS |
| Backend | Netlify Functions (serverless) |
| Database | Neon Postgres via Netlify DB (local JSON dev store fallback) |
| AI | OpenAI GPT-4o-mini (receipt parsing, meal planning, assistant) |
| Hosting | Netlify (app + marketing site) |
| All files | **H:/ drive only** — node_modules, cache, temp on H:/ |

## Quick Start (Local Dev)

```bash
cd H:\HomeChefAi

# Copy env and add your OpenAI key
copy .env.example .env

# Install (everything stays on H: drive via .npmrc)
npm install

# Init dev data store
npm run db:init

# Run frontend + Netlify functions locally
npm run netlify:dev
```

App: http://localhost:8888  
Vite dev server: http://localhost:5173 (proxied through Netlify dev)

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes (for AI features) | OpenAI API key |
| `DATABASE_URL` | Production | Neon Postgres connection string |
| `USE_DEV_STORE` | Dev | `true` = local JSON store, no DB needed |

## Netlify Deployment

### App Site (main branch)

1. Connect repo: https://github.com/Grappe501/HomeChefAi
2. Branch: `main`
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Functions directory: `netlify/functions` (auto from netlify.toml)
6. Environment variables:
   - `OPENAI_API_KEY`
   - `DATABASE_URL` (from Netlify DB / Neon)
   - `USE_DEV_STORE=false`

### Database Setup

```bash
# Run schema against Neon
psql $DATABASE_URL -f db/schema.sql
```

Or use Netlify DB extension in the Netlify dashboard.

### Marketing Site (marketing branch)

1. Create second Netlify site OR branch deploy
2. Branch: `marketing`
3. Publish directory: `marketing` (uses marketing/netlify.toml)
4. No build command needed — static HTML

Update CTA links in `marketing/index.html` to your app Netlify URL once deployed.

## Branch Strategy

| Branch | Purpose | Netlify Deploy |
|--------|---------|----------------|
| `main` | Full application | App site → `dist/` |
| `marketing` | Landing/sales page | Marketing site → `marketing/` |

Workflow: Build features on main → test in sandbox → push → upgrade marketing copy on marketing branch.

## Pricing (Recommended)

| Tier | Price | Target |
|------|-------|--------|
| **Starter** | Free | Hook — 5 scans/mo, 3 meal plans |
| **Pro** | $9.99/mo | Primary revenue — unlimited everything |
| **Family** | $14.99/mo | Upsell — 6 users, shared pantry |

14-day Pro trial recommended for conversion. Annual plan at $79.99/yr (33% off) for retention.

## Project Structure

```
H:\HomeChefAi\
├── src/                    # React frontend
│   ├── pages/              # Dashboard, Inventory, Receipt, Wizard, Meals, Cook, Assistant
│   ├── components/         # Layout, VoiceButton, LoadingScreen
│   ├── hooks/              # useApp, useSpeech
│   ├── lib/                # API client, utilities
│   └── types/              # Shared TypeScript types
├── netlify/functions/      # Serverless API
│   ├── auth.ts             # User creation/login
│   ├── profile.ts          # Dietary preferences, gamification
│   ├── inventory.ts        # Pantry CRUD
│   ├── receipts.ts         # Receipt scan + verify
│   ├── meals.ts            # Meal planning AI
│   ├── usage.ts            # Cook logging / inventory subtract
│   └── assistant.ts        # Voice/chat sous chef
├── db/schema.sql           # Postgres schema
├── marketing/              # Static marketing site (marketing branch)
├── dev-data/               # Local JSON store (gitignored)
└── netlify.toml            # Netlify config
```

## API Endpoints

All at `/.netlify/functions/{name}` with header `X-User-Id`.

| Function | Methods | Purpose |
|----------|---------|---------|
| auth | POST | Create/login user |
| profile | GET, PUT | Get/update preferences |
| inventory | GET, POST, PUT, DELETE | Pantry CRUD |
| receipts | GET, POST | Scan & verify receipts |
| meals | GET, POST | Meal plans + suggestions |
| usage | GET, POST | Log cooked meals |
| assistant | POST | Chat/voice AI |

## Roadmap (V2–V5)

- V2: Stripe billing, social recipe sharing, neighbor pantry swap
- V3: Grocery store price APIs (Walmart/Kroger), inventory value tracking
- V4: Calendar push notifications, expiration alerts, weekly email digest
- V5: Plant care module (separate vertical), launch polish

## License

Proprietary — Grappe501 / HomeChef AI
