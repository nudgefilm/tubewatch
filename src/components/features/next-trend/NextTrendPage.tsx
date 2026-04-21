"use client"

import { NextTrendFormatSection } from "./sections/FormatSection"
import { ExecutionHintDocument } from "./sections/ExecutionHintsSection"
import { NextTrendActionSection } from "./sections/ActionSection"
import { NextTrendDataInsightsSection } from "./sections/DataInsightsSection"
import { NextTrendEmptyState } from "./sections/EmptyState"
import { TopicCandidatesSection } from "./sections/TopicCandidatesSection"
import { ChannelContextHeader, type ChannelContext } from "@/components/features/shared/ChannelContextHeader"
import { FeaturePaywallBlock } from "@/components/features/shared/FeaturePaywallBlock"
import { SegmentGauge } from "@/components/ui/SegmentGauge"
import { AlertCircle, ArrowRight, TrendingUp, Lightbulb, Video, FlaskConical, Zap, FileText } from "lucide-react"
import type { NextTrendPageViewModel } from "@/lib/next-trend/nextTrendPageViewModel"
import { buildNextTrendPageSections, SIGNAL_STRENGTH_BADGE } from "@/lib/engines/nextTrendPageEngine"
import { IntegratedSummaryButton } from "@/components/features/shared/IntegratedSummaryButton"

interface NextTrendPageProps {
  channelId?: string
  channelContext?: ChannelContext
  viewModel?: NextTrendPageViewModel
  isStarterPlan?: boolean
}


export function NextTrendPage({ channelId = "", channelContext, viewModel, isStarterPlan = false }: NextTrendPageProps) {
  // Real data path
  if (viewModel) {
    const {
      topCandidates, visibleCandidates: candidates, hasLockedCandidates,
      formats, executionHintDocument, actions, riskSignal,
    } = buildNextTrendPageSections(viewModel, isStarterPlan)

    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-8">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <TrendingUp className="size-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">Next Trend</h1>
              <p className="mt-1 text-sm text-muted-foreground">내부 흐름 기반 다음 시도</p>
            </div>
          </div>

          <ChannelContextHeader channelContext={channelContext} />

          {!viewModel.hasAnalysisEffective && (
            <NextTrendEmptyState channelId={viewModel.selectedChannelId ?? undefined} />
          )}

          {viewModel.hasAnalysisEffective && (
            <>
              <div className="rounded-lg border border-muted bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
                {viewModel.dataPipelineNotice}
              </div>

              {/* 채널 활동 맥락 — 성장 모멘텀 + 업로드 주기 */}
              {(viewModel.growthMomentum != null || viewModel.avgUploadIntervalDays != null) && (
                <div className="flex justify-center">
                  <div className="inline-flex divide-x divide-border rounded-lg border border-muted">
                  {viewModel.growthMomentum != null && (
                    <div className="flex items-center gap-3 px-5 py-4">
                      <div className="space-y-1.5">
                        <p className="text-xs text-muted-foreground">성장 모멘텀</p>
                        <SegmentGauge score={viewModel.growthMomentum} label={false} />
                      </div>
                      <span className="text-sm font-semibold tabular-nums shrink-0">
                        {Math.round(viewModel.growthMomentum)}
                      </span>
                    </div>
                  )}
                  {viewModel.avgUploadIntervalDays != null && (
                    <div className="space-y-1 px-5 py-4">
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-muted-foreground">업로드 주기</p>
                        <span className="text-sm font-semibold tabular-nums">
                          {viewModel.avgUploadIntervalDays.toFixed(1)}일
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {viewModel.avgUploadIntervalDays <= 3
                          ? "현재 주기를 유지하면 구독자 복귀 기대가 유지됩니다"
                          : viewModel.avgUploadIntervalDays <= 7
                            ? "이번 주 내 업로드를 유지하면 현재 주기가 지켜집니다"
                            : viewModel.avgUploadIntervalDays <= 14
                              ? "2주 이내 업로드로 주기를 회복하는 것을 권장합니다"
                              : "업로드 간격이 길어지고 있습니다. 빠른 게시로 리듬을 되찾으세요"}
                      </p>
                    </div>
                  )}
                  </div>
                </div>
              )}

              {/* 신호 부족 알림 */}
              {!viewModel.hasEnoughTrendSignal && (
                <div className="flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 dark:border-yellow-900/40 dark:bg-yellow-900/10">
                  <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-700 dark:text-yellow-400">
                    반복 신호가 충분하지 않습니다. 아래 후보는 현재 표본에서 도출한 초기 방향입니다. 영상이 쌓일수록 신호가 정교해집니다.
                  </p>
                </div>
              )}

              {/* SEO 상태 컨텍스트 배너 */}
              {viewModel.seoOptimization != null && (
                <div className="flex items-center gap-2 rounded-md border border-muted bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">SEO 최적화 상태</span>
                  <span className={`tabular-nums font-semibold ${
                    viewModel.seoOptimization >= 65 ? "text-emerald-600"
                    : viewModel.seoOptimization >= 45 ? "text-amber-600"
                    : "text-rose-600"
                  }`}>{Math.round(viewModel.seoOptimization)}</span>
                  <span>/ 100 기반 키워드 추천</span>
                </div>
              )}

              {/* [1] 다음 영상 주제 후보 */}
              <section className="space-y-4">
                <div className="border-l-4 border-primary pl-3">
                  <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight"><Lightbulb className="size-5 shrink-0 text-primary" />다음 영상 주제 후보</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">이 중 하나를 골라 다음 영상 주제로 결정하세요</p>
                </div>

                <TopicCandidatesSection
                  data={candidates}
                  growthMomentum={viewModel.growthMomentum}
                />

                {hasLockedCandidates && (
                  <FeaturePaywallBlock
                    title="지금 흐름에서 시도할 다음 후보가 더 있습니다."
                    ctaLabel="지금 다음 영상 설계하기"
                  />
                )}
              </section>

              {/* [2] 포맷 방향 이후 — Starter 플랜 차단 */}
              {!isStarterPlan && (
                <>
                  {/* [2] 포맷 방향 */}
                  <section className="space-y-4">
                    <div className="border-l-4 border-primary pl-3">
                      <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight"><Video className="size-5 shrink-0 text-primary" />포맷 방향</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">다음 영상에 적용할 길이·형식 권장</p>
                    </div>
                    {formats.length > 0 ? (
                      <NextTrendFormatSection data={formats} />
                    ) : (
                      <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                        포맷 데이터가 아직 없습니다. 분석 후 자동으로 채워집니다.
                      </div>
                    )}
                    {riskSignal.hasRisk && (
                      <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/40 dark:bg-amber-900/10">
                        <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">주의할 신호</p>
                          <p className="text-sm text-amber-700 dark:text-amber-400">{riskSignal.topic}</p>
                        </div>
                      </div>
                    )}
                  </section>

                  {/* [3] 데이터 인사이트 */}
                  {(viewModel.tagEfficiency.length > 0 || viewModel.temporalResonance != null || viewModel.watchTimeCatalyst != null) && (
                    <section className="space-y-4">
                      <div className="border-l-4 border-primary pl-3">
                        <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight"><FlaskConical className="size-5 shrink-0 text-primary" />성공 공식 분석</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">내 데이터 안에서 발견된 조회수·참여율 패턴</p>
                      </div>
                      <NextTrendDataInsightsSection
                        tagEfficiency={viewModel.tagEfficiency}
                        temporalResonance={viewModel.temporalResonance}
                        watchTimeCatalyst={viewModel.watchTimeCatalyst}
                      />
                    </section>
                  )}

                  {/* [4] 실행 힌트 */}
                  <section className="space-y-4">
                    <div className="border-l-4 border-primary pl-3">
                      <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight"><Zap className="size-5 shrink-0 text-primary" />실행 힌트</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">제목·훅·썸네일 통합 원페이퍼</p>
                    </div>
                    <ExecutionHintDocument markdown={executionHintDocument} channelId={(viewModel.selectedChannelId ?? channelId) || undefined} />
                  </section>

                  {/* [5] 영상 기획안 */}
                  {actions.length > 0 && (
                    <section className="space-y-4">
                      <div className="border-l-4 border-primary pl-3">
                        <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight"><FileText className="size-5 shrink-0 text-primary" />영상 기획안</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">채널 데이터 기반 튜브워치 엔진 원페이퍼</p>
                      </div>
                      <NextTrendActionSection data={actions} channelId={viewModel.selectedChannelId ?? channelId} />
                      <IntegratedSummaryButton channelId={viewModel.selectedChannelId ?? channelId} channelTitle={channelContext?.title ?? null} />
                    </section>
                  )}
                </>
              )}

              {/* 페이지 마무리 — 실행 독려 */}
              <div className="rounded-xl border border-primary/20 bg-primary/5 px-5 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-medium leading-relaxed">주제도 정했고, 방향도 잡혔습니다. 이제 촬영하고 편집할 차례입니다.</p>
                <a
                  href="https://studio.youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shrink-0"
                >
                  YouTube Studio 열기
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </>
          )}

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
            <TrendingUp className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Next Trend</h1>
            <p className="text-sm text-muted-foreground">내부 흐름 기반 다음 시도</p>
          </div>
        </div>
      </header>
      <ChannelContextHeader channelContext={channelContext} />
      <NextTrendEmptyState channelId={channelId || undefined} />
    </div>
  )
}
