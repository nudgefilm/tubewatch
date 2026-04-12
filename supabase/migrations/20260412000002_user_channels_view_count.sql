-- user_channels: view_count 컬럼 추가
-- YouTube channels.statistics.viewCount (채널 총 누적 조회수)
-- 분석 요청 시 YouTube API에서 갱신, avgViews 계산에 사용

ALTER TABLE public.user_channels
  ADD COLUMN IF NOT EXISTS view_count bigint;

COMMENT ON COLUMN public.user_channels.view_count IS '채널 총 누적 조회수 (YouTube statistics.viewCount) — 분석 요청 시 갱신';
