/**
 * DB Row → Domain 매핑 레이어
 *
 * Supabase snake_case row를 서비스 내부 표준(Domain/camelCase) 타입으로 변환한다.
 * 이 파일의 함수를 통해서만 DB Row → Domain 변환이 이루어져야 한다.
 *
 * STEP 4-2: mapDbChannelToAnalysisDomain이 /analysis 파이프라인에서 실제 호출됨.
 */

import type { ChannelInfoRow, AnalysisRunRow } from "@/lib/types/db"
import type { NormalizedChannel } from "@/lib/types/domain"
import type { AnalysisRunRecord, AnalysisRunAnalysisType, AnalysisRunStatus } from "@/lib/analysis/analysisRun"

// ─── 내부 헬퍼 ────────────────────────────────────────────────────────────────

function toAnalysisType(raw: string): AnalysisRunAnalysisType {
  const valid: AnalysisRunAnalysisType[] = [
    "base",
    "action_plan",
    "seo_lab",
    "channel_dna",
    "next_trend",
  ]
  return valid.includes(raw as AnalysisRunAnalysisType)
    ? (raw as AnalysisRunAnalysisType)
    : "base"
}

function toRunStatus(raw: string): AnalysisRunStatus {
  const valid: AnalysisRunStatus[] = ["queued", "running", "completed", "failed"]
  return valid.includes(raw as AnalysisRunStatus)
    ? (raw as AnalysisRunStatus)
    : "failed"
}

// ─── Analysis 전용 채널 도메인 타입 ──────────────────────────────────────────

/**
 * Analysis 파이프라인 전용 채널 도메인 타입.
 *
 * NormalizedChannel(분석 엔진용)은 썸네일 필드가 없다.
 * UI 표시에는 thumbnailUrl이 필요하므로, Analysis→ViewModel 경로 전용으로 이 타입을 사용한다.
 *
 * thumbnail 변환 경계 (유일한 변환 지점):
 *   UserChannelRow.thumbnail_url  (DB, snake_case)
 *   → AnalysisChannelDomain.thumbnailUrl  (Domain, camelCase)
 *
 * TODO(STEP 4-3): NormalizedChannel에 thumbnailUrl을 추가하거나 별도 DisplayChannel 타입으로
 *                 통합하면 이 타입을 제거할 수 있다.
 */
export type AnalysisChannelDomain = {
  youtubeChannelId: string
  title: string
  subscriberCount: number
  videoCount: number
  viewCount: number
  /** thumbnail_url (DB) → thumbnailUrl (Domain) 변환 완료 */
  thumbnailUrl: string | null
  channelAgeDays: number | null
}

// ─── Public 매핑 함수 ─────────────────────────────────────────────────────────

/**
 * user_channels row → NormalizedChannel 변환 (분석 엔진용, 썸네일 없음).
 * DB: channel_title → Domain: title.
 * DB: channel_id (YouTube channel id) → Domain: youtubeChannelId.
 *
 * UI 표시용 thumbnailUrl이 필요하면 mapDbChannelToAnalysisDomain() 사용.
 */
export function mapDbChannelToDomain(row: ChannelInfoRow): NormalizedChannel {
  return {
    youtubeChannelId: row.channel_id ?? "",
    title: row.channel_title ?? "",
    description: "",                          // user_channels에 description 컬럼 없음
    publishedAt: null,                        // user_channels에 publishedAt 없음
    subscriberCount: row.subscriber_count ?? 0,
    videoCount: row.video_count ?? 0,
    viewCount: row.view_count ?? 0,
    channelAgeDays: null,
  }
}

/**
 * user_channels row → AnalysisChannelDomain 변환 (Analysis 파이프라인 전용).
 *
 * [thumbnail 변환 경계]
 * UserChannelRow.thumbnail_url (DB snake_case) → AnalysisChannelDomain.thumbnailUrl (camelCase)
 * 이 함수가 /analysis 파이프라인에서 thumbnail_url의 유일한 변환 지점이다.
 */
export function mapDbChannelToAnalysisDomain(row: ChannelInfoRow): AnalysisChannelDomain {
  return {
    youtubeChannelId: row.channel_id ?? "",
    title: row.channel_title ?? "",
    subscriberCount: row.subscriber_count ?? 0,
    videoCount: row.video_count ?? 0,
    viewCount: row.view_count ?? 0,
    thumbnailUrl: row.thumbnail_url ?? null,   // ← 유일한 thumbnail 변환 지점
    channelAgeDays: null,
  }
}

/**
 * analysis_runs row(snake_case) → AnalysisRunRecord(camelCase) 변환.
 */
export function mapDbRunToDomain(row: AnalysisRunRow): AnalysisRunRecord {
  return {
    id: row.id,
    userId: row.user_id,
    channelId: row.channel_id,
    analysisType: toAnalysisType(row.analysis_type),
    status: toRunStatus(row.status),
    startedAt: row.started_at,
    completedAt: row.completed_at,
    updatedAt: row.updated_at,
    inputSnapshotId: row.input_snapshot_id,
    resultSnapshotId: row.result_snapshot_id,
    errorMessage: row.error_message,
  }
}
