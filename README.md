# Family Finance (static HTML)

Pure HTML / CSS / JS website. No Next.js, no database, no Vercel.

## Features

- Hardcoded login: **Vin** / **admin123**
- Upload `Summary.xlsx` (sheet `Bank interest`) in the browser
- Overview, Current Products, Interest History with sortable columns
- Data stored in browser `localStorage`

## Run locally

Open the files directly, or serve the folder:

```bash
npx --yes serve docs -p 4173
```

Then visit http://localhost:4173

## Host on GitHub Pages (no Vercel)

1. Push this repo to GitHub.
2. Repo **Settings → Pages**:
   - Source: **GitHub Actions**
3. The workflow [`.github/workflows/pages.yml`](.github/workflows/pages.yml) publishes the `docs/` folder.
4. Site URL will look like: `https://<user>.github.io/FFin/`

Or set Pages source to **Deploy from a branch** → `main` / `/docs`.

## Folder

```
docs/
  index.html
  login.html
  overview.html
  current.html
  history.html
  sync.html
  assets/
    styles.css
    app.js
    xlsx.full.min.js
```
