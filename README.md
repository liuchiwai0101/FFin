# Family Finance (FFin)

Next.js app with hardcoded login and Excel upload (no database required).

**Login:** `Vin` / `admin123`

## Live deploy (Vercel)

**Production:** [https://ffin-silk.vercel.app](https://ffin-silk.vercel.app)  
**Login:** Vin / admin123  

Vercel project `ffin` is linked to GitHub `liuchiwai0101/FFin` (Production Branch: `main`). Pushes to `main` auto-deploy.

Update the GitHub repo **About → Website** to `https://ffin-silk.vercel.app` if it still shows the old temporary URL.

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

Set GitHub **About → Website** to that URL (agent cannot edit homepage; API 403).

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

The `docs/` folder and `gh-pages` branch are a static HTML mirror. Private repos need GitHub Pro (or a public repo) for free Pages.

```bash
npx --yes serve docs -p 4173
```
