-- Recurring transactions: let a business auto-fill a monthly or biweekly
-- transaction across an entire year (Jan–Dec) instead of entering it by hand
-- each time. `recurrence_group_id` ties all generated rows together so the
-- whole series can be identified and deleted as a unit.

do $$ begin
  create type public.recurrence_frequency as enum ('biweekly', 'monthly');
exception when duplicate_object then null; end $$;

alter table public.transactions
  add column if not exists recurrence_frequency public.recurrence_frequency,
  add column if not exists recurrence_group_id uuid;

create index if not exists transactions_recurrence_group_idx
  on public.transactions (recurrence_group_id)
  where recurrence_group_id is not null;

-- No RLS changes needed: transactions_owner (0001_init.sql) already scopes every
-- row by business_id regardless of which columns it has.
