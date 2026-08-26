# Family Finance (static HTML)

Pure HTML / CSS / JS website. No Next.js, no database, no Vercel.

## Features

- Hardcoded login: **Vin** / **admin123**
- Upload `Summary.xlsx` (sheet `Bank interest`) in the browser
- Overview, Current Products, Interest History with sortable columns
- Data stored in browser `localStorage`

## Fix the GitHub Pages 404

`https://liuchiwai0101.github.io/FFin/` shows 404 until Pages is enabled.

**Important:** this repo is currently **private**. Free GitHub Pages only works for **public** repositories (or paid GitHub Pro).

### One-time setup (in GitHub UI)

1. Open **https://github.com/liuchiwai0101/FFin/settings**
2. Make the repo public (optional but required on free plan):  
   **General → Danger Zone → Change repository visibility → Public**
3. Open **https://github.com/liuchiwai0101/FFin/settings/pages**
4. Under **Build and deployment**:
   - Source: **Deploy from a branch**
   - Branch: **`gh-pages`** / **`/` (root)**
   - Click **Save**
5. Wait 1–2 minutes, then open:  
   **https://liuchiwai0101.github.io/FFin/**

The `gh-pages` branch already contains the static site files.

## Run locally (works now, no GitHub Pages needed)

```bash
npx --yes serve docs -p 4173
```

Visit http://localhost:4173

## Folder

- Source on `main`: `docs/`
- Published branch: `gh-pages` (same HTML at branch root)
