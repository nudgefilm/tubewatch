"use client"

import { NextTrendCandidatesSection } from "./sections/CandidatesSection"
import { NextTrendFormatSection } from "./sections/FormatSection"
import { NextTrendRiskSection } from "./sections/RiskSection"
import { NextTrendExecutionHints } from "./sections/ExecutionHintsSection"
import { NextTrendActionSection } from "./sections/ActionSection"
import { NextTrendEmptyState } from "./sections/EmptyState"
import { ChannelContextHeader, type ChannelContext } from "@/components/features/shared/ChannelContextHeader"
import { StrategicCommentCard } from "@/components/features/shared/StrategicCommentCard"
import { PageFlowConnector } from "@/components/features/shared/PageFlowConnector"
import { FeaturePaywallBlock } from "@/components/features/shared/FeaturePaywallBlock"
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
  isStarterPlan?: boolean
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

export function NextTrendPage({ channelId = "", channelContext, viewModel, isStarterPlan = false }: NextTrendPageProps) {
  // Real data path
  if (viewModel) {
    const internal = viewModel.internal
    const allCandidates = toCandidates(internal.candidates)
    const candidates = isStarterPlan ? allCandidates.slice(0, 2) : allCandidates
    const hasLockedCandidates = isStarterPlan && allCandidates.length > 2
    const formats = toFormatRecommendations(internal.format)
    const risks = toRiskMemos(internal.risk)
    const hints = toExecutionHints(internal.hints)
    const actions = toExecutionActions(internal.actions)

    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl space-y-8 p-6 lg:p-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">Next Trend</h1>
            <p className="mt-1 text-sm text-muted-foreground">다음 영상 아이디어를 지금 결정하세요</p>
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

              {/* 다음 영상의 힌트 */}
              <section className="space-y-4">
                <div className="border-l-4 pl-3" style={{ borderColor: "var(--primary)" }}>
                  <h2 className="text-xl font-bold tracking-tight">다음 영상의 힌트</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">다음 영상의 제목·훅·썸네일을 지금 결정하세요</p>
                </div>
                {hints.length > 0 ? (
                  <NextTrendExecutionHints data={hints} />
                ) : (
                  <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                    실행 힌트 데이터가 아직 없습니다. 분석 후 자동으로 채워집니다.
                  </div>
                )}
              </section>

              {/* 시청자가 기다리는 미개척 주제 */}
              <section className="space-y-4">
                <div className="border-l-4 pl-3" style={{ borderColor: "var(--primary)" }}>
                  <h2 className="text-xl font-bold tracking-tight">시청자가 기다리는 미개척 주제</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">이 중 하나를 골라 다음 영상 주제로 결정하세요</p>
                </div>
                {candidates.length > 0 ? (
                  <NextTrendCandidatesSection data={candidates} />
                ) : (
                  <NextTrendEmptyState />
                )}
                {hasLockedCandidates && (
                  <FeaturePaywallBlock
                    title="지금 흐름에서 시도할 다음 후보가 더 있습니다."
                    description="Top 2 이후의 아이디어까지 열어보세요."
                    ctaLabel="지금 다음 영상 설계하기"
                    planLabel="Growth"
                    previewHint="지금 흐름에서 가장 유력한 다음 주제가 포함됩니다"
                  />
                )}
                {candidates.length > 0 && !hasLockedCandidates && (
                  <PageFlowConnector
                    message="이 주제를 SEO 전략으로 구체화하세요."
                    ctaLabel="SEO 전략 적용하기"
                    href="/seo-lab"
                  />
                )}
              </section>

              {/* 조회수 하락 방지용 트렌드 가이드 */}
              <section className="space-y-4">
                <div className="border-l-4 pl-3" style={{ borderColor: "var(--primary)" }}>
                  <h2 className="text-xl font-bold tracking-tight">조회수 하락 방지용 트렌드 가이드</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">포맷·리스크 신호를 확인하고 방향을 조정하세요</p>
                </div>
                {formats.length > 0 && (
                  <NextTrendFormatSection data={formats} />
                )}
                {risks.length > 0 && (
                  <NextTrendRiskSection data={risks} />
                )}
                {formats.length === 0 && risks.length === 0 && (
                  <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                    포맷·리스크 데이터가 아직 없습니다. 분석 후 자동으로 채워집니다.
                  </div>
                )}
              </section>

              {/* 시장의 결핍을 채우는 법 */}
              {actions.length > 0 && (
                <section className="space-y-4">
                  <div className="border-l-4 pl-3" style={{ borderColor: "var(--primary)" }}>
                    <h2 className="text-xl font-bold tracking-tight">시장의 결핍을 채우는 법</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">지금 바로 실행할 영상 기획안입니다</p>
                  </div>
                  <NextTrendActionSection data={actions} />
                </section>
              )}
            </>
          )}

          {/* TubeWatch 전략 코멘트 */}
          {viewModel.strategicComment && (
            <StrategicCommentCard data={viewModel.strategicComment} />
          )}
        </div>
      </div>
    )
  }

  // No analysis data
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">Next Trend</h1>
          <p className="mt-1 text-sm text-muted-foreground">미래 조회수 선점 도구</p>
        </div>
        <ChannelContextHeader channelContext={channelContext} />
        <NextTrendEmptyState channelId={channelId || undefined} />
      </div>
    </div>
  )
}
