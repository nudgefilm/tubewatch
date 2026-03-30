/**
 * Feature Snapshot 정규화 레이어
 *
 * DB의 feature_snapshot(JSONB)을 UI-ready 타입으로 정규화한다.
 * Analysis, Channel DNA, Action Plan, SEO Lab, Next Trend 공통 사용 가능.
 *
 * 규칙:
 * - videos: 없으면 빈 배열 반환 (숨김/빈화면 금지)
 * - duration: durationSeconds(number) → "M:SS", ISO 8601 문자열도 파싱
 * - thumbnail: null-safe, 항상 string | null 반환 (빈 문자열 없음)
 * - interpretationMode: 미존재 시 "early_stage_signal_based" 기본값
 * - null / undefined / empty array → 안전한 기본값
 * - version: 스냅샷 구조로 v0/v1/v2 자동 감지
 */

import type { InterpretationMode } from "@/lib/analysis/engine/types"

// ─── 스냅샷 버전 ─────────────────────────────────────────────────────────────

/**
 * 스냅샷 버전.
 * - v0: videos/metrics/patterns 없거나 구버전 형태 (레거시)
 * - v1: videos(배열) + metrics(객체) + patterns(배열) 구조
 * - v2: v1 + interpretationMode, channelSizeTier 포함
 */
export type SnapshotVersion = "v0" | "v1" | "v2"

export function detectSnapshotVersion(raw: unknown): SnapshotVersion {
  if (!raw || typeof raw !== "object") return "v0"
  const obj = raw as Record<string, unknown>
  const hasInterpretationMode =
    typeof obj.interpretationMode === "string" ||
    typeof obj.interpretation_mode === "string"
  if (hasInterpretationMode) return "v2"
  const hasVideos = Array.isArray(obj.videos) || Array.isArray(obj.sample_videos)
  const hasMetrics = obj.metrics != null && typeof obj.metrics === "object"
  if (hasVideos && hasMetrics) return "v1"
  return "v0"
}

// ─── 정규화 타입 ─────────────────────────────────────────────────────────────

export type NormalizedSnapshotVideo = {
  title: string
  thumbnailUrl: string | null
  publishedAt: string | null
  viewCount: number | null
  /** 초 단위 재생 시간. 미존재 시 null */
  durationSeconds: number | null
  /** UI 표시용 "M:SS" 형식. 항상 문자열 (미존재 시 "—") */
  durationLabel: string
}

export type NormalizedSnapshot = {
  version: SnapshotVersion
  /** 정규화된 영상 목록. 스냅샷에 videos가 없으면 빈 배열 */
  videos: NormalizedSnapshotVideo[]
  /** 메트릭 수치 맵. 스냅샷에 없으면 null */
  metrics: Record<string, number> | null
  /** 패턴 플래그 목록. 스냅샷에 없으면 빈 배열 */
  patterns: string[]
  /** 분석 해석 모드. 미존재 시 "early_stage_signal_based" */
  interpretationMode: InterpretationMode
}

// ─── 내부 헬퍼 ───────────────────────────────────────────────────────────────

/**
 * ISO 8601 duration 문자열(PT5M13S)을 초 단위로 변환.
 * 파싱 불가 시 0 반환.
 */
function parseDurationStringToSeconds(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0
  const h = Number(match[1] || 0)
  const m = Number(match[2] || 0)
  const s = Number(match[3] || 0)
  return h * 3600 + m * 60 + s
}

/**
 * 초 단위 → UI 표시용 "M:SS" 형식 변환.
 * 유효하지 않으면 "—" 반환.
 *
 * 이 함수가 프로젝트 전체의 duration 포맷 변환 표준이다.
 * analysisPageViewModel의 formatDurationSeconds는 이 함수로 대체됨.
 */
export function formatDurationSecondsLabel(sec: number | null | undefined): string {
  if (sec == null || !Number.isFinite(sec) || sec < 0) return "—"
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, "0")}`
}

/**
 * 영상 raw 객체에서 duration 정보 추출.
 * 우선순위: durationSeconds(number) > duration(ISO 8601) > duration(legacy string) > "—"
 */
function parseDuration(r: Record<string, unknown>): {
  durationSeconds: number | null
  durationLabel: string
} {
  if (typeof r.durationSeconds === "number" && Number.isFinite(r.durationSeconds)) {
    return {
      durationSeconds: r.durationSeconds,
      durationLabel: formatDurationSecondsLabel(r.durationSeconds),
    }
  }
  if (typeof r.duration === "string" && r.duration.trim() !== "") {
    const sec = parseDurationStringToSeconds(r.duration)
    if (sec > 0) {
      return { durationSeconds: sec, durationLabel: formatDurationSecondsLabel(sec) }
    }
    // ISO 8601 형식이지만 0초 (예: PT0S) → "—"
    if (/^PT/i.test(r.duration.trim())) {
      return { durationSeconds: null, durationLabel: "—" }
    }
    // ISO 8601 파싱 불가 — 레거시 문자열 그대로 통과 (예: "5분 13초")
    return { durationSeconds: null, durationLabel: r.duration }
  }
  return { durationSeconds: null, durationLabel: "—" }
}

/**
 * 영상 raw 객체에서 thumbnail URL 추출.
 * 우선순위: thumbnail > thumbnailUrl > thumbnail_url
 * 빈 문자열은 null로 처리.
 */
function parseThumbnailUrl(r: Record<string, unknown>): string | null {
  const candidates = [r.thumbnail, r.thumbnailUrl, r.thumbnail_url]
  for (const c of candidates) {
    if (typeof c === "string" && c.trim() !== "") return c
  }
  return null
}

/**
 * feature_snapshot의 videos 배열 파싱.
 * `videos` 키 없으면 `sample_videos` 폴백.
 * 각 항목은 null-safe 처리 적용.
 */
function parseSnapshotVideos(obj: Record<string, unknown>): NormalizedSnapshotVideo[] {
  const arr = Array.isArray(obj.videos)
    ? obj.videos
    : Array.isArray(obj.sample_videos)
      ? obj.sample_videos
      : []

  const result: NormalizedSnapshotVideo[] = []
  for (const item of arr) {
    if (!item || typeof item !== "object") continue
    const r = item as Record<string, unknown>
    const title = typeof r.title === "string" ? r.title.trim() : ""
    if (!title) continue

    const thumbnailUrl = parseThumbnailUrl(r)
    const publishedAt =
      typeof r.publishedAt === "string"
        ? r.publishedAt
        : typeof r.published_at === "string"
          ? r.published_at
          : null
    const viewCount =
      typeof r.viewCount === "number"
        ? r.viewCount
        : typeof r.view_count === "number"
          ? r.view_count
          : null
    const { durationSeconds, durationLabel } = parseDuration(r)

    result.push({ title, thumbnailUrl, publishedAt, viewCount, durationSeconds, durationLabel })
  }
  return result
}

/**
 * feature_snapshot의 metrics 객체 파싱.
 * 숫자값만 포함하는 Record<string, number> 반환.
 * 스냅샷에 없거나 비어있으면 null.
 */
function parseSnapshotMetrics(obj: Record<string, unknown>): Record<string, number> | null {
  const m = obj.metrics
  if (!m || typeof m !== "object" || Array.isArray(m)) return null
  const result: Record<string, number> = {}
  for (const [k, v] of Object.entries(m as Record<string, unknown>)) {
    if (typeof v === "number" && Number.isFinite(v)) {
      result[k] = v
    }
  }
  return Object.keys(result).length > 0 ? result : null
}

/**
 * feature_snapshot의 patterns 배열 파싱.
 * 스냅샷에 없으면 빈 배열.
 */
function parseSnapshotPatterns(obj: Record<string, unknown>): string[] {
  const p = obj.patterns
  if (!Array.isArray(p)) return []
  return p
    .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
    .map((x) => x.trim())
}

const VALID_INTERPRETATION_MODES: InterpretationMode[] = [
  "early_stage_signal_based",
  "growth_stage_pattern_based",
  "scale_stage_optimization",
]

/**
 * interpretationMode 추출.
 * 미존재 또는 유효하지 않은 값 → "early_stage_signal_based" 기본값.
 */
function parseInterpretationMode(obj: Record<string, unknown>): InterpretationMode {
  const val = obj.interpretationMode ?? obj.interpretation_mode
  if (
    typeof val === "string" &&
    VALID_INTERPRETATION_MODES.includes(val as InterpretationMode)
  ) {
    return val as InterpretationMode
  }
  return "early_stage_signal_based"
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * feature_snapshot(JSONB) → NormalizedSnapshot 변환.
 *
 * 이 함수가 DB raw snapshot의 유일한 정규화 진입점이다.
 * Analysis, Channel DNA, Action Plan, SEO Lab, Next Trend 모든 Feature 페이지가
 * 이 함수를 통해 snapshot 데이터를 파싱해야 한다.
 *
 * 보장:
 * - videos: 항상 배열 (빈 배열 허용, 숨김 금지)
 * - metrics: 있으면 number-only Record, 없으면 null
 * - patterns: 항상 배열 (빈 배열 허용)
 * - interpretationMode: 항상 유효한 값 (기본 "early_stage_signal_based")
 * - durationLabel: 항상 표시 가능한 문자열 ("—" 포함)
 * - thumbnailUrl: string | null (빈 문자열 없음)
 */
export function normalizeFeatureSnapshot(raw: unknown): NormalizedSnapshot {
  const version = detectSnapshotVersion(raw)
  if (!raw || typeof raw !== "object") {
    return {
      version,
      videos: [],
      metrics: null,
      patterns: [],
      interpretationMode: "early_stage_signal_based",
    }
  }
  const obj = raw as Record<string, unknown>
  return {
    version,
    videos: parseSnapshotVideos(obj),
    metrics: parseSnapshotMetrics(obj),
    patterns: parseSnapshotPatterns(obj),
    interpretationMode: parseInterpretationMode(obj),
  }
}
