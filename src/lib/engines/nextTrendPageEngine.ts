/**
 * Next Trend 페이지 엔진.
 * NextTrendPageViewModel → UI 섹션별 렌더 props 변환.
 * 신호 강도 배지 설정, 액션 라벨 등 UI 표시 로직을 포함한다.
 */
import type { NextTrendPageViewModel } from "@/lib/next-trend/nextTrendPageViewModel"
import type {
  NextTrendCandidateVm,
  NextTrendFormatVm,
  NextTrendRiskVm,
  NextTrendHintsVm,
  NextTrendActionsVm,
} from "@/lib/next-trend/buildNextTrendInternalSpec"

// ── 신호 강도 배지 설정 ────────────────────────────────────────────────────────

export const SIGNAL_STRENGTH_BADGE = {
  clear: {
    label: "반복 신호 확인됨",
    className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  medium: {
    label: "신호 감지 중",
    className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  low: {
    label: "표본 부족",
    className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  },
} as const

// ── 내부 계산 함수 ─────────────────────────────────────────────────────────────

function signalActionLabel(strength: "clear" | "medium" | "low"): string {
  if (strength === "clear") return "지금 바로 실행 가능"
  if (strength === "medium") return "2~3편 테스트 후 확장"
  return "탐색 단계, 1편 테스트 권장"
}

function topReasonText(strength: "clear" | "medium" | "low"): string {
  if (strength === "clear") return "반복 신호가 가장 명확하고, 기존 흐름 유지로 바로 시도 가능한 주제입니다."
  if (strength === "medium") return "신호가 확인되고 있으며, 소규모 테스트 후 확장 가치가 있는 주제입니다."
  return "초기 신호가 감지된 단계로, 탐색 목적의 1편 테스트가 적합한 주제입니다."
}

function toCandidates(vms: NextTrendCandidateVm[]) {
  return vms.map((vm, i) => ({
    id: `candidate-${i}`,
    topic: vm.topic,
    reason: vm.reason,
    signal: vm.signal,
    priority: i === 0 ? ("high" as const) : i < 3 ? ("medium" as const) : ("low" as const),
    feasibility: Math.max(40, 80 - i * 8),
    source: "dna" as const,
    status: "executable" as const,
    signalStrength: vm.signalStrength,
    evidence: vm.evidence ?? [],
    expectedEffect: vm.expectedEffect,
    // 엔진에서 미리 계산한 표시용 값
    signalActionLabel: signalActionLabel(vm.signalStrength),
    topReason: topReasonText(vm.signalStrength),
    badge: SIGNAL_STRENGTH_BADGE[vm.signalStrength],
  }))
}

function toFormatRecommendations(vm: NextTrendFormatVm) {
  return [
    {
      id: "format-1",
      format: vm.recommendedFormat,
      seriesPotential: vm.seriesPotential.includes("시리즈") || vm.seriesPotential.includes("반복"),
      recommendedLength: vm.suggestedLength,
      approach: vm.seriesPotential,
      internalFit: 70,
      basedOn: "스냅샷 기반 포맷 분석",
    },
  ]
}

function toRiskMemos(vm: NextTrendRiskVm) {
  if (!vm.riskyTopic || vm.riskyTopic === "-" || vm.riskyTopic === "") return []
  const confidenceNum = vm.confidence === "높음" ? 75 : vm.confidence === "중간" ? 50 : 30
  const churnRisk =
    vm.confidence === "높음" ? ("high" as const) :
    vm.confidence === "중간" ? ("medium" as const) : ("low" as const)
  return [
    {
      id: "risk-1",
      topic: vm.riskyTopic,
      confidence: confidenceNum,
      reason: vm.confidenceBasis,
      churnRisk,
      warningPoints: [] as string[],
    },
  ]
}

function toExecutionHints(vm: NextTrendHintsVm) {
  const hints: { id: string; type: "title" | "angle" | "hook" | "thumbnail" | "start"; label: string; content: string; linkedTo: string }[] = []
  if (vm.titleDirection) hints.push({ id: "hint-title", type: "title", label: "제목 방향", content: vm.titleDirection, linkedTo: "스냅샷 기반" })
  if (vm.hook) hints.push({ id: "hint-hook", type: "hook", label: "훅 전략", content: vm.hook, linkedTo: "스냅샷 기반" })
  if (vm.thumbnail) hints.push({ id: "hint-thumbnail", type: "thumbnail", label: "썸네일 방향", content: vm.thumbnail, linkedTo: "스냅샷 기반" })
  if (vm.contentAngle) hints.push({ id: "hint-angle", type: "angle", label: "콘텐츠 각도", content: vm.contentAngle, linkedTo: "스냅샷 기반" })
  return hints
}

function toExecutionActions(vm: NextTrendActionsVm) {
  return [
    {
      id: "action-1",
      videoTitle: vm.videoPlanDraft,
      thumbnailDirection: vm.titleThumbnail,
      openingHook: vm.openingHook,
      scriptOutline: vm.scriptOutline,
      contentPlan: vm.contentPlan,
      experimentPriority: 1,
    },
  ]
}

// ── 엔진 진입점 ────────────────────────────────────────────────────────────────

export function buildNextTrendPageSections(vm: NextTrendPageViewModel, isStarterPlan: boolean) {
  const internal = vm.internal
  const allCandidates = toCandidates(internal.candidates)
  const visibleCandidates = isStarterPlan ? allCandidates.slice(0, 2) : allCandidates
  const hasLockedCandidates = isStarterPlan && allCandidates.length > 2
  const topCandidates = allCandidates.slice(0, 3)

  return {
    allCandidates,
    visibleCandidates,
    hasLockedCandidates,
    topCandidates,
    formats: toFormatRecommendations(internal.format),
    risks: toRiskMemos(internal.risk),
    hints: toExecutionHints(internal.hints),
    actions: toExecutionActions(internal.actions),
    riskSignal: {
      topic: internal.risk.riskyTopic,
      basis: internal.risk.confidenceBasis,
      hasRisk:
        !!internal.risk.riskyTopic &&
        internal.risk.riskyTopic !== "-" &&
        internal.risk.riskyTopic !== "",
    },
  }
}
