# Budgety

An AI financial-growth assistant ("affordable CFO") for small and medium businesses.
Owners add transactions manually or via CSV; Budgety categorizes them, builds a
financial picture, scores business health, and uses AI to answer *what to do next*
— grounded in the business's real numbers.

Built with **Next.js 16 (App Router)**, **Supabase (Postgres + RLS)**, **Clerk** auth,
**OpenAI**, and **Resend** for weekly report email. Deployed on **Vercel**.

## MVP features

- **Auth & onboarding** — Clerk auth, guided business-profile + first-transaction setup.
- **Transactions** — manual add, CSV import with column mapping, rule-based auto-categorization, recategorize, and split.
- **Dashboard** — revenue/expense/P&L/cash summaries, expense breakdown, and a 0–100 Business Health Score.
- **AI CFO** — weekly recommendations and a streaming chat that answer using your actual data (e.g. "Can I afford a $5,000 truck?").
- **Weekly reports** — generated Monday via Vercel Cron, emailed with Resend, and archived in-app.

## Getting started

### 1. Install

```bash
npm install
cp .env.example .env.local   # then fill in real values
```

### 2. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Run the migrations in `supabase/migrations/` (via the Supabase SQL editor or the
   Supabase CLI: `supabase db push`). This creates the schema, RLS policies, and
   seeds the default categories.
3. In **Authentication → Third-party Auth**, add **Clerk** as a provider (this is what
   lets `auth.jwt() ->> 'sub'` resolve to the Clerk user id inside RLS policies).

### 3. Clerk

1. Create an app at [clerk.com](https://clerk.com); copy the publishable/secret keys
   into `.env.local`.
2. In Clerk, enable the **Supabase integration** so session tokens are accepted by
   Supabase (pairs with step 2.3 above).

### 4. OpenAI & Resend

- `OPENAI_API_KEY` — powers recommendations, chat, and reports (`OPENAI_MODEL` optional).
- `RESEND_API_KEY` + `RESEND_FROM_EMAIL` — weekly report email. Optional in dev; if
  unset, reports still generate and appear in-app (email is skipped).

### 5. Run

```bash
npm run dev
```

## Weekly report cron

`vercel.json` schedules `GET /api/cron/weekly-report` every Monday 13:00 UTC. The route
is guarded by `CRON_SECRET` (Vercel sends it as `Authorization: Bearer <secret>`). Set
`CRON_SECRET` in your Vercel project env. To test locally:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/weekly-report
```

## Architecture notes

- **Data isolation** — every table has RLS scoping rows to the Clerk user; the app never
  trusts a client-supplied `business_id`. Server code uses a Supabase client that forwards
  the Clerk token (`lib/supabase/server.ts`); the service-role client (`lib/supabase/admin.ts`)
  is used **only** by the cron job.
- **AI grounding** — every AI call injects a structured financial-context block built from
  real aggregates (`lib/ai/context.ts`) and forbids inventing numbers (`lib/ai/prompts.ts`).
  Responses are stored with the data snapshot used, for auditability.
- **Plaid-ready** — `transactions.source` and `transactions.raw_import` let bank sync be
  added later (`source='plaid'`) with no schema change.
- **Health score** — six weighted factors in `lib/finance/healthScore.ts`. Debt ratio is a
  documented neutral placeholder (liabilities aren't tracked in the MVP).

## Project layout

```
app/                 routes (marketing, auth, onboarding, (app) shell, api/*)
components/          UI primitives, nav, dashboard charts/health score
lib/                 supabase clients, ai/, finance/, csv/, categorize/, actions/, data/
supabase/migrations/ schema + RLS + seed
```

## Not in this MVP

Plaid, Stripe, analytics, forecasting, lending/investing, benchmarking, and native mobile
apps are intentionally out of scope (see the product plan).
