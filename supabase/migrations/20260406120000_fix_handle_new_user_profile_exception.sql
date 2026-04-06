-- handle_new_user_profile 트리거에 예외 처리 추가
-- 배경: profile INSERT 실패 시 auth.users INSERT 전체가 롤백되어
--        "Database error saving new user" 에러 발생 → 신규 Google 가입 불가
-- 수정: exception when others → WARNING 로깅만 하고 user 생성은 계속 진행

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  begin
    insert into public.profiles (id, role)
    values (new.id, 'user')
    on conflict (id) do nothing;
  exception when others then
    raise warning '[handle_new_user_profile] profile insert failed for user %: %', new.id, sqlerrm;
  end;
  return new;
end;
$$;

-- 트리거가 없는 경우를 대비해 재생성
drop trigger if exists on_auth_user_created_profiles on auth.users;

create trigger on_auth_user_created_profiles
  after insert on auth.users
  for each row execute procedure public.handle_new_user_profile();
