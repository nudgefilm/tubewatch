-- ============================================================
-- analysis_module_results: started_at 컬럼 추가
--
-- 목적:
--   pending → timeout 감지를 위한 시작 시각 기록
--   started_at이 null이면 구 데이터 (이전 배포 전 생성된 row)
--   API route에서 started_at 기준 10분 경과 시 timeout 처리
-- ============================================================

ALTER TABLE public.analysis_module_results
  ADD COLUMN IF NOT EXISTS started_at timestamptz;

COMMENT ON COLUMN public.analysis_module_results.started_at IS
  'pending 상태 진입 시각. null = 구 데이터. timeout 감지 기준 (10분 초과 시 pending → timeout).';
