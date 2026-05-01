-- ============================================================
-- analysis_module_results: 원페이퍼 module_key 추가 + unique constraint
--
-- 문제: module_key CHECK constraint가 기존 4개 값만 허용하여
--       원페이퍼 키('analysis_report', 'channel_dna_report', 'strategy_plan')
--       INSERT 시 CHECK violation → 생성 트리거 불가 → 영구 로딩
--
-- 추가:
--   1. CHECK constraint에 3개 원페이퍼 키 추가
--   2. (snapshot_id, module_key) unique constraint 추가
--      → onConflict: "snapshot_id,module_key" upsert 정상 동작 보장
-- ============================================================

-- 1. 기존 CHECK constraint 교체
ALTER TABLE public.analysis_module_results
  DROP CONSTRAINT IF EXISTS analysis_module_results_module_key_check;

ALTER TABLE public.analysis_module_results
  ADD CONSTRAINT analysis_module_results_module_key_check
    CHECK (module_key IN (
      'action_plan',
      'channel_dna',
      'seo_lab',
      'next_trend',
      'analysis_report',
      'channel_dna_report',
      'strategy_plan'
    ));

-- 2. (snapshot_id, module_key) unique constraint 추가
--    onConflict upsert를 위해 필요
ALTER TABLE public.analysis_module_results
  ADD CONSTRAINT amr_snapshot_module_unique
    UNIQUE (snapshot_id, module_key);
