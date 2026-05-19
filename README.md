# Stoic Simulations

Minimal iPhone PWA for daily stoic cognitive exercises. Hosted on **Cloudflare Pages** with **D1** for sync across devices (per browser profile).

```bash
npm install
npm run db:migrate:remote   # first time
npm run deploy
npm test
```

Edit exercises in [`exercises.ts`](exercises.ts). See [ARCHITECTURE.md](ARCHITECTURE.md).

**Install on iPhone:** open your Pages URL in Safari → Share → Add to Home Screen.

**Local dev:** `npm run build && npm run db:migrate:local && npm run dev:cf`
