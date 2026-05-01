-- Credit-based analysis request limit (Free: 5/month, Admin: unlimited)
create table if not exists public.user_credits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  monthly_limit integer not null default 5,
  credits_used integer not null default 0,
  period_start timestamptz not null,
  period_end timestamptz not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id)
);

create index if not exists idx_user_credits_user_id on public.user_credits(user_id);
create index if not exists idx_user_credits_period_end on public.user_credits(period_end);

alter table public.user_credits enable row level security;

create policy "Users can read own credits"
  on public.user_credits for select
  using (auth.uid() = user_id);

create policy "Service role can do all"
  on public.user_credits for all
  using (auth.jwt() ->> 'role' = 'service_role');

comment on table public.user_credits is 'Monthly analysis credits per user (Free: 5/month)';
