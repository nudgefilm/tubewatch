-- ============================================================
-- STEP 3: analysis_module_results 생성
--
-- 목적
--   - partial 분석 지원을 위한 모듈 단위 결과 저장소
--   - 기존 analysis_results 수정 없이 별도 테이블로 분리
--   - 1 run 내에서 module별 결과를 개별 row로 누적
--   - full 실행 시에도 module 단위 저장 가능 (선택적)
--
-- analysis_results와의 관계 정책
--   - analysis_results: 전체 베이스 스냅샷 (Source of Truth, 불변)
--   - analysis_module_results: 모듈 단위 파생 결과 (추가/갱신 허용)
--   - partial 실행 시 일시적 불일치 허용 → STEP 7에서 UI/해석 레이어 처리
--   - partial 실행 시 analysis_results 수정 절대 금지
--
-- snapshot_id 타입: text (analysis_runs.input_snapshot_id text 와 일치)
--   ※ 지시문 원안은 uuid였으나 기존 정책과 불일치 → text로 통일
--
-- analyzed_at 정책
--   - 각 module row마다 개별 기록 (full/partial 시점 불일치 허용)
--   - "전체 리포트 시점" ≠ "모듈 시점" 구조적으로 허용
-- ============================================================

CREATE TABLE IF NOT EXISTS public.analysis_module_results (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),

  analysis_run_id  uuid
                   REFERENCES public.analysis_runs (id) ON DELETE SET NULL,

  user_id          uuid        NOT NULL
                   REFERENCES auth.users (id) ON DELETE CASCADE,

  -- FK 미적용 (analysis_runs와 동일 정책)
  channel_id       uuid        NOT NULL,

  -- FK 미적용 (참조 대상 불명확 — text 타입으로 통일)
  snapshot_id      text,

  module_key       text        NOT NULL
                   CHECK (module_key IN (
                     'action_plan',
                     'channel_dna',
                     'seo_lab',
                     'next_trend'
                   )),

  result           jsonb       NOT NULL,

  status           text        NOT NULL
                   CHECK (status IN ('pending', 'completed', 'failed')),

  error_message    text,

  -- 해당 module 분석 시점. run 전체 완료 시점과 다를 수 있음 (허용).
  analyzed_at      timestamptz NOT NULL,

  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- ─── 인덱스 ────────────────────────────────────────────────────────────────────

-- run별 모듈 결과 조회
CREATE INDEX IF NOT EXISTS amr_analysis_run_id_idx
  ON public.analysis_module_results (analysis_run_id);

-- snapshot 기준 전체 모듈 조회
CREATE INDEX IF NOT EXISTS amr_channel_snapshot_idx
  ON public.analysis_module_results (channel_id, snapshot_id);

-- 모듈 타입별 조회
CREATE INDEX IF NOT EXISTS amr_module_key_idx
  ON public.analysis_module_results (module_key);

-- 사용자별 최신순 조회
CREATE INDEX IF NOT EXISTS amr_user_created_idx
  ON public.analysis_module_results (user_id, created_at DESC);

-- snapshot + module 복합 조회 최적화 (선택)
CREATE INDEX IF NOT EXISTS amr_channel_snapshot_module_idx
  ON public.analysis_module_results (channel_id, snapshot_id, module_key);

-- ─── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE public.analysis_module_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "amr_select_own"
  ON public.analysis_module_results
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "amr_service_all"
  ON public.analysis_module_results
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ─── 코멘트 ────────────────────────────────────────────────────────────────────

COMMENT ON TABLE public.analysis_module_results IS
  '모듈 단위 분석 결과 저장소. partial 실행 지원. analysis_results와 독립 운영.';

COMMENT ON COLUMN public.analysis_module_results.snapshot_id IS
  'analysis_results.id 또는 외부 스냅샷 키. FK 미적용 (참조 대상 불명확).';

COMMENT ON COLUMN public.analysis_module_results.result IS
  '해당 module의 분석 결과 payload (JSONB). 스키마는 module_key별 상이.';

COMMENT ON COLUMN public.analysis_module_results.analyzed_at IS
  '해당 module 분석 완료 시점. run 전체 시점(analysis_runs.completed_at)과 다를 수 있음.';

COMMENT ON COLUMN public.analysis_module_results.updated_at IS
  'partial 재실행 시 갱신. 동일 run+module 재적재 이력 추적용.';


-- ============================================================
-- ROLLBACK (별도 실행):
--   DROP TABLE IF EXISTS public.analysis_module_results;
-- ============================================================
