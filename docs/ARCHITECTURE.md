# Stoic Simulations

Minimal iPhone PWA for daily cognitive stoicism exercises.

## Stack

- Vite + TypeScript (static UI in `dist/`)
- Cloudflare **Pages** (not a standalone Worker) with **Pages Functions** in `functions/`
- Cloudflare **D1** (`stoic-simulations`) for persistence
- Vitest for unit tests

## Product behavior

- Each **device-local calendar day** (`X-Local-Date` on API calls), **2 exercises** are chosen at random from the active pool (deterministic per date).
- User completes them one at a time (title, instructions, text fields).
- When both daily exercises are done, **Library** unlocks; library completions do not count toward finishing the daily pair, but each library **Done** adds +1 to the home-screen progress numerator (e.g. 3/2), stored per device in `localStorage`.
- Exercises 2 (Attention Meditation) and 3 (Voluntary Discomfort) are excluded from the pool.

## Persistence (D1)

Per-device identity: random UUID in `localStorage` (`stoic:clientId`), sent as `X-Client-Id` on API calls. Calendar day: `X-Local-Date` (`YYYY-MM-DD` from the browser).

Service worker caches static shell assets only (`public/sw.js`); `/api/*` is never cached.

| Table | Purpose |
|-------|---------|
| `clients` | Device rows |
| `day_sessions` | Daily assigned + completed exercise ids (JSON arrays) |
| `drafts` | Field answers (`scope`: daily \| library, `bucket_key`: date or `library`) |

API routes (Pages Functions):

- `GET /api/day` — load or create today's session
- `POST /api/day` — mark daily exercise complete (`{ exerciseId }`)
- `GET /api/drafts?exerciseId&scope` — field values for one exercise
- `PUT /api/drafts` — upsert or clear one field
- `POST /api/migrate` — one-time import from legacy `localStorage`

## Dev editing exercises

Edit `exercises.ts` at the repo root. Rebuild and deploy to apply.

## Deploy (Cloudflare Pages)

Config: `wrangler.jsonc` (`pages_build_output_dir`: `./dist`, D1 binding `DB`).

```bash
npm install
npm run db:migrate:remote   # once per database
npm run deploy              # build + wrangler pages deploy
```

Local full stack: `npm run build && npm run db:migrate:local && npm run dev:cf`  
Vite-only UI with API proxy: run `dev:cf` on :8788 and `npm run dev` (proxies `/api`).

## Commands

- `npm run dev` — Vite (proxy `/api` → 8788 if Pages dev running)
- `npm run dev:cf` — build + `wrangler pages dev dist`
- `npm test` — unit tests
- `npm run deploy` — production Pages upload

## JD Meditations

Private personal collection of the user's own short timeless/philosophical insights (initially from X posts) for deliberate re-encounter. The feature lives inside the Stoic Simulations PWA so it rides the existing daily check habit.

- Capture: Web Share Target. After the user adds the PWA to the iPhone home screen (Safari Share → Add to Home Screen), the installed app appears as a share destination. Sharing a tweet (text + url) from the X app or browser saves it as a new meditation item. Manual entry inside the app is a fallback. No X account connection required.
- Daily surfacing: 3 items per device-local calendar day.
- Deck model: without-replacement shuffled stack. The current set of saved items is shuffled into order; items are drawn and advanced through until the stack is empty, then the full current set is reshuffled for the next cycle. New items added via share go into the next cycle only (do not enter the active remaining deck).
- Delete: users can delete items.
- Persistence: reuses the existing per-client-id (localStorage stoic:clientId sent as X-Client-Id) + D1 model. New tables/endpoints will be added following the patterns in day_sessions/drafts and functions/api/*.
- Integration: surfaced as part of the daily "Today" experience in the PWA (alongside the stoic exercises). No separate app or public distribution.

Non-goals (in addition to prior sections): no reposting or automation on X/other platforms; no chronological feed or full archive browser as the primary UI; no multi-user or cross-profile sync beyond the existing per-client model.
