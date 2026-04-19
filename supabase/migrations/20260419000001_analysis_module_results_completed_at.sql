-- analysis_module_results: completed_at 추가 + status 인덱스
--
-- 목적:
--   1. completed_at — status=completed 전환 시각 명시적 기록
--   2. idx_analysis_module_results_status — 상태별 조회 성능 개선

ALTER TABLE public.analysis_module_results
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;

COMMENT ON COLUMN public.analysis_module_results.completed_at IS
  'status=completed 전환 시각. null = 미완료 또는 구 데이터.';

CREATE INDEX IF NOT EXISTS idx_analysis_module_results_status
  ON public.analysis_module_results (status);
