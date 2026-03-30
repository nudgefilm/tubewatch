/**
 * Channel DNA 전용 헬퍼 — UI 레이어에서만 사용
 * 데이터 계층(API, DB, ViewModel) 불변 원칙 준수
 */
import { makeDiagnosticLabel } from "@/lib/utils/labelUtils"

// ── 1. snake_case 패턴 키 → 사용자용 한국어 라벨·설명 ────────────────────────

const SNAKE_SIGNAL_MAP: Record<string, { label: string; description: string }> = {
  irregular_upload_interval: {
    label: "업로드 주기 불규칙",
    description: "업로드 간격이 일정하지 않아 구독자의 기대 패턴이 흔들릴 수 있습니다.",
  },
  short_video_dominant: {
    label: "쇼츠(Shorts) 중심 구조",
    description: "짧은 쇼츠 영상이 채널 콘텐츠의 주를 이루는 구조입니다.",
  },
  high_view_variance: {
    label: "조회수 변동성 높음",
    description: "영상 간 조회수 차이가 커서 성과가 일부 영상에 집중되어 있습니다.",
  },
  repeated_topic_pattern: {
    label: "특정 주제 반복 패턴",
    description: "특정 주제나 포맷이 반복적으로 등장하는 일관된 콘텐츠 패턴이 감지됩니다.",
  },
  long_video_dominant: {
    label: "롱폼 영상 중심",
    description: "긴 영상이 채널의 주요 포맷으로 운영되고 있습니다.",
  },
  medium_video_dominant: {
    label: "중간 길이 영상 중심",
    description: "중간 길이(3~10분) 영상이 채널의 주요 포맷입니다.",
  },
  consistent_upload: {
    label: "업로드 주기 안정",
    description: "업로드 간격이 비교적 일정하게 유지되고 있습니다.",
  },
  title_keyword_repetition: {
    label: "제목 키워드 반복",
    description: "제목에서 동일 키워드가 반복적으로 사용되고 있습니다.",
  },
  high_ctr: {
    label: "클릭율 높음",
    description: "제목·썸네일에 대한 클릭 반응이 우수합니다.",
  },
  low_retention: {
    label: "시청 유지율 낮음",
    description: "영상 시청 유지율이 낮아 개선이 필요합니다.",
  },
  low_upload_frequency: {
    label: "업로드 빈도 낮음",
    description: "업로드 빈도가 낮아 채널 활동성이 떨어집니다.",
  },
  high_engagement: {
    label: "높은 참여율",
    description: "댓글·좋아요 등 시청자 참여 지표가 우수합니다.",
  },
  low_seo_score: {
    label: "SEO 최적화 부족",
    description: "제목·태그·설명의 검색 최적화가 미흡합니다.",
  },
  thumbnail_inconsistency: {
    label: "썸네일 일관성 부족",
    description: "썸네일 스타일이 일관되지 않아 채널 브랜딩이 흐려집니다.",
  },
}

/**
 * snake_case 키 또는 한국어 진단 문장을 { label, description }으로 변환한다.
 * - 알려진 key: 정의된 한국어 라벨·설명 반환
 * - 한국어 문장: makeDiagnosticLabel로 라벨 압축, 원문은 설명으로 유지
 */
export function humanizeSignal(signal: string): { label: string; description: string } {
  const mapped = SNAKE_SIGNAL_MAP[signal]
  if (mapped) return mapped
  return { label: makeDiagnosticLabel(signal), description: signal }
}

// ── 2. 점수 구간별 1줄 진단 텍스트 ────────────────────────────────────────────

/**
 * 0–100 점수를 받아 전문가형 1줄 진단 문장을 반환한다.
 * null이면 데이터 부족 안내 문구를 반환한다.
 */
export function getDnaScoreInterpretation(score: number | null): string {
  if (score == null) return "분석 데이터가 충분하지 않아 수집 중입니다."
  if (score >= 80) return "안정적이고 독자적인 성과 패턴이 구축되어 있습니다."
  if (score >= 50) return "성과 변동성이 존재하며, 특정 구간의 최적화가 필요합니다."
  return "성과 구조가 불안정하여 포맷 정규화가 시급한 단계입니다."
}

// ── 3. 섹션 ScoreBar 라벨별 해석 힌트 ────────────────────────────────────────

/**
 * 섹션 ScoreBar에서 라벨+점수 조합에 따른 한 줄 해석을 반환한다.
 */
export function getSectionScoreHint(label: string, score: number): string {
  const high = score >= 65
  switch (label) {
    case "콘텐츠 구조":
      return high
        ? "포맷·길이·주제의 일관성이 잘 유지됩니다."
        : "포맷 일관성에 개선 여지가 있습니다."
    case "성과 반응":
      return high
        ? "시청자 반응 지표가 양호합니다."
        : "조회·반응 지표 개선이 필요합니다."
    case "채널 활동성":
      return high
        ? "업로드 활동이 안정적입니다."
        : "업로드 빈도·활동성을 점검하세요."
    default:
      return getDnaScoreInterpretation(score)
  }
}
