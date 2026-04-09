-- subscription_changes: change_source 컬럼 추가
-- 목적: 변경 주체 구분 (admin 수동 처리 / system 자동 / user 본인 요청)

ALTER TABLE public.subscription_changes
  ADD COLUMN IF NOT EXISTS change_source text NOT NULL DEFAULT 'system'
    CHECK (change_source IN ('admin', 'system', 'user'));

COMMENT ON COLUMN public.subscription_changes.change_source IS 'admin: 어드민 수동처리 | system: webhook·cron 자동 | user: 유저 본인 요청';
