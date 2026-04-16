-- plan_id + billing_period 구조 분리
-- creator_6m / pro_6m 완전 제거 → creator/pro + billing_period 컬럼으로 통합
--
-- 변경 사항:
-- 1. billing_period 컬럼 추가 (monthly | semiannual)
-- 2. pending_billing_period 컬럼 추가 (monthly | semiannual)
-- 3. 기존 *_6m plan_id 데이터 → base plan_id + billing_period 로 분리
-- 4. pending_plan_id도 동일 분리

-- 1. billing_period 컬럼 추가
ALTER TABLE user_subscriptions
  ADD COLUMN IF NOT EXISTS billing_period text
    CHECK (billing_period IN ('monthly', 'semiannual'));

-- 2. pending_billing_period 컬럼 추가
ALTER TABLE user_subscriptions
  ADD COLUMN IF NOT EXISTS pending_billing_period text
    CHECK (pending_billing_period IN ('monthly', 'semiannual'));

-- 3. plan_id *_6m → base plan + billing_period 분리
UPDATE user_subscriptions
  SET
    billing_period = CASE
      WHEN plan_id IN ('creator_6m', 'pro_6m') THEN 'semiannual'
      WHEN plan_id IN ('creator', 'pro')        THEN 'monthly'
      ELSE NULL
    END,
    plan_id = CASE
      WHEN plan_id = 'creator_6m' THEN 'creator'
      WHEN plan_id = 'pro_6m'     THEN 'pro'
      ELSE plan_id
    END
WHERE plan_id IN ('creator', 'creator_6m', 'pro', 'pro_6m');

-- 4. pending_plan_id *_6m → base + pending_billing_period 분리
UPDATE user_subscriptions
  SET
    pending_billing_period = CASE
      WHEN pending_plan_id IN ('creator_6m', 'pro_6m') THEN 'semiannual'
      ELSE 'monthly'
    END,
    pending_plan_id = CASE
      WHEN pending_plan_id = 'creator_6m' THEN 'creator'
      WHEN pending_plan_id = 'pro_6m'     THEN 'pro'
      ELSE pending_plan_id
    END
WHERE pending_plan_id IS NOT NULL;

-- 5. NULL 방지: plan_id가 있는데 billing_period 없는 경우 monthly 기본값 설정
UPDATE user_subscriptions
  SET billing_period = 'monthly'
WHERE billing_period IS NULL
  AND plan_id IN ('creator', 'pro');

COMMENT ON COLUMN user_subscriptions.billing_period         IS '구독 기간: monthly | semiannual';
COMMENT ON COLUMN user_subscriptions.pending_billing_period IS '예약 변경 기간: monthly | semiannual';
