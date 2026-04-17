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
    icon: false,
  },
  medium: {
    label: "신호감지",
    className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    icon: true,
  },
  low: {
    label: "표본 부족",
    className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    icon: false,
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

function feasibilityFromSignal(strength: "clear" | "medium" | "low"): number {
  if (strength === "clear") return 85
  if (strength === "medium") return 65
  return 45
}

function toCandidates(vms: NextTrendCandidateVm[]) {
  return vms.map((vm, i) => ({
    id: `candidate-${i}`,
    rank: i + 1,
    topic: vm.topic,
    title: vm.topic,
    reason: vm.reason,
    signal: vm.signal,
    priority: i === 0 ? ("high" as const) : i < 3 ? ("medium" as const) : ("low" as const),
    feasibility: feasibilityFromSignal(vm.signalStrength),
    source: "dna" as const,
    status: "executable" as const,
    signalStrength: vm.signalStrength,
    evidence: vm.evidence ?? [],
    expectedEffect: vm.expectedEffect,
    // 엔진에서 미리 계산한 표시용 값
    signalActionLabel: signalActionLabel(vm.signalStrength),
    topReason: topReasonText(vm.signalStrength),
    badge: SIGNAL_STRENGTH_BADGE[vm.signalStrength],
    // TopicCandidatesSection 전용 필드
    candidateStatus: vm.signalStrength === "low" ? ("new" as const) : ("signal" as const),
    description: topReasonText(vm.signalStrength),
    strategy: signalActionLabel(vm.signalStrength),
    analysis: vm.reason,
    tip: vm.expectedEffect ?? null,
    sourceLabel: vm.evidence?.[0]?.value ?? "튜브워치 채널 분석 추천",
    cta: i === 0 ? "이번 업로드는 이 주제로 먼저 시도하세요" : null,
  }))
}

function parseDurationFromHint(s: string): { seconds: number; minutes: number } {
  const secMatch = s.match(/약\s*([\d,]+)\s*초/)
  const minMatch = s.match(/약\s*(\d+)\s*분/)
  const seconds = secMatch ? parseInt(secMatch[1].replace(/,/g, "")) : 0
  const minutes = minMatch ? parseInt(minMatch[1]) : seconds > 0 ? Math.round(seconds / 60) : 0
  return { seconds, minutes }
}

function deriveShortLongPct(headline: string): { short: number; long: number } {
  const h = headline.toLowerCase()
  if (h.includes("짧은") || h.includes("숏폼")) return { short: 60, long: 40 }
  if (h.includes("긴") || h.includes("롱폼")) return { short: 25, long: 75 }
  return { short: 35, long: 65 }
}

function extractApproachKeywords(text: string): { text: string; type: "signal" | "action" }[] {
  const result: { text: string; type: "signal" | "action" }[] = []
  // 신호 식별어: 관찰된 사실을 나타내는 핵심 단어
  const signals = ["신호", "패턴", "편차"]
  // 실행 지시 구문: 구체적인 행동 문구 (긴 것 먼저 — 부분 겹침 방지)
  const actions = [
    "시리즈로 명시화", "회차 표기", "테스트 후 확장", "1편 테스트",
    "바로 제작하세요", "기획하세요", "실험하세요", "전환하세요",
  ]
  for (const w of signals) {
    if (text.includes(w) && !result.find(k => k.text === w)) result.push({ text: w, type: "signal" })
  }
  for (const w of actions) {
    if (text.includes(w) && !result.find(k => k.text === w)) result.push({ text: w, type: "action" })
  }
  return result
}

function toFormatRecommendations(vm: NextTrendFormatVm) {
  const { seconds, minutes } = parseDurationFromHint(vm.suggestedLength)
  const { short, long } = deriveShortLongPct(vm.recommendedFormat)
  return [
    {
      id: "format-1",
      format: vm.recommendedFormat,
      headline: vm.recommendedFormat,
      seriesPotential: vm.seriesPotential.includes("시리즈") || vm.seriesPotential.includes("반복"),
      recommendedLength: vm.suggestedLength,
      seconds,
      minutes,
      shortPct: short,
      longPct: long,
      approach: vm.seriesPotential,
      approachKeywords: extractApproachKeywords(vm.seriesPotential),
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
      whyThisTopic: vm.whyThisTopic,
      painPoint: vm.painPoint,
      titleCandidates: vm.titleCandidates,
      recommendedTags: vm.recommendedTags,
      exitPrevention: vm.exitPrevention,
      expectedReaction: vm.expectedReaction,
      viewingPoints: vm.viewingPoints,
      experimentPriority: 1,
      videoPlanDocument: vm.videoPlanDocument,
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
    executionHintDocument: internal.hints.executionHintDocument ?? null,
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
