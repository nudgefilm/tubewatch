/**
 * Action Plan 페이지 엔진.
 * ActionPlanPageViewModel → UI 섹션별 렌더 props 변환.
 */
import type {
  ActionPlanPageViewModel,
  ActionPlanCardVm,
  ActionPlanChecklistVm,
} from "@/lib/action-plan/actionPlanPageViewModel"

const DIFFICULTY_LABEL: Record<ActionPlanCardVm["difficulty"], string> = {
  low: "하",
  medium: "중",
  high: "상",
}

const CARD_SIGNAL_MAP: Record<string, string> = {
  "metric-activity-uploads":         "채널 활동 패턴",
  "metric-activity-interval":        "채널 활동 패턴",
  "metric-audience-like":            "시청자 반응 구조",
  "metric-structure-title":          "SEO 최적화 상태",
  "metric-tags":                     "SEO 최적화 상태",
  "metric-duration":                 "콘텐츠·구조",
  "metric-growth-median":            "성장 모멘텀",
  "metric-subscription-conversion":  "구독 전환 구조",
}

/** 카드 ID → 세부 신호 태그 (키워드 밀도 등 명칭이 analysisConnection과 다를 때만) */
const CARD_SIGNAL_TAG_MAP: Record<string, string> = {
  "metric-tags": "키워드 밀도",
}

function toCardsSection(actions: ActionPlanCardVm[]) {
  return actions.map((a) => ({
    id: a.id,
    title: a.title,
    problemSummary: a.whyNeeded,
    whyNeeded: a.whyNeeded,
    howToExecute: a.executionHint.split("\n").filter(Boolean),
    expectedEffect: a.expectedEffect,
    scenarioBlocks: a.scenarioText?.split("\n").filter(Boolean) ?? [],
    priority: a.priority,
    dnaConnection: a.evidenceSource === "channel_dna" ? "채널 DNA 기반" : null,
    analysisConnection: CARD_SIGNAL_MAP[a.id] ?? "분석 스냅샷",
    signalTag: CARD_SIGNAL_TAG_MAP[a.id] ?? null,
    performancePrediction: a.performancePrediction ?? null,
    executionSpec: a.executionSpec ?? null,
    difficultyLabel: DIFFICULTY_LABEL[a.difficulty],
  }))
}

// ── 엔진 진입점 ────────────────────────────────────────────────────────────────

export function buildActionPlanPageSections(
  viewModel: ActionPlanPageViewModel,
  isStarterPlan: boolean
) {
  const cardsData = toCardsSection(
    isStarterPlan ? viewModel.actions.slice(0, 2) : viewModel.actions
  )
  const checklistData: ActionPlanChecklistVm[] = viewModel.checklistItems

  return { cardsData, checklistData }
}
