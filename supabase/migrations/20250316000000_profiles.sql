-- App user profile + role (minimal admin gate; not full RBAC)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_role on public.profiles (role);

comment on table public.profiles is 'One row per auth user; role user|admin for app-level gates';

alter table public.profiles enable row level security;

-- Signed-in users can read their own row (admin page gate uses anon + JWT)
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

-- Service role (server admin client) for backfills / promotion
create policy "profiles_service_role_all"
  on public.profiles for all
  using (auth.jwt() ->> 'role' = 'service_role');

-- New auth users get profile row with role user
create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role)
  values (new.id, 'user')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profiles on auth.users;

create trigger on_auth_user_created_profiles
  after insert on auth.users
  for each row execute procedure public.handle_new_user_profile();
