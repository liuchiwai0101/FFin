# Family Finance (FFin)

Next.js app with Excel upload (no database required). GitHub Pages serves the **same Next.js UI** as [ffin-silk.vercel.app](https://ffin-silk.vercel.app/).

> **Mainland China:** `*.vercel.app` is blocked, and Zeabur is paid. The **free** production site is GitHub Pages (same as [News](https://liuchiwai0101.github.io/News/)).

## Free production URL

Open **this exact address** (the `/FFin/` path is required):

**https://liuchiwai0101.github.io/FFin/**

`https://liuchiwai0101.github.io` with no `/FFin/` is a 404. That is the empty user site, not this app.

## If you see “There isn't a GitHub Pages site here”

1. **Repo must be public** (free github.io does not work on a private repo)
2. **Turn on Pages:** **Settings → Pages → Build and deployment** → Source: **Deploy from a branch** → Branch: **`gh-pages`** / **`/(root)`** → **Save**
3. Wait about a minute, then open https://liuchiwai0101.github.io/FFin/

**About → Website** should be `https://liuchiwai0101.github.io/FFin/` (not Vercel).

Pushes to `main` rebuild the Next.js app and publish `out/` to `gh-pages`.

## Gitee Pages (free, often faster in China)

If github.io is slow after it is live:

1. Import this GitHub repo on [gitee.com](https://gitee.com)
2. **服务 → Gitee Pages** from the `gh-pages` branch

## Portable single HTML (offline)

Download **[docs/Family-Finance-Portable.html](docs/Family-Finance-Portable.html)**. Open in a browser, upload Excel — no server.

## Local Next.js

```bash
npm install
npm run dev
```

Open http://localhost:3000 → Sign in → Sync Excel → upload `Summary.xlsx`.

Local preview of the GitHub Pages export (`/FFin` base path):

```bash
NEXT_PUBLIC_BASE_PATH=/FFin npm run build
npx --yes serve out -p 4173
```

Then open http://localhost:4173/FFin/

## Optional: static site on a VPS

```bash
docker compose up -d --build
```
