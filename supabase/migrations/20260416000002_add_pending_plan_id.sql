-- user_subscriptions: 만료 후 적용될 예약 플랜 ID 컬럼 추가
--
-- 변경 사항:
-- 1. pending_plan_id 컬럼 추가
--    - 현재 구독 기간(renewal_at) 이전에 결제한 새 플랜 ID를 저장
--    - renewal_at 만료 후 getUserBillingStatus에서 plan_id로 승격됨
--    - 한 번에 하나의 예약만 허용 (payment-complete에서 중복 체크)

ALTER TABLE user_subscriptions
  ADD COLUMN IF NOT EXISTS pending_plan_id text;

COMMENT ON COLUMN user_subscriptions.pending_plan_id IS
  '만료 후 적용될 예약 플랜 ID. renewal_at 만료 시 plan_id로 승격되고 null로 초기화됨.';
