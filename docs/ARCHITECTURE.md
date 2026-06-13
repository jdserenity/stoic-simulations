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
| `meditations` | Saved insight text + optional source URL |
| `meditation_stacks` | Per-client shuffled deck + read position |
| `meditation_days` | Per-client per-day assigned meditation ids (JSON array) |

API routes (Pages Functions):

- `GET /api/day` — load or create today's session
- `POST /api/day` — mark daily exercise complete (`{ exerciseId }`)
- `GET /api/drafts?exerciseId&scope` — field values for one exercise
- `PUT /api/drafts` — upsert or clear one field
- `POST /api/migrate` — one-time import from legacy `localStorage`
- `GET /api/meditations` — today's 3 meditation items (creates assignment if needed)
- `POST /api/meditations` — add item (`{ text, url? }`)
- `DELETE /api/meditations` — delete item (`{ id }`)

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

**Platform:** iPhone only (Safari PWA). iOS does not support the Web Share Target API (`share_target` in the manifest is not used).

- **Capture from X:** personal **iOS Shortcut** in the share sheet. The Shortcut POSTs to `POST /api/meditations` with the device UUID (`X-Client-Id`, copied from **Save from X** in the app), `X-Local-Date` (`YYYY-MM-DD`), and JSON body `{ "text": "…", "url": "…" }`. No X account connection.
- **Capture fallback:** manual entry on the **Save from X** screen (same API).
- **Daily surfacing:** 3 items per device-local calendar day.
- **Deck model:** without-replacement shuffled stack. The current set of saved items is shuffled into order; items are drawn and advanced through until the stack is empty, then the full current set is reshuffled for the next cycle. New items added via capture go into the next cycle only (do not enter the active remaining deck).
- **Delete:** long-press a meditation card on Today.
- **Persistence:** same per-client-id model (`localStorage` `stoic:clientId` → `X-Client-Id`) + D1 tables above.
- **Integration:** surfaced on the Today home screen (above the fold: exercises; meditations stack at bottom when present).

### iOS Shortcut setup (one-time)

1. In the PWA, open **Save from X** → **Copy ID**.
2. Shortcuts → **+** → add **Receive** → types **Text** and **URLs**, **Show in Share Sheet** on.
3. Add **Get Contents of URL**:
   - URL: `https://stoic-simulations.pages.dev/api/meditations` (or your Pages origin + `/api/meditations`)
   - Method: **POST**
   - Headers: `Content-Type` = `application/json`; `X-Client-Id` = pasted UUID; `X-Local-Date` = **Formatted Date** → Custom `yyyy-MM-dd` (Shortcut “Date” action → Format)
   - Request body: **JSON**, e.g. `{"text": "[Shortcut Input or Text]", "url": "[first URL if any]"}`
   - Turn off “Show Compose Sheet” if offered.
4. Optional: **Show Notification** “Saved to Stoic”.
5. Name the Shortcut (e.g. “Stoic”); from X → Share → pick it.

X often sends both tweet text and a status URL; map text to `text` and the `x.com` link to `url`. If only a URL is shared, put it in `text` or `url` as available.

Non-goals (in addition to prior sections): no reposting or automation on X/other platforms; no chronological feed or full archive browser as the primary UI; no multi-user or cross-profile sync beyond the existing per-client model; no native App Store app (Shortcut replaces share extension unless that changes later).
