-- ============================================================
-- RR Wheels Truing -- fresh schema
-- ============================================================

-- ---------- 1. Roles / profiles ----------
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  role text check (role in ('owner', 'admin')) not null default 'admin',
  created_at timestamptz default now()
);

alter table profiles enable row level security;

create policy "Profiles are viewable by authenticated users"
on profiles for select
to authenticated
using (true);

-- Auto-create a profile row whenever a new auth user is created.
-- Pass { "role": "owner" } (or "admin") in the invite's user_metadata,
-- otherwise defaults to 'admin' (the safe, read-only default).
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'role', 'admin'));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function handle_new_user();

-- small helper used by every "owner only" policy below
create or replace function is_owner()
returns boolean as $$
  select exists (
    select 1 from profiles
    where profiles.id = auth.uid() and profiles.role = 'owner'
  );
$$ language sql security definer stable;

-- ---------- 2. Inventory ----------
create table if not exists inventory (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  category text not null default 'Uncategorized',
  description text not null default '',
  price numeric(10, 2) not null default 0,
  stock_quantity integer not null default 0,
  low_stock_threshold integer not null default 5,
  updated_at timestamptz not null default now()
);

alter table inventory enable row level security;

create policy "Authenticated users can read inventory"
on inventory for select
to authenticated
using (true);

create policy "Only owner can modify inventory"
on inventory for all
to authenticated
using (is_owner())
with check (is_owner());

-- keep updated_at current on every edit
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists inventory_set_updated_at on inventory;
create trigger inventory_set_updated_at
before update on inventory
for each row execute function set_updated_at();

-- ---------- 3. Sales transactions (manually logged by the owner) ----------
create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  transaction_date date not null default current_date,
  amount numeric(10, 2) not null check (amount > 0),
  payment_mode text not null check (payment_mode in ('cash', 'upi', 'card', 'other')),
  notes text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

alter table transactions enable row level security;

create policy "Authenticated users can read transactions"
on transactions for select
to authenticated
using (true);

create policy "Only owner can modify transactions"
on transactions for all
to authenticated
using (is_owner())
with check (is_owner());

-- ---------- 4. Dashboard-friendly views ----------

-- Revenue grouped by payment mode, for a given day (defaults to today via the app query)
create or replace view revenue_by_payment_mode as
select
  transaction_date,
  payment_mode,
  sum(amount) as total_amount,
  count(*) as transaction_count
from transactions
group by transaction_date, payment_mode;

-- Daily summary: total revenue + per-mode breakdown, one row per day
create or replace view daily_financial_summary as
select
  transaction_date,
  sum(amount) as total_revenue,
  sum(amount) filter (where payment_mode = 'cash') as cash_total,
  sum(amount) filter (where payment_mode = 'upi') as upi_total,
  sum(amount) filter (where payment_mode = 'card') as card_total,
  sum(amount) filter (where payment_mode = 'other') as other_total,
  count(*) as transaction_count
from transactions
group by transaction_date
order by transaction_date desc;

-- Stock quantity + value rolled up by category, for dashboard charts
create or replace view inventory_by_category as
select
  category,
  count(*) as item_count,
  sum(stock_quantity) as total_stock,
  sum(stock_quantity * price) as stock_value,
  count(*) filter (where stock_quantity <= low_stock_threshold) as low_stock_items
from inventory
group by category
order by total_stock desc;

-- ---------- 5. Provision the two accounts ----------

update profiles set role = 'owner' where email = 'owner@rrwheels.com';
update profiles set role = 'admin' where email = 'admin@rrwheels.com';