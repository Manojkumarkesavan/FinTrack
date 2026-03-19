-- ============================================================
-- FinTrack — Supabase Schema
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES
-- ============================================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  base_currency text not null default 'INR',
  monthly_income numeric(15,2) default 0,
  is_pro boolean not null default false,
  onboarded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- ASSET TYPES (enum-like reference)
-- ============================================================
-- Bank: savings, fd, rd
-- Equity: stocks, mf_equity, etf, us_stocks, sgb
-- Debt: mf_debt, ppf, epf, nps, bonds
-- Real estate: property, reit
-- Others: gold, crypto, vehicle, other

-- ============================================================
-- ASSETS
-- ============================================================
create table public.assets (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  type text not null, -- 'savings' | 'fd' | 'stocks' | 'mf_equity' | 'etf' | 'us_stocks' | 'ppf' | 'epf' | 'nps' | 'sgb' | 'property' | 'reit' | 'gold' | 'crypto' | 'other'
  category text not null, -- 'bank' | 'equity' | 'debt' | 'real_estate' | 'others'
  current_value numeric(15,2) not null default 0,
  purchase_price numeric(15,2),
  quantity numeric(20,6),
  ticker_symbol text,
  currency text not null default 'INR',
  institution text,
  notes text,
  is_manual_value boolean not null default true,
  last_price_refresh timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index assets_user_id_idx on public.assets(user_id);
create index assets_type_idx on public.assets(type);

-- ============================================================
-- LIABILITIES
-- ============================================================
create table public.liabilities (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  type text not null, -- 'home_loan' | 'car_loan' | 'personal_loan' | 'credit_card' | 'education_loan' | 'other'
  principal_amount numeric(15,2) not null,
  outstanding_amount numeric(15,2) not null,
  interest_rate numeric(5,2),
  emi_amount numeric(15,2),
  start_date date,
  end_date date,
  institution text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index liabilities_user_id_idx on public.liabilities(user_id);

-- ============================================================
-- TRANSACTIONS (income & expenses)
-- ============================================================
create table public.transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null check (type in ('income', 'expense')),
  amount numeric(15,2) not null,
  currency text not null default 'INR',
  category text not null,
  sub_category text,
  description text,
  date date not null,
  is_recurring boolean not null default false,
  recurring_frequency text, -- 'daily' | 'weekly' | 'monthly' | 'yearly'
  tags text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index transactions_user_id_idx on public.transactions(user_id);
create index transactions_date_idx on public.transactions(date desc);
create index transactions_type_idx on public.transactions(type);

-- ============================================================
-- INVESTMENTS (broker import)
-- ============================================================
create table public.investments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  broker text not null, -- 'zerodha' | 'groww' | 'upstox' | 'kite' | 'manual'
  symbol text not null,
  isin text,
  name text not null,
  investment_type text not null, -- 'stock' | 'mf' | 'etf' | 'us_stock'
  quantity numeric(20,6) not null,
  avg_cost numeric(15,4) not null,
  ltp numeric(15,4),
  current_value numeric(15,2),
  invested_value numeric(15,2),
  unrealised_pnl numeric(15,2),
  unrealised_pnl_pct numeric(8,2),
  xirr numeric(8,4),
  sector text,
  currency text not null default 'INR',
  last_refresh timestamptz,
  import_batch_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index investments_user_id_idx on public.investments(user_id);
create index investments_symbol_idx on public.investments(symbol);

-- ============================================================
-- NET WORTH SNAPSHOTS
-- ============================================================
create table public.networth_snapshots (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  snapshot_date date not null,
  total_assets numeric(15,2) not null,
  total_liabilities numeric(15,2) not null,
  net_worth numeric(15,2) not null,
  breakdown jsonb, -- { equity: x, debt: x, real_estate: x, others: x }
  created_at timestamptz not null default now(),
  unique(user_id, snapshot_date)
);

create index networth_snapshots_user_date_idx on public.networth_snapshots(user_id, snapshot_date desc);

-- ============================================================
-- AI INSIGHTS CACHE
-- ============================================================
create table public.insights_cache (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  insight_type text not null, -- 'emergency_fund' | 'savings_rate' | 'allocation' | 'debt' | 'projection'
  content jsonb not null,
  generated_at timestamptz not null default now(),
  unique(user_id, insight_type)
);

create index insights_cache_user_idx on public.insights_cache(user_id);

-- ============================================================
-- FX RATES CACHE (refreshed hourly by cron)
-- ============================================================
create table public.fx_rates (
  base_currency text not null,
  target_currency text not null,
  rate numeric(20,8) not null,
  updated_at timestamptz not null default now(),
  primary key (base_currency, target_currency)
);

-- ============================================================
-- FINANCIAL GOALS
-- ============================================================
create table public.financial_goals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  description text,
  category text not null, -- 'retirement' | 'education' | 'home' | 'vehicle' | 'investment' | 'debt_payoff' | 'savings' | 'other'
  target_amount numeric(15,2) not null,
  current_amount numeric(15,2) not null default 0,
  currency text not null default 'INR',
  start_date date not null,
  target_date date not null,
  priority text not null default 'medium', -- 'low' | 'medium' | 'high'
  status text not null default 'active', -- 'active' | 'paused' | 'completed' | 'abandoned'
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index financial_goals_user_id_idx on public.financial_goals(user_id);
create index financial_goals_status_idx on public.financial_goals(status);

-- ============================================================
-- GOAL MILESTONES (track progress on goals)
-- ============================================================
create table public.goal_milestones (
  id uuid primary key default uuid_generate_v4(),
  goal_id uuid references public.financial_goals(id) on delete cascade not null,
  milestone_amount numeric(15,2) not null,
  target_date date not null,
  achieved_date date,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index goal_milestones_goal_id_idx on public.goal_milestones(goal_id);

-- ============================================================
-- FX RATES CACHE (refreshed hourly by cron)
-- ============================================================
create table public.fx_rates (
  base_currency text not null,
  target_currency text not null,
  rate numeric(20,8) not null,
  updated_at timestamptz not null default now(),
  primary key (base_currency, target_currency)
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles enable row level security;
alter table public.assets enable row level security;
alter table public.liabilities enable row level security;
alter table public.transactions enable row level security;
alter table public.investments enable row level security;
alter table public.networth_snapshots enable row level security;
alter table public.insights_cache enable row level security;
alter table public.financial_goals enable row level security;
alter table public.goal_milestones enable row level security;

-- Profiles: users can only read/update their own profile
create policy "profiles_select" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update" on public.profiles for update using (auth.uid() = id);

-- Assets
create policy "assets_all" on public.assets using (auth.uid() = user_id);
create policy "assets_insert" on public.assets for insert with check (auth.uid() = user_id);

-- Liabilities
create policy "liabilities_all" on public.liabilities using (auth.uid() = user_id);
create policy "liabilities_insert" on public.liabilities for insert with check (auth.uid() = user_id);

-- Transactions
create policy "transactions_all" on public.transactions using (auth.uid() = user_id);
create policy "transactions_insert" on public.transactions for insert with check (auth.uid() = user_id);

-- Investments
create policy "investments_all" on public.investments using (auth.uid() = user_id);
create policy "investments_insert" on public.investments for insert with check (auth.uid() = user_id);

-- Snapshots
create policy "snapshots_all" on public.networth_snapshots using (auth.uid() = user_id);
create policy "snapshots_insert" on public.networth_snapshots for insert with check (auth.uid() = user_id);

-- Insights cache
create policy "insights_all" on public.insights_cache using (auth.uid() = user_id);
create policy "insights_insert" on public.insights_cache for insert with check (auth.uid() = user_id);

-- Financial Goals
create policy "goals_all" on public.financial_goals using (auth.uid() = user_id);
create policy "goals_insert" on public.financial_goals for insert with check (auth.uid() = user_id);

-- Goal Milestones (access through goals)
create policy "milestones_select" on public.goal_milestones for select using (
  goal_id in (select id from public.financial_goals where user_id = auth.uid())
);
create policy "milestones_insert" on public.goal_milestones for insert with check (
  goal_id in (select id from public.financial_goals where user_id = auth.uid())
);
create policy "milestones_update" on public.goal_milestones for update using (
  goal_id in (select id from public.financial_goals where user_id = auth.uid())
);
create policy "milestones_delete" on public.goal_milestones for delete using (
  goal_id in (select id from public.financial_goals where user_id = auth.uid())
);

-- FX rates: public read, no user write
alter table public.fx_rates enable row level security;
create policy "fx_rates_read" on public.fx_rates for select using (true);

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Get net worth summary for a user
create or replace function public.get_networth_summary(p_user_id uuid)
returns table(
  total_assets numeric,
  total_liabilities numeric,
  net_worth numeric,
  equity_value numeric,
  debt_value numeric,
  real_estate_value numeric,
  others_value numeric
) language plpgsql security definer as $$
begin
  return query
  select
    coalesce(sum(a.current_value), 0) as total_assets,
    coalesce((select sum(l.outstanding_amount) from public.liabilities l where l.user_id = p_user_id), 0) as total_liabilities,
    coalesce(sum(a.current_value), 0) - coalesce((select sum(l.outstanding_amount) from public.liabilities l where l.user_id = p_user_id), 0) as net_worth,
    coalesce(sum(case when a.category = 'equity' then a.current_value else 0 end), 0) as equity_value,
    coalesce(sum(case when a.category = 'debt' then a.current_value else 0 end), 0) as debt_value,
    coalesce(sum(case when a.category = 'real_estate' then a.current_value else 0 end), 0) as real_estate_value,
    coalesce(sum(case when a.category not in ('equity', 'debt', 'real_estate') then a.current_value else 0 end), 0) as others_value
  from public.assets a
  where a.user_id = p_user_id;
end;
$$;

-- Get monthly income/expense totals (last 6 months)
create or replace function public.get_monthly_cashflow(p_user_id uuid, p_months int default 6)
returns table(
  month text,
  income numeric,
  expenses numeric,
  savings numeric
) language plpgsql security definer as $$
begin
  return query
  select
    to_char(date_trunc('month', t.date), 'Mon YY') as month,
    coalesce(sum(case when t.type = 'income' then t.amount else 0 end), 0) as income,
    coalesce(sum(case when t.type = 'expense' then t.amount else 0 end), 0) as expenses,
    coalesce(sum(case when t.type = 'income' then t.amount else -t.amount end), 0) as savings
  from public.transactions t
  where t.user_id = p_user_id
    and t.date >= date_trunc('month', now()) - (p_months - 1 || ' months')::interval
  group by date_trunc('month', t.date)
  order by date_trunc('month', t.date);
end;
$$;

-- ============================================================
-- SEED: Default FX rates (will be refreshed by cron)
-- ============================================================
insert into public.fx_rates (base_currency, target_currency, rate) values
  ('USD', 'INR', 83.50),
  ('EUR', 'INR', 91.20),
  ('GBP', 'INR', 106.50),
  ('SGD', 'INR', 62.10),
  ('AED', 'INR', 22.72)
on conflict (base_currency, target_currency) do nothing;
