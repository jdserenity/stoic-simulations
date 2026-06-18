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

Single-user database: all rows use `client_id = 'user'`. No client identity in the browser or API headers. Calendar day: `X-Local-Date` (`YYYY-MM-DD` from the browser).

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

- **Capture from X:** personal **iOS Shortcut** in the share sheet. POSTs to `POST /api/meditations` with `X-Local-Date` (`YYYY-MM-DD`) and JSON `{ "text": "…", "url": "…" }`. No X account connection.
- **Manual capture:** **+** on the Today home screen — single text field for a quote or line worth keeping (not X-specific).
- **Daily surfacing:** up to 3 items per device-local calendar day (fewer if the pool is smaller).
- **Deck model:** without-replacement shuffled stack. The current set of saved items is shuffled into order; items are drawn and advanced through until the stack is empty, then the full current set is reshuffled for the next cycle. New items added via capture go into the next cycle only (do not enter the active remaining deck).
- **Delete:** long-press a meditation card on Today.
- **Persistence:** D1 tables above (`client_id` always `user`).
- **Integration:** surfaced on the Today home screen (above the fold: exercises; meditations stack at bottom when present).

### iOS Shortcut setup (one-time)

Per [Apple’s Shortcuts guide](https://support.apple.com/guide/shortcuts/launch-a-shortcut-from-another-app-apd163eb9f95/ios): there is **no “Receive” action** to search for. Share-sheet input is enabled in the shortcut’s **Details**, which inserts an input block at the top automatically.

1. Shortcuts → **+** (new shortcut).
2. Tap **ⓘ Details** (bottom of editor) → turn on **Show in Share Sheet** → **Done**. A block appears at the top of the workflow (input types; default **Any**).
3. Tap that input block (or **Share Sheet Types** in Details) → limit to **Text** and **URLs** so the shortcut can appear when sharing from X.
4. Add actions (search these names in **Add Action**):
   - **Date** → **Format Date** → Custom `yyyy-MM-dd` (for `X-Local-Date` header).
   - **Text** — build JSON, e.g. `{"text":"…","url":"…"}`. Tap the field → pick variable **Shortcut Input** (the share payload). X may send text, a URL, or both; start simple: put **Shortcut Input** in `text` and refine after testing.
   - **Get Contents of URL** — URL `https://stoic-simulations.pages.dev/api/meditations`; **Show More** → Method **POST**; Headers: `Content-Type` `application/json`, `X-Local-Date` (Formatted Date from above); Request Body **File** or **JSON** (if JSON fields: `text`, optional `url`). Disable **Show Compose Sheet** if shown.
5. Optional: **Show Notification** — “Saved to Stoic”.
6. Name the shortcut (e.g. “Stoic”). In X → Share → scroll past app icons to **Stoic** (or **Edit Actions** to pin it).

If the shortcut does not appear in X’s share sheet, the post may not match the selected input types; try allowing **URLs** only or **Anything** while testing.

Non-goals (in addition to prior sections): no reposting or automation on X/other platforms; no chronological feed or full archive browser as the primary UI; no multi-user sync; no native App Store app (Shortcut replaces share extension unless that changes later).
