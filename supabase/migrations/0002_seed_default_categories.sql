-- Seed system-default categories (business_id = null, is_default = true).
-- These are readable by every authenticated user via the categories_select policy
-- and are used as the fallback category set for every business.

insert into public.categories (business_id, name, kind, is_default)
select null, name, 'expense'::public.category_kind, true
from (values
  ('Marketing'),
  ('Payroll'),
  ('Rent'),
  ('Utilities'),
  ('Equipment'),
  ('Software'),
  ('Inventory'),
  ('Travel'),
  ('Vendor Payments'),
  ('Uncategorized')
) as v(name)
where not exists (
  select 1 from public.categories c
  where c.business_id is null and c.name = v.name
);

insert into public.categories (business_id, name, kind, is_default)
select null, 'Revenue', 'revenue'::public.category_kind, true
where not exists (
  select 1 from public.categories c
  where c.business_id is null and c.name = 'Revenue'
);
