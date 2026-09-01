# Family Finance (FFin)

Next.js app with hardcoded login and Excel upload (no database required).

**Login:** `Vin` / `Vin123`

> **Mainland China:** `*.vercel.app` is blocked. Use **GitHub Pages** (already live) or deploy the Next.js app to **Zeabur** (Hong Kong / Singapore). Do not use Vercel, Netlify, or Cloudflare Pages as the primary URL.

## Open from China (already live)

**GitHub Pages:** [https://liuchiwai0101.github.io/FFin/](https://liuchiwai0101.github.io/FFin/)  
**Login:** Vin / Vin123

This is the static `docs/` app (same pattern as [News](https://liuchiwai0101.github.io/News/)). It does not need Vercel.

## Next.js production (replaces Vercel)

Pick a host with Hong Kong or Singapore servers. Closest to Vercel:

### 1. Zeabur (recommended)

[Zeabur](https://zeabur.com) is a Vercel-like Git deploy. Site and dashboard work from mainland China; pay with Alipay / WeChat. Choose **Hong Kong** or **Singapore**.

1. Open [https://zeabur.com](https://zeabur.com) and sign in with GitHub.
2. **Create project** → **Deploy service** → **GitHub** → `liuchiwai0101/FFin`.
3. Region: **Hong Kong** or **Singapore** (not US/EU).
4. Environment variables:

| Name | Required | Notes |
|------|----------|--------|
| `AUTH_SECRET` | Yes | Long random string (session cookie signing) |
| `APP_URL` | Recommended | Your Zeabur URL, e.g. `https://ffin.zeabur.app` |

5. Generate a domain under **Networking** (or bind your own). Set `APP_URL` to that HTTPS URL and redeploy if needed.

Zeabur uses the repo `Dockerfile` automatically. Pushes to `main` rebuild the service.

### 2. Sealos / ClawCloud (China-friendly Docker)

Same image as local Docker:

- [Sealos](https://cloud.sealos.io) — Chinese cloud, App Launchpad, GitHub or Docker image.
- [ClawCloud Run](https://console.run.claw.cloud) — Next.js / Docker, public HTTPS URL.

Set `AUTH_SECRET` and `PORT` (the platform usually injects `PORT`).

### 3. Docker on a Hong Kong / Singapore VPS

Works on 腾讯云 / 阿里云 **香港**, or any HK/SG VPS (no ICP needed for an international domain).

```bash
cp .env.example .env
# set AUTH_SECRET to a long random string
# set APP_URL=https://your-domain
docker compose up -d --build
```

The container listens on `0.0.0.0:3000`. Put Nginx or Caddy in front for HTTPS.

Without Docker:

```bash
npm ci
npm run build
PORT=3000 HOSTNAME=0.0.0.0 node .next/standalone/server.js
```

## GitHub Pages (github.io)

**GitHub-domain site:** [https://liuchiwai0101.github.io/FFin/](https://liuchiwai0101.github.io/FFin/)  
**Login:** Vin / Vin123

The latest static app lives in `docs/` and is published to the `gh-pages` branch on every `main` update.

Free github.io hosting needs a **public** repo (News is public). Private Pages requires GitHub Pro.

One-time (repo owner), then the latest version stays on github.io:

1. **Settings → General → Danger zone → Change visibility → Public** (required for free github.io, same as News)
2. **Settings → Pages → Build and deployment**
   - Source: **Deploy from a branch**
   - Branch: **`gh-pages`** / **`/(root)`**
   - Or, like News: branch **`main`** / **`/(root)`** — `index.html` at the repo root opens the latest `docs/` app
3. **About → Website:** `https://liuchiwai0101.github.io/FFin/`

## Vercel (blocked in mainland China)

Previous production URL: [https://ffin-silk.vercel.app](https://ffin-silk.vercel.app) — not reachable from mainland China. Keep it only for access outside the GFW.

If you still deploy there: framework Next.js, build `npm run build`, env `AUTH_SECRET` + `APP_URL`. Prisma generate is **not** required.

## Local Next.js

```bash
cp .env.example .env
# set AUTH_SECRET and APP_URL=http://localhost:3000
npm install
npm run dev
```

Open http://localhost:3000 → Sign in → Sync Excel → upload `Summary.xlsx`.

## Portable single HTML (offline)

Download **[docs/Family-Finance-Portable.html](docs/Family-Finance-Portable.html)** (~900 KB). Open in a browser, login, upload Excel — no server.

## Static docs / GitHub Pages

`docs/` is the static HTML app (Excel upload in the browser, no server). The `gh-pages` branch is the GitHub Pages deployment of that folder.

```bash
npx --yes serve docs -p 4173
```
