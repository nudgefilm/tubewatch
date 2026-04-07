-- analysis_jobs에 과부하 재시도용 컬럼 추가
-- 503 과부하 시 job을 "queued" 상태로 전환하고 클라이언트가 자동 재시도
ALTER TABLE public.analysis_jobs
  ADD COLUMN IF NOT EXISTS retry_count  int          NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS retry_after  timestamptz;

COMMENT ON COLUMN public.analysis_jobs.retry_count IS 'Gemini 503 과부하로 인한 재시도 횟수';
COMMENT ON COLUMN public.analysis_jobs.retry_after IS '자동 재시도 가능 시각 (NULL=즉시 가능, 클라이언트 폴링 기준)';
