-- User subscription state from Stripe (checkout.session.completed + subscription lifecycle).
-- One row per user; upserted by user_id on checkout, updated by stripe_subscription_id on subscription events.
create table if not exists public.user_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text not null,
  plan_id text not null,
  subscription_status text not null,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

create unique index if not exists idx_user_subscriptions_stripe_subscription_id
  on public.user_subscriptions(stripe_subscription_id);
create index if not exists idx_user_subscriptions_user_id
  on public.user_subscriptions(user_id);

alter table public.user_subscriptions enable row level security;

create policy "Users can read own subscription"
  on public.user_subscriptions for select
  using (auth.uid() = user_id);

create policy "Service role can do all"
  on public.user_subscriptions for all
  using (auth.jwt() ->> 'role' = 'service_role');

comment on table public.user_subscriptions is 'Current Stripe subscription per user; updated via webhook (checkout.session.completed, customer.subscription.updated/deleted)';
