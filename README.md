# Family Finance (FFin)

Next.js app with hardcoded login and Excel upload (no database required).

**Login:** `Vin` / `Vin123`

> **Mainland China:** `*.vercel.app` is blocked, and Zeabur is paid. The **free** production site is GitHub Pages (already live). Do not use Vercel, Netlify, Cloudflare Pages, or Zeabur.

## Free production (China) — already live

**GitHub Pages:** [https://liuchiwai0101.github.io/FFin/](https://liuchiwai0101.github.io/FFin/)  
**Login:** Vin / Vin123

This is the static `docs/` app (same pattern as [News](https://liuchiwai0101.github.io/News/)). $0, no Node server, no credit card. Pushes to `main` that touch `docs/` publish automatically.

If `github.io` is slow from your network, use the same `docs/` folder on a China static host:

| Platform | Cost | Notes |
|----------|------|--------|
| [Gitee Pages](https://gitee.com) | Free | Import this GitHub repo → Pages from `docs/` or `gh-pages`. Fast on mainland broadband. |
| [Sealos](https://cloud.sealos.io) static | Free (small traffic) | Drag-and-drop the `docs/` folder. China CDN. |

## GitHub Pages setup

Free github.io hosting needs a **public** repo (News is public). Private Pages requires GitHub Pro.

1. **Settings → General → Danger zone → Change visibility → Public**
2. **Settings → Pages → Build and deployment**
   - Source: **Deploy from a branch**
   - Branch: **`gh-pages`** / **`/(root)`**
3. **About → Website:** `https://liuchiwai0101.github.io/FFin/`

Local preview of the same static app:

```bash
npx --yes serve docs -p 4173
```

## Portable single HTML (offline, also free)

Download **[docs/Family-Finance-Portable.html](docs/Family-Finance-Portable.html)** (~900 KB). Open in a browser, login, upload Excel — no server.

## Local Next.js

```bash
cp .env.example .env
# set AUTH_SECRET and APP_URL=http://localhost:3000
npm install
npm run dev
```

Open http://localhost:3000 → Sign in → Sync Excel → upload `Summary.xlsx`.

## Optional: Next.js on a paid / VPS host

The full Next.js app (cookie login, API routes) needs a Node.js server. There is no reliable **free** host that both runs Next.js and is reachable from mainland China. If you later want that stack:

```bash
cp .env.example .env
# set AUTH_SECRET to a long random string
docker compose up -d --build
```

Set `AUTH_SECRET` (required) and `APP_URL` to your HTTPS URL. The image listens on `0.0.0.0:3000`.

## Vercel (blocked in mainland China)

Previous URL: [https://ffin-silk.vercel.app](https://ffin-silk.vercel.app) — not reachable from mainland China.
