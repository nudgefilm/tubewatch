-- ============================================================
-- STEP 1: analysis_runs 컬럼 추가
-- run_type        : 'full' | 'partial'
-- requested_modules: 표준 module key 배열
--
-- NULL 해석 정책 (하위 호환):
--   run_type IS NULL          → 'full' 로 해석
--   requested_modules IS NULL → 전체 모듈로 해석
--
-- 신규 행 정책:
--   run_type 기본값 'full'
--   full 실행 시에도 requested_modules를 명시 배열로 저장 권장
--   (NULL=전체 허용은 기존 데이터 해석에만 적용)
--
-- 표준 module key:
--   action_plan | channel_dna | seo_lab | next_trend
-- ============================================================

ALTER TABLE public.analysis_runs
  ADD COLUMN IF NOT EXISTS run_type text DEFAULT 'full'
    CHECK (run_type IN ('full', 'partial')),

  ADD COLUMN IF NOT EXISTS requested_modules text[]
    CHECK (
      requested_modules IS NULL
      OR requested_modules <@ ARRAY['action_plan','channel_dna','seo_lab','next_trend']::text[]
    );

-- 컬럼 설명
COMMENT ON COLUMN public.analysis_runs.run_type IS
  '''full'' | ''partial''. NULL은 ''full''로 해석 (하위 호환). 신규 행은 DEFAULT ''full''.';

COMMENT ON COLUMN public.analysis_runs.requested_modules IS
  '요청 module key 배열. 허용값: action_plan, channel_dna, seo_lab, next_trend. '
  'NULL은 전체 모듈로 해석 (기존 데이터 한정). 신규 full 실행도 명시 배열 저장 권장.';

-- ============================================================
-- ROLLBACK (별도 실행):
--   ALTER TABLE public.analysis_runs
--     DROP COLUMN IF EXISTS run_type,
--     DROP COLUMN IF EXISTS requested_modules;
-- ============================================================
