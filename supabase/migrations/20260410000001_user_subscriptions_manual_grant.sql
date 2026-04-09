-- user_subscriptions: 수동 권한 부여 지원 및 CS용 컬럼 추가
--
-- 변경 사항:
-- 1. stripe_subscription_id NULL 허용 (이벤트 수동 부여 시 Stripe 없이 구독 생성 가능)
-- 2. grant_type: 결제 출처 구분 ('stripe' | 'manual')
-- 3. manual_grant_reason: 수동 부여 사유 기록 (어드민 CS 참조용)
-- 4. last_plan_id: 만료 후에도 이전 플랜 식별 가능 (CS 응대용)

ALTER TABLE public.user_subscriptions
  ALTER COLUMN stripe_subscription_id DROP NOT NULL;

ALTER TABLE public.user_subscriptions
  ADD COLUMN IF NOT EXISTS grant_type text NOT NULL DEFAULT 'stripe'
    CHECK (grant_type IN ('stripe', 'manual'));

ALTER TABLE public.user_subscriptions
  ADD COLUMN IF NOT EXISTS manual_grant_reason text;

ALTER TABLE public.user_subscriptions
  ADD COLUMN IF NOT EXISTS last_plan_id text;

COMMENT ON COLUMN public.user_subscriptions.grant_type IS '결제 출처: stripe(일반결제) | manual(이벤트/어드민 수동부여)';
COMMENT ON COLUMN public.user_subscriptions.manual_grant_reason IS '수동 부여 사유 (예: 베타 테스터 리워드 2026-04-10)';
COMMENT ON COLUMN public.user_subscriptions.last_plan_id IS '만료 직전 플랜 ID — 만료 후 CS 응대 시 참조용';
