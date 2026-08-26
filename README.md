# Family Finance

A private financial status and budgeting platform with a member portal and a staff CMS portal.

## Stack

- Next.js App Router and TypeScript
- PostgreSQL + Prisma (Neon / Vercel Postgres compatible)
- NextAuth.js credentials sessions
- Resend transactional emails & Upstash Redis rate limiting

## Local Setup

1. Copy `.env.example` to `.env` and supply `DATABASE_URL` along with `NEXTAUTH_SECRET`.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Generate Prisma client and apply migrations:
   ```bash
   npm run db:generate
   npm run db:migrate
   ```
4. Seed default accounts:
   ```bash
   npm run db:seed
   ```
5. Start development server:
   ```bash
   npm run dev
   ```

## Default Credentials

- **Account**: `Vin` (or `vin@family.local`)
- **Password**: `admin123`
- **Role**: `ADMIN` (Access to both `/app` portal and `/admin` CMS portal)

## Operations

Staff access is controlled by user role (`SUPPORT`, `ADMIN`).

For Vercel deployment, configure `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `APP_URL`, `RESEND_API_KEY`, and `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`.

## Verification

Run lint, tests, and build:
```bash
npm run lint
npm test
npm run build
```
