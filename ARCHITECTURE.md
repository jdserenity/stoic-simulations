# Stoic Simulations

Minimal iPhone PWA for daily cognitive stoicism exercises.

## Stack

- Vite + TypeScript (static UI in `dist/`)
- Cloudflare **Pages** (not a standalone Worker) with **Pages Functions** in `functions/`
- Cloudflare **D1** (`stoic-simulations`) for persistence
- Vitest for unit tests

## Product behavior

- Each calendar day, **2 exercises** are chosen at random from the active pool (deterministic per date).
- User completes them one at a time (title, instructions, text fields).
- When both daily exercises are done, **Library** unlocks; library work does not affect daily progress.
- Exercises 2 (Attention Meditation) and 3 (Voluntary Discomfort) are excluded from the pool.

## Persistence (D1)

Per-device identity: random UUID in `localStorage` (`stoic:clientId`), sent as `X-Client-Id` on API calls.

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
