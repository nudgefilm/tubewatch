-- user_channels RLS SELECT 정책 추가
-- 배경: user_channels는 초기 마이그레이션 없이 Supabase 콘솔에서 생성된 테이블로
--       SELECT 정책이 없어 채널 등록 후 목록이 보이지 않는 문제 발생.
--       INSERT는 supabaseAdmin(service_role)으로 우회 처리되어 있으나,
--       SELECT는 user 클라이언트를 사용하므로 정책이 필요함.

CREATE POLICY "users_can_read_own_channels"
  ON public.user_channels FOR SELECT
  USING (auth.uid() = user_id);
