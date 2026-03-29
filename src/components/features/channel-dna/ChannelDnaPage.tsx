"use client"

import { Dna } from "lucide-react"
import { DnaStructureSummarySection } from "./sections/StructureSummarySection"
import { DnaPatternAnalysisSection } from "./sections/PatternAnalysisSection"
import { DnaCardsSection } from "./sections/CardsSection"
import { DnaEmptyState } from "./sections/EmptyState"
import { ChannelContextHeader, type ChannelContext } from "@/components/features/shared/ChannelContextHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScoreBar } from "@/components/ui/ScoreBar"
import { makeDiagnosticLabel } from "@/lib/utils/labelUtils"
import { StrategicCommentCard } from "@/components/features/shared/StrategicCommentCard"
import type { ChannelDnaPageViewModel } from "@/lib/channel-dna/channelDnaPageViewModel"
import type { InternalChannelDnaSummaryVm } from "@/lib/channel-dna/internalChannelDnaSummary"

interface ChannelDnaPageProps {
  channelId?: string
  channelContext?: ChannelContext
  viewModel?: ChannelDnaPageViewModel
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
  const growthAxis = vm.topPatternSignals.slice(0, 2) as string[]
  return {
    hitDependency,
    growthType: vm.dominantFormat ?? "분석 중",
    growthAxis: growthAxis.length > 0 ? growthAxis : ["패턴 분석 중"],
    structureStability: stability,
    structureStabilityScore:
      vm.performanceSpreadLevel === "low" ? 75 : vm.performanceSpreadLevel === "high" ? 30 : 50,
    performanceDistribution: [] as { range: string; count: number; percentage: number }[],
    summaryText: vm.channelDnaNarrative,
  }
}

function buildPatternAnalysisFromVm(vm: InternalChannelDnaSummaryVm) {
  const highPerformancePatterns = vm.topPatternSignals.map((signal) => ({
    pattern: makeDiagnosticLabel(signal),
    frequency: "최근 분석",
    description: signal,
    examples: [] as string[],
  }))
  const lowPerformancePatterns = vm.weakPatternSignals.map((signal) => ({
    pattern: makeDiagnosticLabel(signal),
    frequency: "최근 분석",
    description: signal,
    examples: [] as never[],
  }))
  return {
    highPerformancePatterns,
    lowPerformancePatterns,
    titleStructure: { dominant: "-", consistency: 0 },
    formatRepetition: {
      dominant: vm.dominantFormat ?? "-",
      consistency: 0,
    },
    topicClusters: [] as { topic: string; weight: number }[],
    uploadCycleImpact: {
      optimalCycle: "-",
      currentCycle: "-",
      performanceCorrelation: vm.uploadConsistencyLevel ?? "-",
      note: vm.uploadConsistencyFallback ?? "업로드 주기 데이터가 충분하지 않습니다.",
    },
  }
}

function buildDnaCardsFromVm(vm: InternalChannelDnaSummaryVm) {
  const strengths = vm.topPatternSignals.map((signal, i) => ({
    title: makeDiagnosticLabel(signal),
    description: signal,
    score: Math.max(60, 85 - i * 5),
    tags: [] as string[],
  }))
  const weaknesses = vm.weakPatternSignals.map((signal, i) => ({
    title: makeDiagnosticLabel(signal),
    description: signal,
    score: Math.min(45, 40 + i * 3),
    tags: [] as string[],
  }))
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
  return { strengths, weaknesses, corePatterns, risks }
}

export function ChannelDnaPage({ channelId = "", channelContext, viewModel }: ChannelDnaPageProps) {
  // Real data path
  if (viewModel) {
    const vm = viewModel.internalChannelDnaSummary
    const structureSummary = buildStructureSummaryFromVm(vm)
    const patternAnalysis = buildPatternAnalysisFromVm(vm)
    const dnaCards = buildDnaCardsFromVm(vm)

    return (
      <div className="flex flex-col gap-6 p-6">
        <header className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <Dna className="size-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Channel DNA</h1>
              <p className="text-sm text-muted-foreground">
                채널 성과가 발생하는 구조를 해석합니다
              </p>
            </div>
          </div>
        </header>

        <ChannelContextHeader channelContext={channelContext} />

        {viewModel.extensionNotice && (
          <div className="rounded-lg border border-muted px-4 py-3 text-sm text-muted-foreground">
            {viewModel.extensionNotice}
          </div>
        )}

        {/* A. 성과 구조 요약 */}
        <DnaStructureSummarySection data={structureSummary} />

        {/* A-1. 구간 점수 (radarProfile 실데이터 기반) */}
        {vm.radarProfile && (() => {
          const [activity, response, structure] = vm.radarProfile.channel
          const items = [
            { label: "콘텐츠 구조", score: structure },
            { label: "성과 반응", score: response },
            { label: "채널 활동성", score: activity },
          ].filter((x): x is { label: string; score: number } => x.score != null)
          if (items.length === 0) return null
          return (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">구간 점수</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {items.map((item) => (
                  <ScoreBar key={item.label} label={item.label} score={item.score} />
                ))}
                <p className="text-xs text-muted-foreground pt-1">
                  채널 활동·반응·구조·SEO·성장 기준 (0–100 구간 점수)
                </p>
              </CardContent>
            </Card>
          )
        })()}

        {/* B. 반복 패턴 분석 */}
        {(patternAnalysis.highPerformancePatterns.length > 0 ||
          patternAnalysis.lowPerformancePatterns.length > 0) && (
          <DnaPatternAnalysisSection data={patternAnalysis} />
        )}

        {/* C. DNA 카드 */}
        {(dnaCards.strengths.length > 0 || dnaCards.weaknesses.length > 0) && (
          <DnaCardsSection data={dnaCards} />
        )}

        {/* D. Strategic Comment */}
        {viewModel.strategicComment && (
          <StrategicCommentCard data={viewModel.strategicComment} />
        )}
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
            <p className="text-sm text-muted-foreground">
              채널 성과가 발생하는 구조를 해석합니다
            </p>
          </div>
        </div>
      </header>
      <ChannelContextHeader channelContext={channelContext} />
      <DnaEmptyState channelId={channelId || undefined} />
    </div>
  )
}
