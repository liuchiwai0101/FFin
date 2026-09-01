# Family Finance (FFin)

Next.js app with hardcoded login and Excel upload (no database required).

**Login:** `Vin` / `Vin123`

> **Mainland China:** `*.vercel.app` is blocked, and Zeabur is paid. The **free** production site is GitHub Pages (same as [News](https://liuchiwai0101.github.io/News/)).

## Free production URL

Open **this exact address** (the `/FFin/` path is required):

**https://liuchiwai0101.github.io/FFin/**

`https://liuchiwai0101.github.io` with no `/FFin/` is a 404. That is the empty user site, not this app.

## If you see “There isn't a GitHub Pages site here”

The `gh-pages` files are already in the repo. GitHub still returns 404 until **both** of these are true (News already has them):

1. **Make the repo public** (free github.io does not work on a private repo)
   - GitHub → **FFin** → **Settings** → scroll to **Danger zone**
   - **Change visibility** → **Public**
2. **Turn on Pages**
   - **Settings → Pages → Build and deployment**
   - Source: **Deploy from a branch**
   - Branch: **`gh-pages`** / **`/(root)`** → **Save**
3. Wait about a minute, then open https://liuchiwai0101.github.io/FFin/

**About → Website** should be `https://liuchiwai0101.github.io/FFin/` (not Vercel).

This repo is currently **private**, which is why github.io 404s. News works because it is **public**.

## Gitee Pages (free, often faster in China)

If github.io is slow after it is live:

1. Import this GitHub repo on [gitee.com](https://gitee.com)
2. **服务 → Gitee Pages** from `docs/` or `gh-pages`

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

Local preview of the GitHub Pages app:

```bash
npx --yes serve docs -p 4173
```

## Optional: Next.js on a VPS

The full Next.js app needs a Node.js server. There is no reliable **free** host that both runs Next.js and is reachable from mainland China.

```bash
cp .env.example .env
# set AUTH_SECRET to a long random string
docker compose up -d --build
```
