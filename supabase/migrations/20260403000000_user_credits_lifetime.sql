-- Free 플랜 생애 분석 횟수 추적 + 단건 구매 크레딧 충전
-- Free users: lifetime_analyses_used < (3 + purchased_credits) 로 제한
-- Paid users: 기존 monthly credits_used 유지, purchased_credits 미사용

ALTER TABLE public.user_credits
  ADD COLUMN IF NOT EXISTS lifetime_analyses_used integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS purchased_credits integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.user_credits.lifetime_analyses_used IS 'Free 플랜 생애 누적 분석 횟수. Admin reset = 0으로 업데이트.';
COMMENT ON COLUMN public.user_credits.purchased_credits IS '단건 크레딧 구매로 충전된 횟수 (Single Pass +1, Triple Pack +3). Free 플랜의 유효 한도에 합산.';
