-- admin_get_auth_users(): auth.users 직접 쿼리 함수
-- listUsers() API는 일부 유저를 누락하는 버그가 있어 DB 직접 접근으로 대체

CREATE OR REPLACE FUNCTION public.admin_get_auth_users()
RETURNS TABLE (
  id              uuid,
  email           text,
  display_name    text,
  created_at      timestamptz,
  last_sign_in_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT
    u.id,
    u.email,
    COALESCE(
      u.raw_user_meta_data->>'name',
      u.raw_user_meta_data->>'full_name'
    ) AS display_name,
    u.created_at,
    u.last_sign_in_at
  FROM auth.users u
  WHERE u.deleted_at IS NULL
  ORDER BY u.created_at DESC;
$$;
