"use client"

import { NextTrendFormatSection } from "./sections/FormatSection"
import { NextTrendExecutionHints } from "./sections/ExecutionHintsSection"
import { NextTrendActionSection } from "./sections/ActionSection"
import { NextTrendEmptyState } from "./sections/EmptyState"
import { ChannelContextHeader, type ChannelContext } from "@/components/features/shared/ChannelContextHeader"
import { FeaturePaywallBlock } from "@/components/features/shared/FeaturePaywallBlock"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { AlertCircle, ArrowRight, TrendingUp } from "lucide-react"
import { EvidenceBlock } from "@/components/common/EvidenceBlock"
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
    signalStrength: vm.signalStrength,
    evidence: vm.evidence ?? [],
    expectedEffect: vm.expectedEffect,
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

const signalStrengthBadgeConfig = {
  clear: { label: "반복 신호 확인됨", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  medium: { label: "신호 감지 중", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  low: { label: "표본 부족", className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
}

function signalAction(strength: "clear" | "medium" | "low"): string {
  if (strength === "clear") return "지금 바로 실행 가능"
  if (strength === "medium") return "2~3편 테스트 후 확장"
  return "탐색 단계, 1편 테스트 권장"
}

function feasibilityHint(feasibility: number): string {
  if (feasibility >= 76) return "기존 포맷 유지 시 바로 적용 가능"
  if (feasibility >= 60) return "약간의 준비로 시작 가능"
  return "추가 리소스 필요"
}

// [1] Top Block — 왜 1순위인지 한 줄
function getTopReason(strength: "clear" | "medium" | "low"): string {
  if (strength === "clear") return "반복 신호가 가장 명확하고, 기존 흐름 유지로 바로 시도 가능한 주제입니다."
  if (strength === "medium") return "신호가 확인되고 있으며, 소규모 테스트 후 확장 가치가 있는 주제입니다."
  return "초기 신호가 감지된 단계로, 탐색 목적의 1편 테스트가 적합한 주제입니다."
}

export function NextTrendPage({ channelId = "", channelContext, viewModel, isStarterPlan = false }: NextTrendPageProps) {
  // Real data path
  if (viewModel) {
    const internal = viewModel.internal
    const allCandidates = toCandidates(internal.candidates)
    const candidates = isStarterPlan ? allCandidates.slice(0, 2) : allCandidates
    const hasLockedCandidates = isStarterPlan && allCandidates.length > 2
    const topCandidates = allCandidates.slice(0, 3)
    const formats = toFormatRecommendations(internal.format)
    const risks = toRiskMemos(internal.risk)
    const hints = toExecutionHints(internal.hints)
    const actions = toExecutionActions(internal.actions)

    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl space-y-8 p-6 lg:p-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">Next Trend</h1>
            <p className="mt-1 text-sm text-muted-foreground">내부 흐름 기반 다음 시도</p>
          </div>

          <ChannelContextHeader channelContext={channelContext} />

          {!viewModel.hasAnalysisEffective && (
            <div className="rounded-lg border border-muted px-4 py-3 text-sm text-muted-foreground">
              {viewModel.trendSummary}
            </div>
          )}

          {viewModel.hasAnalysisEffective && (
            <>
              <div className="rounded-lg border border-muted bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                {viewModel.dataPipelineNotice}
              </div>

              {/* 신호 부족 알림 */}
              {!viewModel.hasEnoughTrendSignal && (
                <div className="flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 dark:border-yellow-900/40 dark:bg-yellow-900/10">
                  <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-700 dark:text-yellow-400">
                    반복 신호가 충분하지 않습니다. 아래 후보는 현재 표본에서 도출한 초기 방향입니다. 영상이 쌓일수록 신호가 정교해집니다.
                  </p>
                </div>
              )}

              {/* [1] 다음 영상 주제 후보 */}
              <section className="space-y-4">
                <div className="border-l-4 pl-3" style={{ borderColor: "var(--primary)" }}>
                  <h2 className="text-xl font-bold tracking-tight">다음 영상 주제 후보</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">이 중 하나를 골라 다음 영상 주제로 결정하세요</p>
                </div>

                {topCandidates.length > 0 && (() => {
                  const top1 = topCandidates[0]!
                  const rest = (isStarterPlan ? topCandidates.slice(1, 2) : topCandidates.slice(1))
                  return (
                    <div className="space-y-3">
                      {/* 1순위 강조 카드 */}
                      <div className="rounded-lg border-2 border-primary/50 bg-primary/5 dark:bg-primary/10 p-5 space-y-3">
                        <div className="flex items-center gap-2 text-primary">
                          <ArrowRight className="h-4 w-4 shrink-0" />
                          <span className="text-xs font-bold uppercase tracking-wider">지금 1순위</span>
                        </div>
                        <p className="text-lg font-bold leading-snug break-words">{top1.topic}</p>
                        <p className="text-sm font-semibold text-foreground/80 leading-snug">
                          {getTopReason(top1.signalStrength)}
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className={`text-xs ${signalStrengthBadgeConfig[top1.signalStrength].className}`}>
                            {signalStrengthBadgeConfig[top1.signalStrength].label}
                          </Badge>
                          <span className="text-xs text-muted-foreground">→</span>
                          <span className="text-xs font-semibold text-foreground">
                            {signalAction(top1.signalStrength)}
                          </span>
                        </div>
                        {top1.reason && (
                          <p className="text-sm text-muted-foreground leading-relaxed">{top1.reason}</p>
                        )}
                        {top1.expectedEffect && (
                          <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-start gap-1">
                            <TrendingUp className="h-3 w-3 mt-0.5 shrink-0" />
                            {top1.expectedEffect}
                          </p>
                        )}
                        {(() => {
                          const evidenceItems = (top1.evidence ?? []).slice(0, 3)
                          return evidenceItems.length > 0
                            ? <EvidenceBlock items={evidenceItems} />
                            : null
                        })()}
                        <p className="text-sm font-semibold text-primary pt-3 border-t border-primary/20">
                          이번 업로드는 이 주제로 먼저 시도하세요
                        </p>
                      </div>

                      {/* 2순위 이후 — 소형 리스트 */}
                      {rest.length > 0 && (
                        <div className="space-y-2">
                          {rest.map((c, i) => (
                            <div key={c.id} className="flex items-center gap-3 rounded-md border bg-card px-3 py-2.5">
                              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary shrink-0">
                                {i + 2}
                              </span>
                              <span className="flex-1 text-sm font-medium leading-snug break-words min-w-0">{c.topic}</span>
                              <Badge variant="outline" className={`text-xs shrink-0 ${signalStrengthBadgeConfig[c.signalStrength].className}`}>
                                {signalStrengthBadgeConfig[c.signalStrength].label}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })()}

                {hasLockedCandidates && (
                  <FeaturePaywallBlock
                    title="지금 흐름에서 시도할 다음 후보가 더 있습니다."
                    description="Top 2 이후의 아이디어까지 열어보세요."
                    ctaLabel="지금 다음 영상 설계하기"
                    planLabel="Growth"
                    previewHint="지금 흐름에서 가장 유력한 다음 주제가 포함됩니다"
                  />
                )}
              </section>

              {/* [2] 포맷 방향 */}
              <section className="space-y-4">
                <div className="border-l-4 pl-3" style={{ borderColor: "var(--primary)" }}>
                  <h2 className="text-xl font-bold tracking-tight">포맷 방향</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">다음 영상에 적용할 길이·형식 권장</p>
                </div>
                {formats.length > 0 ? (
                  <NextTrendFormatSection data={formats} />
                ) : (
                  <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                    포맷 데이터가 아직 없습니다. 분석 후 자동으로 채워집니다.
                  </div>
                )}
                {/* 리스크 메모 — 있을 때만 인라인 표시 */}
                {internal.risk.riskyTopic && internal.risk.riskyTopic !== "-" && internal.risk.riskyTopic !== "" && (
                  <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/40 dark:bg-amber-900/10">
                    <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-300">주의할 신호</p>
                      <p className="text-sm text-amber-700 dark:text-amber-400">{internal.risk.riskyTopic}</p>
                    </div>
                  </div>
                )}
              </section>

              {/* [3] 실행 힌트 — Starter 차단 */}
              {isStarterPlan ? (
                <FeaturePaywallBlock
                  title="제목·훅·썸네일에 바로 적용할 실행 힌트가 준비되어 있습니다."
                  description="1순위 주제를 실제 영상으로 만들기 위한 구체적인 방향을 확인하세요."
                  ctaLabel="실행 힌트 + 영상 기획안 열기"
                  planLabel="Growth"
                  previewHint="제목 방향, 훅 전략, 썸네일 방향, 영상 기획안이 이어집니다"
                />
              ) : (
                <>
                  <section className="space-y-4">
                    <div className="border-l-4 pl-3" style={{ borderColor: "var(--primary)" }}>
                      <h2 className="text-xl font-bold tracking-tight">실행 힌트</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">제목·훅·썸네일에 바로 적용할 방향</p>
                    </div>
                    {hints.length > 0 ? (
                      <NextTrendExecutionHints data={hints} />
                    ) : (
                      <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                        실행 힌트 데이터가 아직 없습니다. 분석 후 자동으로 채워집니다.
                      </div>
                    )}
                  </section>

                  {/* [4] 영상 기획안 */}
                  {actions.length > 0 && (
                    <section className="space-y-4">
                      <div className="border-l-4 pl-3" style={{ borderColor: "var(--primary)" }}>
                        <h2 className="text-xl font-bold tracking-tight">영상 기획안</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">1순위 주제를 기반으로 한 초안</p>
                      </div>
                      <NextTrendActionSection data={actions} />
                    </section>
                  )}
                </>
              )}
            </>
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
          <p className="mt-1 text-sm text-muted-foreground">내부 흐름 기반 다음 시도</p>
        </div>
        <ChannelContextHeader channelContext={channelContext} />
        <NextTrendEmptyState channelId={channelId || undefined} />
      </div>
    </div>
  )
}
