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
    analysisConnection: "분석 스냅샷",
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
