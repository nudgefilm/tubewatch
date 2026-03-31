"use client"

import { Dna } from "lucide-react"
import { DnaStructureSummarySection } from "./sections/StructureSummarySection"
import { DnaPatternAnalysisSection } from "./sections/PatternAnalysisSection"
import { DnaCardsSection } from "./sections/CardsSection"
import { DnaEmptyState } from "./sections/EmptyState"
import { ChannelContextHeader, type ChannelContext } from "@/components/features/shared/ChannelContextHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StrategicCommentCard } from "@/components/features/shared/StrategicCommentCard"
import { PageFlowConnector } from "@/components/features/shared/PageFlowConnector"
import { FeaturePaywallBlock } from "@/components/features/shared/FeaturePaywallBlock"
import { humanizeSignal, getSectionScoreHint } from "./utils/dnaHelper"
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
    const patternAnalysis = buildPatternAnalysisFromVm(vm)
    const dnaCards = buildDnaCardsFromVm(vm)

    const scoreBarItems = (() => {
      if (!vm.radarProfile) return []
      const [activity, response, structure] = vm.radarProfile.channel
      return [
        { label: "콘텐츠 구조", score: structure },
        { label: "성과 반응", score: response },
        { label: "채널 활동성", score: activity },
      ].filter((x): x is { label: string; score: number } => x.score != null)
    })()

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

          {/* 내 채널을 움직이는 구조 패턴 */}
          <section className="space-y-4">
            <div className="border-l-4 pl-3" style={{ borderColor: "var(--primary)" }}>
              <h2 className="text-xl font-bold tracking-tight">내 채널을 움직이는 구조 패턴</h2>
              <p className="text-xs text-muted-foreground mt-0.5">성과를 만들어낸 패턴과 발목 잡는 패턴을 분류합니다</p>
            </div>

            {(patternAnalysis.highPerformancePatterns.length > 0 ||
              patternAnalysis.lowPerformancePatterns.length > 0) ? (
              <DnaPatternAnalysisSection data={patternAnalysis} />
            ) : (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                패턴 분석 데이터가 아직 없습니다. 분석 후 자동으로 채워집니다.
              </div>
            )}

            {scoreBarItems.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">구간 점수 · 스냅샷 기반 내부 산출값</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {scoreBarItems.map((item) => {
                    const safe = Math.max(0, Math.min(100, Math.round(item.score)))
                    const status =
                      safe >= 71
                        ? { label: "강점", emoji: "🟢", bg: "bg-emerald-500/10", text: "text-emerald-700 dark:text-emerald-400" }
                        : safe >= 41
                        ? { label: "보통", emoji: "🟡", bg: "bg-amber-500/10", text: "text-amber-700 dark:text-amber-400" }
                        : { label: "위험", emoji: "🔴", bg: "bg-red-500/10", text: "text-red-700 dark:text-red-400" }
                    return (
                      <Card key={item.label} className="rounded-xl border shadow-sm">
                        <CardContent className="pt-5 pb-4 px-5 flex flex-col gap-2.5">
                          <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">
                            {item.label}
                          </p>
                          <p className="text-5xl font-bold tabular-nums leading-none tracking-tight">
                            {safe}
                          </p>
                          <span
                            className={`inline-flex items-center gap-1 self-start rounded-full px-2.5 py-0.5 text-xs font-semibold ${status.bg} ${status.text}`}
                          >
                            {status.emoji} {status.label}
                          </span>
                          <p className="text-xs text-muted-foreground leading-snug">
                            {getSectionScoreHint(item.label, item.score)}
                          </p>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )}
          </section>

          {/* 압도적 강점 vs 치명적 약점 */}
          <section className="space-y-4">
            <div className="border-l-4 pl-3" style={{ borderColor: "var(--primary)" }}>
              <h2 className="text-xl font-bold tracking-tight">압도적 강점 vs 치명적 약점</h2>
              <p className="text-xs text-muted-foreground mt-0.5">채널 성과에 가장 큰 영향을 주는 요소를 강점과 약점으로 정리합니다</p>
            </div>
            {(dnaCards.strengths.length > 0 || dnaCards.weaknesses.length > 0) ? (
              <DnaCardsSection data={dnaCards} />
            ) : (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                강점·약점 데이터가 아직 없습니다. 분석 후 자동으로 채워집니다.
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

          {/* 떡상 영상의 반복 설계도 */}
          <section className="space-y-4">
            <div className="border-l-4 pl-3" style={{ borderColor: "var(--primary)" }}>
              <h2 className="text-xl font-bold tracking-tight">떡상 영상의 반복 설계도</h2>
              <p className="text-xs text-muted-foreground mt-0.5">성과가 반복되는 구조의 안정성과 핵심 변수를 확인합니다</p>
            </div>
            <DnaStructureSummarySection data={structureSummary} />
          </section>

          {/* TubeWatch 전략 코멘트 — 한눈에 보는 채널 정체성 */}
          {viewModel.strategicComment && (
            <StrategicCommentCard data={viewModel.strategicComment} />
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
