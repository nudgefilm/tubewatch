/**
 * DB(Supabase) Row 타입 레이어
 *
 * Supabase에서 select한 행(row)과 1:1로 대응되는 타입.
 * 필드명 규칙: snake_case (PostgreSQL 컬럼명 그대로).
 * thumbnail 필드: thumbnail_url.
 * 숫자 필드: number | null (DB nullable 반영).
 * 날짜 필드: string | null (ISO 8601, Supabase timestamptz → string).
 */

// ─── user_channels 테이블 ─────────────────────────────────────────────────────

/**
 * `user_channels` 행.
 * 정규 소스: src/lib/analysis/getAnalysisPageData.ts (UserChannelRow)
 * 이름 통일을 위해 ChannelInfoRow로 re-export.
 */
export type { UserChannelRow as ChannelInfoRow } from "@/lib/analysis/getAnalysisPageData"

// ─── analysis_runs 테이블 ─────────────────────────────────────────────────────

/**
 * `analysis_runs` 행.
 * camelCase 도메인 버전은 AnalysisRunRecord (src/lib/analysis/analysisRun.ts).
 */
export type AnalysisRunRow = {
  id: string
  user_id: string | null
  /** user_channels.id (YouTube channel id 아님) */
  channel_id: string
  analysis_type: "base" | "action_plan" | "seo_lab" | "channel_dna" | "next_trend"
  status: "queued" | "running" | "completed" | "failed"
  /**
   * 실행 유형. NULL은 'full'로 해석 (기존 행 하위 호환).
   * 신규 행은 반드시 명시 기록 (STEP 4 이후).
   */
  run_type: "full" | "partial" | null
  /**
   * 요청된 module key 배열. NULL은 전체 모듈로 해석 (기존 행 하위 호환).
   * 허용값: action_plan | channel_dna | seo_lab | next_trend
   */
  requested_modules: string[] | null
  started_at: string
  completed_at: string | null
  updated_at: string
  /** analysis_results.id 또는 입력 스냅샷 외부 키 */
  input_snapshot_id: string | null
  /** 메뉴별 파생 결과 row id 또는 키 */
  result_snapshot_id: string | null
  error_message: string | null
}

// ─── credit_logs 테이블 ──────────────────────────────────────────────────────

/**
 * `credit_logs` 행.
 * 1 run = 1 row. partial 요청 시 requested_modules 배열 기록.
 */
export type CreditLogRow = {
  id: string
  user_id: string
  channel_id: string
  snapshot_id: string | null
  analysis_run_id: string | null
  run_type: "full" | "partial"
  /**
   * NULL = 로그 기록 시점에 모듈 정보 미확정 (레거시 허용).
   * 신규 행은 반드시 배열로 기록.
   */
  requested_modules: string[] | null
  credit_before: number
  /** 음수 = 차감(분석 소비), 양수 = 환불/복구. STEP 9~10 구현 기준선. */
  credit_delta: number
  result_status: "requested" | "applied" | "failed"
  failure_reason: string | null
  idempotency_key: string | null
  created_at: string
}

// ─── credit_reservations 테이블 ──────────────────────────────────────────────

/**
 * `credit_reservations` 행.
 * 예약 생성 / 확정(confirmed) / 해제(released) / 실패(failed) 추적.
 */
export type CreditReservationRow = {
  id: string
  user_id: string
  channel_id: string
  snapshot_id: string | null
  analysis_run_id: string | null
  reserved_amount: number
  status: "reserved" | "confirmed" | "released" | "failed"
  idempotency_key: string | null
  expires_at: string | null
  created_at: string
  updated_at: string
}

// ─── analysis_module_results 테이블 ─────────────────────────────────────────

/**
 * `analysis_module_results` 행.
 * 모듈 단위 분석 결과. partial 실행 지원용. analysis_results와 독립 운영.
 *
 * 부호/정책:
 *   - `result`: JSONB payload, 스키마는 module_key별 상이
 *   - `analyzed_at`: 해당 module 완료 시점 (run 전체 시점과 다를 수 있음)
 *   - partial 실행 시 analysis_results와 일시적 불일치 허용 (STEP 7에서 처리)
 */
export type AnalysisModuleResultRow = {
  id: string
  analysis_run_id: string | null
  user_id: string
  channel_id: string
  /** analysis_results.id 또는 외부 스냅샷 키. FK 미적용. */
  snapshot_id: string | null
  module_key: "action_plan" | "channel_dna" | "seo_lab" | "next_trend"
  /** 해당 module 분석 결과 payload (JSONB). */
  result: Record<string, unknown>
  status: "pending" | "completed" | "failed"
  error_message: string | null
  /** 해당 module 분석 완료 시점. run 전체 시점과 독립. */
  analyzed_at: string
  created_at: string
  updated_at: string
}

// ─── analysis_results 테이블 ─────────────────────────────────────────────────

/**
 * `analysis_results` 행.
 * 정규 소스: src/lib/server/analysis/storageTypes.ts (AnalysisResultRecord)
 */
export type { AnalysisResultRecord } from "@/lib/server/analysis/storageTypes"
