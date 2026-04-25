create table public.report_action_checks (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  report_id  uuid not null references public.manus_reports(id) on delete cascade,
  section    text not null,
  checked    boolean not null default false,
  updated_at timestamptz not null default now(),
  unique(user_id, report_id, section)
);

create index idx_report_action_checks_user_report
  on public.report_action_checks(user_id, report_id);

alter table public.report_action_checks enable row level security;

create policy "Users can manage own action checks"
  on public.report_action_checks for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.set_report_action_checks_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger trg_report_action_checks_updated_at
  before update on public.report_action_checks
  for each row execute function public.set_report_action_checks_updated_at();
