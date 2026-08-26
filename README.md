# Family Finance

Private dashboard for bank deposits and interest history. Login is hardcoded; all numbers come from Excel upload (no database).

## Stack

- Next.js App Router + TypeScript
- Hardcoded cookie login (`Vin` / `admin123`)
- Excel (`.xlsx`) upload → local JSON cache under `data/`

## Local Setup

1. Copy `.env.example` to `.env` and set `AUTH_SECRET`.
2. Install and run:
   ```bash
   npm install
   npm run dev
   ```
3. Sign in with **Vin** / **admin123**.
4. Open **Sync Excel** and upload `Summary.xlsx` (sheet `Bank interest`).

## Deploy (Vercel)

No `DATABASE_URL` required. Set `AUTH_SECRET` (and optionally `APP_URL`) in the Vercel project. Note: uploaded Excel data is stored on the server filesystem (`data/` or `/tmp`) and may reset on cold deploys — re-upload after deploy if needed.

## Verification

```bash
npm run lint
npm test
npm run build
```
