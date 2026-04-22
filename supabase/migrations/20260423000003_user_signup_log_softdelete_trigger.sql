-- auth.users UPDATE 시 deleted_at 세팅 → withdrawn_at 자동 기록 (soft-delete 대응)
-- listUsers() API는 deleted_at != NULL 유저를 반환하지 않아 하드 삭제처럼 보임
-- 하드 삭제 트리거(migration 002)와 함께 양쪽 모두 커버

CREATE OR REPLACE FUNCTION public.handle_user_soft_deleted_signup_log()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
    UPDATE public.user_signup_log
    SET withdrawn_at = COALESCE(NEW.deleted_at, now()),
        updated_at   = now()
    WHERE user_id = NEW.id
      AND withdrawn_at IS NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_soft_deleted_signup_log
  AFTER UPDATE OF deleted_at ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_user_soft_deleted_signup_log();

-- 기존 soft-deleted 유저 정리 (deleted_at 있는데 withdrawn_at NULL인 경우)
UPDATE public.user_signup_log
SET withdrawn_at = u.deleted_at,
    updated_at   = now()
FROM auth.users u
WHERE user_signup_log.user_id = u.id
  AND u.deleted_at IS NOT NULL
  AND user_signup_log.withdrawn_at IS NULL;
