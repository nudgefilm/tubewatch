"use client"

import { NextTrendCandidatesSection } from "./sections/CandidatesSection"
import { NextTrendFormatSection } from "./sections/FormatSection"
import { NextTrendRiskSection } from "./sections/RiskSection"
import { NextTrendExecutionHints } from "./sections/ExecutionHintsSection"
import { NextTrendActionSection } from "./sections/ActionSection"
import { NextTrendSourceSplitSection } from "./sections/SourceSplitSection"
import { NextTrendVisualizationSection } from "./sections/VisualizationSection"
import { NextTrendEmptyState } from "./sections/EmptyState"
import {
  trendCandidates,
  formatRecommendations,
  riskMemos,
  executionHints,
  executionActions,
  sourceSplit,
  visualizationData,
} from "./mock-data"
import { ChannelContextHeader, type ChannelContext } from "@/components/features/shared/ChannelContextHeader"
import type { NextTrendPageViewModel } from "@/lib/next-trend/nextTrendPageViewModel"
import type {
  NextTrendCandidateVm,
  NextTrendFormatVm,
  NextTrendRiskVm,
  NextTrendHintsVm,
  NextTrendActionsVm,
} from "@/lib/next-trend/buildNextTrendInternalSpec"
import type { TrendCandidate, FormatRecommendation, RiskMemo, ExecutionHint, ExecutionAction } from "./mock-data"

interface NextTrendPageProps {
  channelId?: string
  channelContext?: ChannelContext
  viewModel?: NextTrendPageViewModel
}

function toCandidates(vms: NextTrendCandidateVm[]): TrendCandidate[] {
  return vms.map((vm, i) => ({
    id: `candidate-${i}`,
    topic: vm.topic,
    reason: vm.reason,
    signal: vm.signal,
    priority: i === 0 ? ("high" as const) : i < 3 ? ("medium" as const) : ("low" as const),
    feasibility: Math.max(40, 80 - i * 8),
    source: "dna" as const,
    status: "executable" as const,
  }))
}

function toFormatRecommendations(vm: NextTrendFormatVm): FormatRecommendation[] {
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

function toRiskMemos(vm: NextTrendRiskVm): RiskMemo[] {
  if (!vm.riskyTopic || vm.riskyTopic === "-" || vm.riskyTopic === "") return []
  const confidenceNum =
    vm.confidence === "높음" ? 75 : vm.confidence === "중간" ? 50 : 30
  const churnRisk =
    vm.confidence === "높음" ? ("high" as const) : vm.confidence === "중간" ? ("medium" as const) : ("low" as const)
  return [
    {
      id: "risk-1",
      topic: vm.riskyTopic,
      confidence: confidenceNum,
      reason: vm.confidenceBasis,
      churnRisk,
      warningPoints: [],
    },
  ]
}

function toExecutionHints(vm: NextTrendHintsVm): ExecutionHint[] {
  const hints: ExecutionHint[] = []
  if (vm.titleDirection) {
    hints.push({
      id: "hint-title",
      type: "title",
      label: "제목 방향",
      content: vm.titleDirection,
      linkedTo: "스냅샷 기반",
    })
  }
  if (vm.hook) {
    hints.push({
      id: "hint-hook",
      type: "hook",
      label: "훅 전략",
      content: vm.hook,
      linkedTo: "스냅샷 기반",
    })
  }
  if (vm.thumbnail) {
    hints.push({
      id: "hint-thumbnail",
      type: "thumbnail",
      label: "썸네일 방향",
      content: vm.thumbnail,
      linkedTo: "스냅샷 기반",
    })
  }
  if (vm.contentAngle) {
    hints.push({
      id: "hint-angle",
      type: "angle",
      label: "콘텐츠 각도",
      content: vm.contentAngle,
      linkedTo: "스냅샷 기반",
    })
  }
  return hints
}

function toExecutionActions(vm: NextTrendActionsVm): ExecutionAction[] {
  return [
    {
      id: "action-1",
      videoTitle: vm.videoPlanDraft,
      thumbnailDirection: vm.titleThumbnail,
      contentPlan: vm.contentPlan,
      experimentPriority: 1,
    },
  ]
}

export function NextTrendPage({ channelId = "", channelContext, viewModel }: NextTrendPageProps) {
  // Real data path
  if (viewModel) {
    const internal = viewModel.internal
    const candidates = toCandidates(internal.candidates)
    const formats = toFormatRecommendations(internal.format)
    const risks = toRiskMemos(internal.risk)
    const hints = toExecutionHints(internal.hints)
    const actions = toExecutionActions(internal.actions)

    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">Next Trend</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              내부 신호 기반 다음 시도 방향 제안
            </p>
          </div>

          <ChannelContextHeader channelContext={channelContext} />

          {!viewModel.hasAnalysisEffective && (
            <div className="rounded-lg border border-muted px-4 py-3 text-sm text-muted-foreground">
              {viewModel.trendSummary}
            </div>
          )}

          {viewModel.hasAnalysisEffective && (
            <>
              <div className="rounded-lg border border-muted bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
                {viewModel.dataPipelineNotice}
              </div>

              {candidates.length > 0 && (
                <NextTrendCandidatesSection data={candidates} />
              )}

              {formats.length > 0 && (
                <NextTrendFormatSection data={formats} />
              )}

              {hints.length > 0 && (
                <NextTrendExecutionHints data={hints} />
              )}

              {actions.length > 0 && (
                <NextTrendActionSection data={actions} />
              )}

              {risks.length > 0 && (
                <NextTrendRiskSection data={risks} />
              )}
            </>
          )}

          {viewModel.hasAnalysisEffective && candidates.length === 0 && (
            <NextTrendEmptyState />
          )}
        </div>
      </div>
    )
  }

  // Mock data path
  console.log("[v0] NextTrendPage rendering with channelId:", channelId)
  const hasCandidates = trendCandidates.length > 0

  if (!hasCandidates) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">Next Trend</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              내부 신호 기반 다음 시도 방향 제안
            </p>
          </div>
          <ChannelContextHeader channelContext={channelContext} />
          <NextTrendEmptyState />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-8">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">Next Trend</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            내부 신호 기반 다음 시도 방향 제안
          </p>
        </div>

        {/* 채널 컨텍스트 */}
        <ChannelContextHeader channelContext={channelContext} />

        {/* A. 다음 시도 후보 */}
        <NextTrendCandidatesSection data={trendCandidates} />

        {/* B. 포맷 추천 */}
        <NextTrendFormatSection data={formatRecommendations} />

        {/* G. 시각화 */}
        <NextTrendVisualizationSection data={visualizationData} />

        {/* F. 내부 / 확장 분리 */}
        <NextTrendSourceSplitSection data={sourceSplit} />

        {/* D. 실행 힌트 */}
        <NextTrendExecutionHints data={executionHints} />

        {/* E. 실행 액션 */}
        <NextTrendActionSection data={executionActions} />

        {/* C. 리스크 메모 */}
        <NextTrendRiskSection data={riskMemos} />
      </div>
    </div>
  )
}
