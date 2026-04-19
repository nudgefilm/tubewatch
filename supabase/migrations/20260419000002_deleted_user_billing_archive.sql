-- deleted_user_billing_archive: 탈퇴 회원 결제/구독 이력 보관 (전자상거래법 5년)
--
-- 계정 탈퇴 시 user_subscriptions 데이터를 이 테이블에 복사 후 원본 삭제.
-- purge_after 기준으로 5년 경과 후 파기 대상이 됨.

CREATE TABLE IF NOT EXISTS public.deleted_user_billing_archive (
  id                    uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  original_user_id      uuid        NOT NULL,
  email                 text,
  plan_id               text,
  billing_period        text,
  subscription_status   text,
  payment_status        text,
  renewal_at            timestamptz,
  portone_payment_id    text,
  grant_type            text,
  credits               integer,
  pending_plan_id       text,
  pending_billing_period text,
  deleted_at            timestamptz NOT NULL DEFAULT now(),
  purge_after           timestamptz NOT NULL DEFAULT (now() + interval '5 years')
);

COMMENT ON TABLE public.deleted_user_billing_archive IS
  '탈퇴 회원 결제/구독 이력. 전자상거래법에 따라 5년 보관 후 파기 대상.';

CREATE INDEX IF NOT EXISTS idx_deleted_user_billing_archive_purge_after
  ON public.deleted_user_billing_archive (purge_after);

CREATE INDEX IF NOT EXISTS idx_deleted_user_billing_archive_user_id
  ON public.deleted_user_billing_archive (original_user_id);
