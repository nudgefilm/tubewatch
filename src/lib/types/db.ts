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
  started_at: string
  completed_at: string | null
  updated_at: string
  /** analysis_results.id 또는 입력 스냅샷 외부 키 */
  input_snapshot_id: string | null
  /** 메뉴별 파생 결과 row id 또는 키 */
  result_snapshot_id: string | null
  error_message: string | null
}

// ─── analysis_results 테이블 ─────────────────────────────────────────────────

/**
 * `analysis_results` 행.
 * 정규 소스: src/lib/server/analysis/storageTypes.ts (AnalysisResultRecord)
 */
export type { AnalysisResultRecord } from "@/lib/server/analysis/storageTypes"
