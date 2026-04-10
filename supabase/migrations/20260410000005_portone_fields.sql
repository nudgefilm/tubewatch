-- PortOne V2 결제 필드 추가
ALTER TABLE user_subscriptions
  ADD COLUMN IF NOT EXISTS portone_billing_key TEXT,
  ADD COLUMN IF NOT EXISTS portone_payment_id   TEXT;

-- grant_type 에 'portone' 값 허용 (기존: 'stripe' | 'manual')
-- TEXT 컬럼이므로 별도 ENUM 변경 불필요
COMMENT ON COLUMN user_subscriptions.portone_billing_key IS 'PortOne 빌링키 (미래 재결제용)';
COMMENT ON COLUMN user_subscriptions.portone_payment_id  IS '마지막 PortOne 결제 ID';
