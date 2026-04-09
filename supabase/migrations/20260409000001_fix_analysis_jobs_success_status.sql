-- Fix: analysis_jobs.status='success' 레거시 행을 'completed'로 정규화
-- Reason: updateJobStep 버그로 일부 완료 분석이 'success'로 저장됨
-- analysis_jobs_status_check 제약 충돌로 버튼이 오류를 내던 문제 해결

-- 1. 기존 status check constraint 제거 (UPDATE 차단 방지)
ALTER TABLE public.analysis_jobs
  DROP CONSTRAINT IF EXISTS analysis_jobs_status_check;

-- 2. 레거시 'success' 행 → 'completed' 마이그레이션
UPDATE public.analysis_jobs
  SET status = 'completed'
  WHERE status = 'success';

-- 3. 올바른 status check constraint 재정의
ALTER TABLE public.analysis_jobs
  ADD CONSTRAINT analysis_jobs_status_check
  CHECK (status IN ('queued', 'running', 'completed', 'failed'));
