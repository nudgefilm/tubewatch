-- analysis_module_results에 module_version 추가 (Master Plan v1.2 § 3-2)
-- 모듈 분석 시점의 엔진 버전을 기록해 모듈 단위 버전 불일치 감지에 사용.

ALTER TABLE public.analysis_module_results
  ADD COLUMN IF NOT EXISTS module_version text;

COMMENT ON COLUMN public.analysis_module_results.module_version IS
  'Master Plan v1.2: 모듈 분석 실행 시점 엔진 버전. NULL = 레거시. engineVersion.ts의 CURRENT_ENGINE_VERSION과 비교해 재분석 필요 여부 판단.';
