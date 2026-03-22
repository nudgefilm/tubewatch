-- YouTube 관리 채널 검증 캐시 (OAuth + Data API channels.list?mine=true 결과 요약)
-- 앱은 서버에서 본인 행만 갱신하며, role 변경은 일반 세션에서 금지한다.

alter table public.profiles
  add column if not exists youtube_verification_status text not null default 'unverified'
    check (youtube_verification_status in ('unverified', 'verified', 'revoked', 'pending'));

alter table public.profiles
  add column if not exists youtube_verified_at timestamptz;

alter table public.profiles
  add column if not exists last_youtube_check_at timestamptz;

alter table public.profiles
  add column if not exists verified_channel_count integer;

comment on column public.profiles.youtube_verification_status is
  'unverified|verified|revoked|pending — channels.list mine 기반 검증 요약';

comment on column public.profiles.youtube_verified_at is
  '마지막으로 관리 채널 1개 이상 확인된 시각';

comment on column public.profiles.last_youtube_check_at is
  '마지막 YouTube API(또는 검증 시도) 시각';

comment on column public.profiles.verified_channel_count is
  '검증 시점 관리 채널 수 (캐시)';

create or replace function public.prevent_profiles_role_change_for_users()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    if coalesce(auth.jwt() ->> 'role', '') <> 'service_role' then
      raise exception 'profiles.role can only be changed by service role';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_profiles_prevent_role_change on public.profiles;

create trigger trg_profiles_prevent_role_change
  before update on public.profiles
  for each row execute procedure public.prevent_profiles_role_change_for_users();

drop policy if exists "profiles_update_own" on public.profiles;

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);
