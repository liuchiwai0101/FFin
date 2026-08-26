# Family Finance

Private dashboard for bank deposits and interest history. Login is hardcoded; all numbers come from Excel upload (no database).

## Stack

- Next.js App Router + TypeScript
- Hardcoded cookie login (`Vin` / `admin123`)
- Excel (`.xlsx`) upload → stored in the browser (works on Vercel)

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

No `DATABASE_URL` required. Set `AUTH_SECRET` in the Vercel project.

1. Claim or link the project in Vercel (GitHub repo `liuchiwai0101/FFin`).
2. Deploy production.
3. Open the site → Sign in → **Sync Excel** → upload your workbook.

Uploaded data stays in the visitor’s browser (`localStorage`) so serverless hosting does not need a database.

## Verification

```bash
npm run lint
npm test
npm run build
```
