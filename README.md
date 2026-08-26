# Family Finance (FFin)

Next.js app with hardcoded login and Excel upload (no database required).

**Login:** `Vin` / `admin123`

## Live deploy (Vercel)

**GitHub homepage URL:** [https://temporary-prompt-cedar-pdsctj1.vercel.app](https://temporary-prompt-cedar-pdsctj1.vercel.app) (claimed project)  
**Backup temporary URL:** [https://temporary-quick-plateau-bfpxpbp.vercel.app](https://temporary-quick-plateau-bfpxpbp.vercel.app) — [claim](https://vercel.com/claim-deployment?code=42092fa5-5b62-47e5-9533-aa88e4534e37)  
**Login:** Vin / admin123

Production path: deploy the Next.js app on Vercel, linked to this GitHub repo so every push to `main` redeploys.

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

1. Open the claim URL from the latest temporary deploy (or import **https://github.com/liuchiwai0101/FFin** in the Vercel dashboard).
2. Connect the GitHub repo and set Production Branch to `main`.
3. Add the env vars above, then redeploy.
4. Set the GitHub repo homepage to the Vercel URL (Settings → General → Website).

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
