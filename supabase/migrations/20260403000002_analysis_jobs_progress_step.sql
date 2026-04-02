-- analysis_jobs에 progress_step 추가 (Master Plan v1.2 § 4-1)
-- 분석 진행 단계를 추적해 사용자에게 진행 상태를 표시하고 중복 요청을 방지한다.

ALTER TABLE public.analysis_jobs
  ADD COLUMN IF NOT EXISTS progress_step text
    CHECK (progress_step IN (
      'queued', 'fetching_yt', 'processing_data',
      'generating_ai', 'saving_results', 'completed', 'failed'
    ));

COMMENT ON COLUMN public.analysis_jobs.progress_step IS
  'Master Plan v1.2: 분석 진행 단계. UI 폴링으로 사용자에게 상태 표시.';
