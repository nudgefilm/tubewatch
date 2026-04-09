-- subscription_changes: 플랜 변경 이력 로그 테이블
--
-- 목적: CS 응대 시 유저의 플랜 변경 전체 이력 조회
-- 기록 시점: 신규 구독, 업그레이드, 다운그레이드, 수동 부여, 만료, 환불, 취소

CREATE TABLE IF NOT EXISTS public.subscription_changes (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  changed_at           timestamptz NOT NULL DEFAULT now(),
  previous_plan_id     text,
  new_plan_id          text,
  previous_expires_at  timestamptz,
  new_expires_at       timestamptz,
  change_type          text        NOT NULL
    CHECK (change_type IN ('new', 'upgrade', 'downgrade', 'manual_grant', 'expiry', 'refund', 'cancel')),
  note                 text,
  changed_by_admin_id  uuid        REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_subscription_changes_user_id
  ON public.subscription_changes(user_id);

CREATE INDEX IF NOT EXISTS idx_subscription_changes_changed_at
  ON public.subscription_changes(changed_at DESC);

ALTER TABLE public.subscription_changes ENABLE ROW LEVEL SECURITY;

-- 유저는 자신의 이력만 조회 가능
CREATE POLICY "Users can read own subscription changes"
  ON public.subscription_changes FOR SELECT
  USING (auth.uid() = user_id);

-- 서비스 롤(어드민/서버)은 전체 접근
CREATE POLICY "Service role can do all"
  ON public.subscription_changes FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

COMMENT ON TABLE public.subscription_changes IS '플랜 변경 전체 이력 — CS 응대 및 어드민 대시보드용';
COMMENT ON COLUMN public.subscription_changes.change_type IS 'new:신규 | upgrade:업그레이드 | downgrade:다운그레이드 | manual_grant:수동부여 | expiry:만료 | refund:환불 | cancel:취소';
COMMENT ON COLUMN public.subscription_changes.changed_by_admin_id IS '어드민이 수동 처리한 경우 어드민 user_id, 자동(시스템/Stripe webhook)은 NULL';
