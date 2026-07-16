-- Budgety — initial schema, indexes, and Row Level Security.
--
-- Auth model: Clerk issues the session JWT; Supabase is configured with Clerk as a
-- third-party auth provider, so `auth.jwt() ->> 'sub'` resolves to the Clerk user id
-- inside RLS policies. Every table is scoped to the authenticated Clerk user.

-- ---------------------------------------------------------------------------
-- Helpers & enums
-- ---------------------------------------------------------------------------

-- The Clerk user id of the current request (null when unauthenticated).
create or replace function public.clerk_user_id()
returns text
language sql
stable
as $$
  select nullif(auth.jwt() ->> 'sub', '')::text;
$$;

do $$ begin
  create type public.transaction_type as enum ('revenue', 'expense');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.transaction_source as enum ('manual', 'csv', 'plaid');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.category_kind as enum ('revenue', 'expense');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.risk_level as enum ('low', 'medium', 'high');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.recommendation_status as enum ('new', 'read', 'dismissed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.report_email_status as enum ('pending', 'sent', 'failed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.plan_tier as enum ('starter', 'growth', 'professional', 'enterprise');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  user_id    text primary key,                       -- Clerk user id
  email      text,
  plan       public.plan_tier not null default 'starter',
  created_at timestamptz not null default now()
);

create table if not exists public.businesses (
  id                  uuid primary key default gen_random_uuid(),
  user_id             text not null,                 -- Clerk user id (owner)
  name                text not null,
  industry            text,
  size                text,
  revenue_range       text,
  cash_balance        numeric(14, 2) not null default 0,
  onboarding_complete boolean not null default false,
  created_at          timestamptz not null default now()
);
create index if not exists businesses_user_id_idx on public.businesses (user_id);

create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses (id) on delete cascade, -- null = system default
  name        text not null,
  kind        public.category_kind not null,
  is_default  boolean not null default false
);
create index if not exists categories_business_id_idx on public.categories (business_id);

create table if not exists public.transactions (
  id                    uuid primary key default gen_random_uuid(),
  business_id           uuid not null references public.businesses (id) on delete cascade,
  amount                numeric(14, 2) not null,
  occurred_on           date not null,
  description           text not null default '',
  category_id           uuid references public.categories (id) on delete set null,
  type                  public.transaction_type not null,
  source                public.transaction_source not null default 'manual',
  parent_transaction_id uuid references public.transactions (id) on delete cascade, -- split child
  raw_import            jsonb,                        -- CSV/Plaid provenance
  created_at            timestamptz not null default now()
);
create index if not exists transactions_business_date_idx on public.transactions (business_id, occurred_on desc);
create index if not exists transactions_category_idx on public.transactions (category_id);
create index if not exists transactions_parent_idx on public.transactions (parent_transaction_id);

create table if not exists public.health_scores (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  score       integer not null check (score between 0 and 100),
  factors     jsonb not null default '{}'::jsonb,
  computed_at timestamptz not null default now()
);
create index if not exists health_scores_business_time_idx on public.health_scores (business_id, computed_at desc);

create table if not exists public.ai_recommendations (
  id              uuid primary key default gen_random_uuid(),
  business_id     uuid not null references public.businesses (id) on delete cascade,
  title           text not null,
  body            text not null,
  rationale       text not null default '',
  supporting_data jsonb not null default '{}'::jsonb,
  risk_level      public.risk_level not null default 'low',
  status          public.recommendation_status not null default 'new',
  created_at      timestamptz not null default now()
);
create index if not exists ai_recommendations_business_idx on public.ai_recommendations (business_id, created_at desc);

create table if not exists public.ai_conversations (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses (id) on delete cascade,
  role         text not null check (role in ('user', 'assistant')),
  content      text not null,
  data_context jsonb,
  created_at   timestamptz not null default now()
);
create index if not exists ai_conversations_business_time_idx on public.ai_conversations (business_id, created_at asc);

create table if not exists public.reports (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses (id) on delete cascade,
  period_start date not null,
  period_end   date not null,
  content      jsonb not null default '{}'::jsonb,
  email_status public.report_email_status not null default 'pending',
  created_at   timestamptz not null default now()
);
create index if not exists reports_business_time_idx on public.reports (business_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles          enable row level security;
alter table public.businesses        enable row level security;
alter table public.categories        enable row level security;
alter table public.transactions      enable row level security;
alter table public.health_scores     enable row level security;
alter table public.ai_recommendations enable row level security;
alter table public.ai_conversations  enable row level security;
alter table public.reports           enable row level security;

-- profiles: a user sees & manages only their own row.
drop policy if exists profiles_owner on public.profiles;
create policy profiles_owner on public.profiles
  for all
  using (user_id = public.clerk_user_id())
  with check (user_id = public.clerk_user_id());

-- businesses: owner-only.
drop policy if exists businesses_owner on public.businesses;
create policy businesses_owner on public.businesses
  for all
  using (user_id = public.clerk_user_id())
  with check (user_id = public.clerk_user_id());

-- Reusable predicate: business_id belongs to the current user.
-- (Inlined per-table below since policies can't take parameters.)

-- categories: system defaults (business_id is null) are readable by all
-- authenticated users; custom categories are owner-scoped for all operations.
drop policy if exists categories_select on public.categories;
create policy categories_select on public.categories
  for select
  using (
    (business_id is null and public.clerk_user_id() is not null)
    or business_id in (select id from public.businesses where user_id = public.clerk_user_id())
  );

drop policy if exists categories_write on public.categories;
create policy categories_write on public.categories
  for all
  using (business_id in (select id from public.businesses where user_id = public.clerk_user_id()))
  with check (business_id in (select id from public.businesses where user_id = public.clerk_user_id()));

-- Owner-scoped policies for the remaining business-child tables.
drop policy if exists transactions_owner on public.transactions;
create policy transactions_owner on public.transactions
  for all
  using (business_id in (select id from public.businesses where user_id = public.clerk_user_id()))
  with check (business_id in (select id from public.businesses where user_id = public.clerk_user_id()));

drop policy if exists health_scores_owner on public.health_scores;
create policy health_scores_owner on public.health_scores
  for all
  using (business_id in (select id from public.businesses where user_id = public.clerk_user_id()))
  with check (business_id in (select id from public.businesses where user_id = public.clerk_user_id()));

drop policy if exists ai_recommendations_owner on public.ai_recommendations;
create policy ai_recommendations_owner on public.ai_recommendations
  for all
  using (business_id in (select id from public.businesses where user_id = public.clerk_user_id()))
  with check (business_id in (select id from public.businesses where user_id = public.clerk_user_id()));

drop policy if exists ai_conversations_owner on public.ai_conversations;
create policy ai_conversations_owner on public.ai_conversations
  for all
  using (business_id in (select id from public.businesses where user_id = public.clerk_user_id()))
  with check (business_id in (select id from public.businesses where user_id = public.clerk_user_id()));

drop policy if exists reports_owner on public.reports;
create policy reports_owner on public.reports
  for all
  using (business_id in (select id from public.businesses where user_id = public.clerk_user_id()))
  with check (business_id in (select id from public.businesses where user_id = public.clerk_user_id()));

-- Note: the service-role key (used only by server-side cron jobs) bypasses RLS by
-- design and is never exposed to the browser.
