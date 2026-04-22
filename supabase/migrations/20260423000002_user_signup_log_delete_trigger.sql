-- auth.users DELETE 시 user_signup_log.withdrawn_at 자동 기록
-- 앱 delete-account API 외에 콘솔/admin API 직접 삭제도 커버

CREATE OR REPLACE FUNCTION public.handle_user_deleted_signup_log()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.user_signup_log
  SET withdrawn_at = now(),
      updated_at   = now()
  WHERE user_id = OLD.id
    AND withdrawn_at IS NULL;
  RETURN OLD;
END;
$$;

CREATE TRIGGER on_auth_user_deleted_signup_log
  AFTER DELETE ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_user_deleted_signup_log();

-- 기존 고아 레코드 정리 (콘솔 직접 삭제 등으로 누락된 경우)
UPDATE public.user_signup_log
SET withdrawn_at = now(),
    updated_at   = now()
WHERE withdrawn_at IS NULL
  AND user_id NOT IN (SELECT id FROM auth.users);
