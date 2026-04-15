-- user_subscriptions: PortOne 결제 연동을 위한 스키마 보강
--
-- 변경 사항:
-- 1. grant_type CHECK constraint에 'portone' 추가
-- 2. renewal_at 컬럼 추가 (PortOne 결제 기준 만료일)
-- 3. payment_status 컬럼 추가 (결제 상태 추적 + 중복 방지)

-- 1. grant_type 확장
ALTER TABLE user_subscriptions DROP CONSTRAINT IF EXISTS user_subscriptions_grant_type_check;
ALTER TABLE user_subscriptions ADD CONSTRAINT user_subscriptions_grant_type_check
  CHECK (grant_type IN ('stripe', 'manual', 'portone'));

-- 2. renewal_at 추가
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS renewal_at timestamptz;

-- 3. payment_status 추가
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS payment_status text
  CHECK (payment_status IN ('pending', 'paid', 'failed', 'canceled'));

COMMENT ON COLUMN user_subscriptions.renewal_at IS 'PortOne 결제 기준 구독 만료일 (current_period_end와 병용)';
COMMENT ON COLUMN user_subscriptions.payment_status IS '결제 상태: pending(진행중) | paid(완료) | failed(실패) | canceled(취소)';
