-- Engine Version 필드 추가 (Master Plan v1.2 § 3-2)
-- 분석 시점의 엔진 버전을 기록해 버전 불일치 시 캐시 무효화 판단 기준으로 사용.

ALTER TABLE public.analysis_results
  ADD COLUMN IF NOT EXISTS engine_version text;

COMMENT ON COLUMN public.analysis_results.engine_version IS
  'Master Plan v1.2: 분석 실행 시점 엔진 버전. NULL = 레거시(v1 이전). 현재 버전과 불일치 시 재분석 권장.';

ALTER TABLE public.analysis_runs
  ADD COLUMN IF NOT EXISTS engine_version text;

COMMENT ON COLUMN public.analysis_runs.engine_version IS
  'Master Plan v1.2: 확장 run 실행 시점 엔진 버전.';
