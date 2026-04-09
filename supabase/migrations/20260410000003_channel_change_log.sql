-- channel_change_log: 채널 교체 이력 및 월별 횟수 추적
--
-- 목적:
-- 1. 채널 교체 횟수 제한 (플랜 채널 수의 2배, 매월 갱신) 집계
-- 2. 교체 시 기존 채널 데이터 삭제 사실 기록 (CS 분쟁 대비)

CREATE TABLE IF NOT EXISTS public.channel_change_log (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  removed_channel_id  text        NOT NULL,
  added_channel_id    text        NOT NULL,
  changed_at          timestamptz NOT NULL DEFAULT now(),
  -- 'YYYY-MM' 형식: 월별 교체 횟수 집계 기준
  change_month        text        NOT NULL GENERATED ALWAYS AS
                        (to_char(changed_at AT TIME ZONE 'UTC', 'YYYY-MM')) STORED
);

CREATE INDEX IF NOT EXISTS idx_channel_change_log_user_id
  ON public.channel_change_log(user_id);

CREATE INDEX IF NOT EXISTS idx_channel_change_log_user_month
  ON public.channel_change_log(user_id, change_month);

ALTER TABLE public.channel_change_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own channel changes"
  ON public.channel_change_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can do all"
  ON public.channel_change_log FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

COMMENT ON TABLE public.channel_change_log IS '채널 교체 이력 — 월별 교체 횟수 제한 및 CS 분쟁 대비';
COMMENT ON COLUMN public.channel_change_log.change_month IS 'YYYY-MM 형식, 월별 교체 횟수 집계용 (UTC 기준)';
