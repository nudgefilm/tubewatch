"use client"

import { Dna } from "lucide-react"
import { DnaStructureSummarySection } from "./sections/StructureSummarySection"
import { DnaCardsSection } from "./sections/CardsSection"
import { DnaEmptyState } from "./sections/EmptyState"
import { ChannelContextHeader, type ChannelContext } from "@/components/features/shared/ChannelContextHeader"
import { PageFlowConnector } from "@/components/features/shared/PageFlowConnector"
import { FeaturePaywallBlock } from "@/components/features/shared/FeaturePaywallBlock"
import { humanizeSignal } from "./utils/dnaHelper"
import type { ChannelDnaPageViewModel } from "@/lib/channel-dna/channelDnaPageViewModel"
import type { InternalChannelDnaSummaryVm } from "@/lib/channel-dna/internalChannelDnaSummary"

interface ChannelDnaPageProps {
  channelId?: string
  channelContext?: ChannelContext
  viewModel?: ChannelDnaPageViewModel
  isStarterPlan?: boolean
}

function spreadLevelToStability(level: InternalChannelDnaSummaryVm["performanceSpreadLevel"]): string {
  if (level === "low") return "안정"
  if (level === "high") return "취약"
  return "불안정"
}

function buildStructureSummaryFromVm(vm: InternalChannelDnaSummaryVm) {
  // topPerformerShare 없으면 null — 0과 "데이터 없음"을 구분
  const hitDependency: number | null =
    vm.topPerformerShare != null ? Math.round(vm.topPerformerShare * 100) : null
  const stability = spreadLevelToStability(vm.performanceSpreadLevel)
  const growthAxis = vm.topPatternSignals.slice(0, 2).map((s) => humanizeSignal(s).label)

  const result = {
    hitDependency,
    growthType: vm.dominantFormat ?? "분석 중",
    growthAxis: growthAxis.length > 0 ? growthAxis : ["패턴 분석 중"],
    structureStability: stability,
    structureStabilityScore:
      vm.performanceSpreadLevel === "low" ? 75 : vm.performanceSpreadLevel === "high" ? 30 : 50,
    performanceDistribution: [] as { range: string; count: number; percentage: number }[],
    summaryText: vm.channelDnaNarrative,
  }

  console.log("DNA metric debug", {
    key: "structureSummary",
    snapshot: {
      topPerformerShare: vm.topPerformerShare,
      top3Share: vm.top3Share,
      performanceSpreadLevel: vm.performanceSpreadLevel,
      dominantFormat: vm.dominantFormat,
      medianViews: vm.medianViews,
      averageViews: vm.averageViews,
    },
    computed: { stability, growthAxis },
    finalValue: { hitDependency: result.hitDependency, structureStabilityScore: result.structureStabilityScore },
  })

  return result
}

function uploadLevelToLabel(level: InternalChannelDnaSummaryVm["uploadConsistencyLevel"]): string {
  if (level === "high") return "안정적"
  if (level === "medium") return "불규칙"
  if (level === "low") return "불안정"
  return "-"
}

function buildPatternAnalysisFromVm(vm: InternalChannelDnaSummaryVm) {
  const highPerformancePatterns = vm.topPatternSignals.map((signal, i) => {
    const { label, description } = humanizeSignal(signal)
    return {
      pattern: label,
      frequency: "반복 확인됨",
      description,
      examples: [] as string[],
      score: Math.max(60, 85 - i * 5),
    }
  })
  const lowPerformancePatterns = vm.weakPatternSignals.map((signal, i) => {
    const { label, description } = humanizeSignal(signal)
    return {
      pattern: label,
      frequency: "개선 필요",
      description,
      examples: [] as never[],
      score: Math.min(45, 40 + i * 3),
    }
  })

  // 반복 제목 구조: topPatternSignals에 title_keyword_repetition이 있으면 표시
  const hasTitleRepeat = vm.topPatternSignals.includes("title_keyword_repetition")
  const titleDominant = hasTitleRepeat ? "제목 키워드 반복 패턴" : "-"

  // 업로드 주기: uploadConsistencyLevel → 표시용 레이블 (null만 차단, 값이 있으면 표시)
  const currentCycle = vm.uploadConsistencyLevel != null
    ? uploadLevelToLabel(vm.uploadConsistencyLevel)
    : "-"

  const result = {
    highPerformancePatterns,
    lowPerformancePatterns,
    titleStructure: { dominant: titleDominant, consistency: 0 },
    formatRepetition: {
      dominant: vm.dominantFormat ?? "-",
      consistency: 0,
    },
    topicClusters: [] as { topic: string; weight: number }[],
    uploadCycleImpact: {
      optimalCycle: "-",
      currentCycle,
      performanceCorrelation: vm.uploadConsistencyLevel ?? "-",
      note: vm.uploadConsistencyFallback ?? "업로드 주기 데이터가 충분하지 않습니다.",
    },
  }

  console.log("DNA metric debug", {
    key: "patternAnalysis",
    snapshot: {
      topPatternSignals: vm.topPatternSignals,
      weakPatternSignals: vm.weakPatternSignals,
      uploadConsistencyLevel: vm.uploadConsistencyLevel,
      uploadConsistencyFallback: vm.uploadConsistencyFallback,
      dominantFormat: vm.dominantFormat,
    },
    computed: { hasTitleRepeat, currentCycle },
    finalValue: {
      titleDominant: result.titleStructure.dominant,
      currentCycle: result.uploadCycleImpact.currentCycle,
      highCount: highPerformancePatterns.length,
      lowCount: lowPerformancePatterns.length,
    },
  })

  return result
}

function buildDnaCardsFromVm(vm: InternalChannelDnaSummaryVm) {
  const strengths = vm.topPatternSignals.map((signal, i) => {
    const { label, description } = humanizeSignal(signal)
    return { title: label, description, score: Math.max(60, 85 - i * 5), tags: [] as string[] }
  })
  const weaknesses = vm.weakPatternSignals.map((signal, i) => {
    const { label, description } = humanizeSignal(signal)
    return { title: label, description, score: Math.min(45, 40 + i * 3), tags: [] as string[] }
  })
  const corePatterns = vm.dominantFormat
    ? [{ pattern: vm.dominantFormat, importance: "핵심", note: "최근 분석 기준 주요 포맷" }]
    : []
  const risks = [] as { type: string; level: string; description: string }[]
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

  const result = { strengths, weaknesses, corePatterns, risks }

  console.log("DNA metric debug", {
    key: "dnaCards",
    snapshot: {
      breakoutDependencyLevel: vm.breakoutDependencyLevel,
      breakoutDependencyFallback: vm.breakoutDependencyFallback,
      dominantFormat: vm.dominantFormat,
    },
    computed: { strengthsCount: strengths.length, weaknessesCount: weaknesses.length },
    finalValue: {
      corePatterns: result.corePatterns.length,
      risks: result.risks.map((r) => r.type),
    },
  })

  return result
}

export function ChannelDnaPage({ channelId = "", channelContext, viewModel, isStarterPlan = false }: ChannelDnaPageProps) {
  // Real data path
  if (viewModel) {
    const vm = viewModel.internalChannelDnaSummary
    const structureSummary = buildStructureSummaryFromVm(vm)
    const dnaCards = buildDnaCardsFromVm(vm)

    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl space-y-8 p-6 lg:p-8">

          {/* Page Header */}
          <div>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <Dna className="size-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">Channel DNA</h1>
                <p className="mt-1 text-sm text-muted-foreground">성공 공식 추출기</p>
              </div>
            </div>
          </div>

          <ChannelContextHeader channelContext={channelContext} />

          {viewModel.extensionNotice && (
            <div className="rounded-lg border border-muted px-4 py-3 text-sm text-muted-foreground">
              {viewModel.extensionNotice}
            </div>
          )}

          {/* [1] 채널 정체성 — 타겟 시청자 + 콘텐츠 패턴 */}
          <section className="space-y-6">
            <div className="border-l-4 pl-3" style={{ borderColor: "var(--primary)" }}>
              <h2 className="text-xl font-bold tracking-tight">채널 정체성</h2>
              <p className="text-xs text-muted-foreground mt-0.5">튜브워치가 분석한 시청자층과 반복되는 콘텐츠 흐름</p>
            </div>

            {vm.targetAudience.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">타겟 시청자</p>
                <div className="flex flex-wrap gap-2">
                  {vm.targetAudience.map((audience, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-medium bg-primary/5 text-primary"
                    >
                      {audience}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {vm.contentPatterns.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">콘텐츠 패턴</p>
                <div className="space-y-2">
                  {vm.contentPatterns.map((pattern, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-lg border px-4 py-3 text-sm">
                      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                        {i + 1}
                      </span>
                      <span>{pattern}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {vm.targetAudience.length === 0 && vm.contentPatterns.length === 0 && (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                채널 정체성 데이터가 없습니다. 분석을 실행하면 자동으로 채워집니다.
              </div>
            )}
          </section>

          {/* [2] 채널 성과 패턴 — 강점·약점 */}
          <section className="space-y-4">
            <div className="border-l-4 pl-3" style={{ borderColor: "var(--primary)" }}>
              <h2 className="text-xl font-bold tracking-tight">채널 성과 패턴</h2>
              <p className="text-xs text-muted-foreground mt-0.5">데이터에서 반복 확인된 강점과 개선이 필요한 약점</p>
            </div>
            {(dnaCards.strengths.length > 0 || dnaCards.weaknesses.length > 0) ? (
              <DnaCardsSection data={dnaCards} />
            ) : (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                성과 패턴 데이터가 아직 없습니다. 분석 후 자동으로 채워집니다.
              </div>
            )}
          </section>

          {/* Paywall — Starter 전용 */}
          {isStarterPlan && (
            <FeaturePaywallBlock
              title="채널 구조를 끝까지 읽어야 반복 성장 패턴이 보입니다."
              description="전체 DNA 해석은 Growth에서 확인하세요."
              ctaLabel="지금 전체 구조 확인하기"
              planLabel="Growth"
              previewHint="다음 구간에서 반복 성장 패턴이 이어집니다"
            />
          )}

          {/* [3] 채널 구조 안정성 — Starter 차단 */}
          {!isStarterPlan && (
            <section className="space-y-4">
              <div className="border-l-4 pl-3" style={{ borderColor: "var(--primary)" }}>
                <h2 className="text-xl font-bold tracking-tight">채널 구조 안정성</h2>
                <p className="text-xs text-muted-foreground mt-0.5">성과 재현성과 지속 가능성을 결정하는 구조 변수</p>
              </div>
              <DnaStructureSummarySection data={structureSummary} />
            </section>
          )}

          {/* 다음 단계 연결 — Action Plan */}
          <PageFlowConnector
            message="이 분석을 실행 전략으로 바꾸세요."
            ctaLabel="Action Plan 보기"
            href="/action-plan"
          />

        </div>
      </div>
    )
  }

  // No analysis data
  return (
    <div className="flex flex-col gap-6 p-6">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
            <Dna className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Channel DNA</h1>
            <p className="text-sm text-muted-foreground">성공 공식 추출기</p>
          </div>
        </div>
      </header>
      <ChannelContextHeader channelContext={channelContext} />
      <DnaEmptyState channelId={channelId || undefined} />
    </div>
  )
}
