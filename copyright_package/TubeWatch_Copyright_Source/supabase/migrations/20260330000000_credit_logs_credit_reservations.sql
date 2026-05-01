-- ============================================================
-- STEP 2: credit_logs / credit_reservations 생성
--
-- 목적
--   - 기존 credits 차감 구조 유지
--   - 이후 예약/확정/실패 추적 및 RPC 전환 검증 기반 마련
--   - 이 단계는 "구조 추가"만 수행 (로직 연결 없음)
--
-- 공통 설계 원칙
--   - user_id  : uuid → auth.users(id) FK
--   - channel_id: uuid (user_channels.id 의미, FK 미적용 — analysis_runs와 동일 정책)
--   - snapshot_id: text (analysis_runs.input_snapshot_id 와 타입 통일)
--   - analysis_run_id: uuid → analysis_runs(id) FK
--   - reserved_amount: integer (user_credits.credits_used 와 동일 단위 체계)
--   - idempotency_key: nullable, UNIQUE 미적용 (STEP 9에서 재판단)
--
-- 모듈 허용값: action_plan | channel_dna | seo_lab | next_trend
-- run_type 허용값: full | partial
-- ============================================================


-- ─── credit_logs ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.credit_logs (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  channel_id       uuid        NOT NULL,
  snapshot_id      text,
  analysis_run_id  uuid        REFERENCES public.analysis_runs (id) ON DELETE SET NULL,

  run_type         text        NOT NULL
                   CHECK (run_type IN ('full', 'partial')),

  requested_modules text[]
                   CHECK (
                     requested_modules IS NULL
                     OR requested_modules <@ ARRAY['action_plan','channel_dna','seo_lab','next_trend']::text[]
                   ),

  credit_before    integer     NOT NULL,
  credit_delta     integer     NOT NULL,

  result_status    text        NOT NULL
                   CHECK (result_status IN ('requested', 'applied', 'failed')),

  failure_reason   text,
  idempotency_key  text,

  created_at       timestamptz NOT NULL DEFAULT now()
);

-- インデックス
CREATE INDEX IF NOT EXISTS credit_logs_analysis_run_id_idx
  ON public.credit_logs (analysis_run_id);

CREATE INDEX IF NOT EXISTS credit_logs_user_created_idx
  ON public.credit_logs (user_id, created_at DESC);

-- RLS
ALTER TABLE public.credit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "credit_logs_select_own"
  ON public.credit_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "credit_logs_service_all"
  ON public.credit_logs
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- コメント
COMMENT ON TABLE public.credit_logs IS
  '분석 run 당 크레딧 사용 로그. 1 run = 1 row. partial 요청 시 requested_modules 배열 기록.';

-- 부호 규칙 (STEP 9~10 구현 기준선):
--   음수(−) = 크레딧 차감 (분석 실행 소비)
--   양수(+) = 크레딧 환불/복구 (실패 환급 등)
COMMENT ON COLUMN public.credit_logs.credit_delta IS
  '크레딧 변화량. 음수 = 차감(분석 소비), 양수 = 환불/복구. credit_before 기준. STEP 9~10 구현은 이 부호 규칙을 따를 것.';

COMMENT ON COLUMN public.credit_logs.idempotency_key IS
  'STEP 9에서 중복 요청 검증용으로 사용 예정. 현재는 nullable로만 준비.';


-- ─── credit_reservations ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.credit_reservations (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  channel_id       uuid        NOT NULL,
  snapshot_id      text,
  analysis_run_id  uuid        REFERENCES public.analysis_runs (id) ON DELETE SET NULL,

  reserved_amount  integer     NOT NULL
                   CHECK (reserved_amount >= 0),

  status           text        NOT NULL
                   CHECK (status IN ('reserved', 'confirmed', 'released', 'failed')),

  idempotency_key  text,
  expires_at       timestamptz,

  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- インデックス
CREATE INDEX IF NOT EXISTS credit_reservations_analysis_run_id_idx
  ON public.credit_reservations (analysis_run_id);

CREATE INDEX IF NOT EXISTS credit_reservations_user_created_idx
  ON public.credit_reservations (user_id, created_at DESC);

-- RLS
ALTER TABLE public.credit_reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "credit_reservations_select_own"
  ON public.credit_reservations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "credit_reservations_service_all"
  ON public.credit_reservations
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- コメント
COMMENT ON TABLE public.credit_reservations IS
  '분석 실행 전 크레딧 예약 이력. reserved → confirmed/released/failed 상태 추적.';

COMMENT ON COLUMN public.credit_reservations.expires_at IS
  '예약 만료 시각. 현재 만료 처리 로직 없음 — STEP 9에서 활성화 예정.';

COMMENT ON COLUMN public.credit_reservations.idempotency_key IS
  'STEP 9에서 중복 예약 방지용으로 사용 예정. 현재는 nullable로만 준비.';


-- ============================================================
-- ROLLBACK (별도 실행):
--   DROP TABLE IF EXISTS public.credit_reservations;
--   DROP TABLE IF EXISTS public.credit_logs;
-- (credit_reservations → credit_logs 순서로 DROP — FK 의존 없으나 명시)
-- ============================================================
