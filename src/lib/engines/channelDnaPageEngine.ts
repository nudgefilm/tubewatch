/**
 * Channel DNA 페이지 엔진.
 * InternalChannelDnaSummaryVm → UI 섹션별 렌더 props 변환.
 */
import type { InternalChannelDnaSummaryVm, FormatDistributionVm } from "@/lib/channel-dna/internalChannelDnaSummary"
import { humanizeSignal } from "@/lib/engines/channelDnaHelper"

function spreadLevelToStability(level: InternalChannelDnaSummaryVm["performanceSpreadLevel"]): string {
  if (level === "low") return "안정"
  if (level === "high") return "취약"
  return "불안정"
}

function uploadLevelToLabel(level: InternalChannelDnaSummaryVm["uploadConsistencyLevel"]): string {
  if (level === "high") return "안정적"
  if (level === "medium") return "불규칙"
  if (level === "low") return "불안정"
  return "-"
}

function contentScoreToLabel(score: number | null): string {
  if (score == null) return "판정 없음"
  if (score >= 65) return "일관됨"
  if (score >= 45) return "혼합됨"
  return "다양함"
}

function buildStructureSummary(vm: InternalChannelDnaSummaryVm) {
  const hitDependency: number | null =
    vm.topPerformerShare != null ? Math.round(vm.topPerformerShare * 100) : null
  const stability = spreadLevelToStability(vm.performanceSpreadLevel)
  const growthAxis = vm.topPatternSignals.slice(0, 2).map((s) => humanizeSignal(s).label)

  const topicConsistency: { score: number | null; label: string } | null =
    vm.contentStructureScore != null
      ? { score: vm.contentStructureScore, label: contentScoreToLabel(vm.contentStructureScore) }
      : null

  return {
    hitDependency,
    growthType: vm.dominantFormat ?? "분석 중",
    growthAxis: growthAxis.length > 0 ? growthAxis : ["패턴 분석 중"],
    structureStability: stability,
    structureStabilityScore:
      vm.performanceSpreadLevel === "low" ? 75 : vm.performanceSpreadLevel === "high" ? 30 : 50,
    summaryText: vm.channelDnaNarrative,
    topicConsistency,
  }
}

// 이 신호들은 topPatternSignals에 있더라도 강점으로 표시하지 않고 약점으로 분류한다
const INHERENTLY_NEGATIVE_SIGNALS = new Set([
  "irregular_upload_interval",
  "high_view_variance",
  "low_retention",
  "low_upload_frequency",
  "low_seo_score",
  "thumbnail_inconsistency",
])

function buildDnaCards(vm: InternalChannelDnaSummaryVm) {
  const topSignals = vm.topPatternSignals
  const positiveSignals = topSignals.filter((s) => !INHERENTLY_NEGATIVE_SIGNALS.has(s))
  const misplacedNegatives = topSignals.filter((s) => INHERENTLY_NEGATIVE_SIGNALS.has(s))

  const seenStrengthLabels = new Set<string>()
  const strengths = positiveSignals.reduce<{ title: string; description: string; score: number; tags: string[] }[]>((acc, signal, i) => {
    const { label, description } = humanizeSignal(signal)
    if (seenStrengthLabels.has(label)) return acc
    seenStrengthLabels.add(label)
    acc.push({ title: label, description, score: Math.max(60, 85 - i * 5), tags: [] })
    return acc
  }, [])
  const strengthSignalSet = new Set(positiveSignals)
  const weaknessCandidates = [...misplacedNegatives, ...vm.weakPatternSignals.filter((s) => !strengthSignalSet.has(s))]
  const seenWeaknessLabels = new Set<string>()
  const weaknesses = weaknessCandidates.reduce<{ title: string; description: string; score: number; tags: string[] }[]>((acc, signal, i) => {
    const { label, description } = humanizeSignal(signal)
    if (seenWeaknessLabels.has(label)) return acc
    seenWeaknessLabels.add(label)
    acc.push({ title: label, description, score: Math.min(45, 40 + i * 3), tags: [] })
    return acc
  }, [])
  const corePatterns = vm.dominantFormat
    ? [{ pattern: vm.dominantFormat, importance: "핵심", note: "최근 분석 기준 주요 포맷" }]
    : []
  const risks: { type: string; level: string; description: string }[] = []
  if (vm.breakoutDependencyLevel === "high") {
    risks.push({
      type: "히트 의존 리스크",
      level: "높음",
      description: vm.breakoutDependencyFallback ?? "히트 영상 의존도가 높은 구조입니다.",
    })
  } else if (vm.breakoutDependencyLevel === "medium") {
    risks.push({
      type: "히트 의존 리스크",
      level: "중간",
      description: vm.breakoutDependencyFallback ?? "히트 영상 의존도가 중간 수준입니다.",
    })
  }

  return { strengths, weaknesses, corePatterns, risks }
}

// ── 엔진 진입점 ────────────────────────────────────────────────────────────────

export function buildChannelDnaPageSections(vm: InternalChannelDnaSummaryVm) {
  return {
    structureSummary: buildStructureSummary(vm),
    dnaCards: buildDnaCards(vm),
    formatDistribution: vm.formatDistribution as FormatDistributionVm | null,
  }
}
