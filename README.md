# Family Finance (FFin)

Next.js app with hardcoded login and Excel upload (no database required).

**Login:** `Vin` / `admin123`

## GitHub Pages (github.io)

**GitHub-domain site:** [https://liuchiwai0101.github.io/FFin/](https://liuchiwai0101.github.io/FFin/)  
**Login:** Vin / admin123  

This is the same access pattern as [News](https://liuchiwai0101.github.io/News/). The latest static app lives in `docs/` and is published to the `gh-pages` branch on every `main` update.

Free github.io hosting needs a **public** repo (News is public). Private Pages requires GitHub Pro.

One-time (repo owner), then the latest version stays on github.io:

1. **Settings → General → Danger zone → Change visibility → Public**
2. **Settings → Pages → Build and deployment**
   - Source: **Deploy from a branch**
   - Branch: **`gh-pages`** / **`/(root)`**
3. **About → Website:** `https://liuchiwai0101.github.io/FFin/`

## Live deploy (Vercel)

**Production (Next.js):** [https://ffin-silk.vercel.app](https://ffin-silk.vercel.app)  
**Login:** Vin / admin123  

Vercel project `ffin` is linked to GitHub `liuchiwai0101/FFin` (Production Branch: `main`). Pushes to `main` auto-deploy.

### Env vars (Vercel → Project → Settings → Environment Variables)

| Name | Required | Notes |
|------|----------|--------|
| `AUTH_SECRET` | Yes | Long random string (session cookie signing) |
| `APP_URL` | Yes | Your production URL, e.g. `https://ffin.vercel.app` |
| `NEXTAUTH_SECRET` | Optional | Same value as `AUTH_SECRET` if set |
| `NEXTAUTH_URL` | Optional | Same as `APP_URL` if set |
| `DATABASE_URL` | No | Not used — login is hardcoded; Excel is browser-only |

### Build settings

- Framework: **Next.js** (see `vercel.json`)
- Build command: `npm run build`
- Install command: `npm install`
- Prisma generate is **not** required for this app

### Claim / GitHub link

Already done for project `ffin`:

- GitHub repo connected, Production Branch `main`
- Env vars set (`AUTH_SECRET`, `APP_URL`, etc.)
- Production URL: https://ffin-silk.vercel.app

GitHub **About → Website** should be `https://liuchiwai0101.github.io/FFin/` (the GitHub-domain deployment). Vercel remains the Next.js production URL above.

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
