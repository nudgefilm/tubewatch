"use client"

import { NextTrendFormatSection } from "./sections/FormatSection"
import { NextTrendExecutionHints } from "./sections/ExecutionHintsSection"
import { NextTrendActionSection } from "./sections/ActionSection"
import { NextTrendDataInsightsSection } from "./sections/DataInsightsSection"
import { NextTrendEmptyState } from "./sections/EmptyState"
import { ChannelContextHeader, type ChannelContext } from "@/components/features/shared/ChannelContextHeader"
import { FeaturePaywallBlock } from "@/components/features/shared/FeaturePaywallBlock"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, ArrowRight, TrendingUp } from "lucide-react"
import { EvidenceBlock } from "@/components/common/EvidenceBlock"
import type { NextTrendPageViewModel } from "@/lib/next-trend/nextTrendPageViewModel"
import { buildNextTrendPageSections, SIGNAL_STRENGTH_BADGE } from "@/lib/engines/nextTrendPageEngine"

interface NextTrendPageProps {
  channelId?: string
  channelContext?: ChannelContext
  viewModel?: NextTrendPageViewModel
  isStarterPlan?: boolean
}

function SegmentGauge({ value }: { value: number }) {
  const filled = Math.round((value / 100) * 5)
  return (
    <div className="flex gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full ${
            i < filled ? "bg-emerald-500" : "bg-slate-700"
          }`}
        />
      ))}
    </div>
  )
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="border-l-4 border-emerald-500 pl-3">
      <h2 className="text-xl font-bold tracking-tight text-slate-100">{title}</h2>
      <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
    </div>
  )
}

export function NextTrendPage({ channelId = "", channelContext, viewModel, isStarterPlan = false }: NextTrendPageProps) {
  // Real data path
  if (viewModel) {
    const {
      topCandidates, visibleCandidates: candidates, hasLockedCandidates,
      formats, hints, actions, riskSignal,
    } = buildNextTrendPageSections(viewModel, isStarterPlan)

    return (
      <div className="min-h-screen bg-slate-950">
        <div className="mx-auto max-w-7xl space-y-8 p-6 lg:p-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-100 lg:text-3xl">Next Trend</h1>
            <p className="mt-1 text-sm text-slate-500">내부 흐름 기반 다음 시도</p>
          </div>

          <ChannelContextHeader channelContext={channelContext} />

          {!viewModel.hasAnalysisEffective && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3 text-sm text-slate-400">
              {viewModel.trendSummary}
            </div>
          )}

          {viewModel.hasAnalysisEffective && (
            <>
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-md px-4 py-3 text-sm text-slate-400">
                {viewModel.dataPipelineNotice}
              </div>

              {/* 채널 활동 맥락 — 성장 모멘텀 + 업로드 주기 */}
              {(viewModel.growthMomentum != null || viewModel.avgUploadIntervalDays != null) && (
                <div className="flex flex-wrap gap-4 rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-md px-5 py-4">
                  {viewModel.growthMomentum != null && (
                    <div className="flex items-center gap-3 min-w-[200px]">
                      <div className="flex-1 space-y-2">
                        <p className="text-xs text-slate-500">성장 모멘텀</p>
                        <SegmentGauge value={viewModel.growthMomentum} />
                      </div>
                      <span className="text-sm font-bold tabular-nums text-emerald-400 shrink-0">
                        {Math.round(viewModel.growthMomentum)}
                      </span>
                    </div>
                  )}
                  {viewModel.avgUploadIntervalDays != null && (
                    <div className="space-y-1 min-w-[180px]">
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-slate-500">업로드 주기</p>
                        <span className="text-sm font-bold tabular-nums text-slate-200">
                          {viewModel.avgUploadIntervalDays.toFixed(1)}일
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
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
              )}

              {/* 신호 부족 알림 */}
              {!viewModel.hasEnoughTrendSignal && (
                <div className="flex items-start gap-3 rounded-xl border border-amber-900/40 bg-amber-900/10 px-4 py-3">
                  <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-300">
                    반복 신호가 충분하지 않습니다. 아래 후보는 현재 표본에서 도출한 초기 방향입니다. 영상이 쌓일수록 신호가 정교해집니다.
                  </p>
                </div>
              )}

              {/* SEO 상태 컨텍스트 배너 */}
              {viewModel.seoOptimization != null && (
                <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2 text-xs text-slate-400">
                  <span className="font-medium text-slate-300">SEO 최적화 상태</span>
                  <span className={`tabular-nums font-bold ${
                    viewModel.seoOptimization >= 65 ? "text-emerald-400"
                    : viewModel.seoOptimization >= 45 ? "text-amber-400"
                    : "text-rose-400"
                  }`}>{Math.round(viewModel.seoOptimization)}</span>
                  <span>/ 100 기반 키워드 추천</span>
                </div>
              )}

              {/* [1] 다음 영상 주제 후보 */}
              <section className="space-y-4">
                <SectionHeader title="다음 영상 주제 후보" subtitle="이 중 하나를 골라 다음 영상 주제로 결정하세요" />

                {topCandidates.length > 0 && (() => {
                  const top1 = topCandidates[0]!
                  const rest = (isStarterPlan ? topCandidates.slice(1, 2) : topCandidates.slice(1))
                  return (
                    <div className="space-y-3">
                      {/* 1순위 강조 카드 */}
                      <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-5 space-y-3 shadow-[0_0_20px_rgba(16,185,129,0.08)] backdrop-blur-md">
                        <div className="flex items-center gap-2 text-emerald-400">
                          <ArrowRight className="h-4 w-4 shrink-0" />
                          <span className="text-xs font-bold uppercase tracking-wider">지금 1순위</span>
                          {viewModel.growthMomentum != null && (
                            <span className="ml-auto rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-xs font-medium tabular-nums text-emerald-400">
                              성장 모멘텀 {Math.round(viewModel.growthMomentum)}
                            </span>
                          )}
                        </div>
                        <p className="text-lg font-bold leading-snug break-words text-slate-100">{top1.topic}</p>
                        <p className="text-sm font-semibold text-slate-300 leading-snug">
                          {top1.topReason}
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className={`text-xs ${top1.badge.className}`}>
                            {top1.badge.label}
                          </Badge>
                          <span className="text-xs text-slate-600">→</span>
                          <span className="text-xs font-semibold text-slate-300">
                            {top1.signalActionLabel}
                          </span>
                        </div>
                        {top1.reason && (
                          <p className="text-sm text-slate-400 leading-relaxed">{top1.reason}</p>
                        )}
                        {top1.expectedEffect && (
                          <p className="text-xs text-emerald-400 flex items-start gap-1">
                            <TrendingUp className="h-3 w-3 mt-0.5 shrink-0" />
                            {top1.expectedEffect}
                          </p>
                        )}
                        {(() => {
                          const evidenceItems = (top1.evidence ?? []).slice(0, 3)
                          if (evidenceItems.length === 0) return null
                          return (
                            <div className="space-y-1.5">
                              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">왜 이 주제를 추천했는가?</p>
                              <EvidenceBlock items={evidenceItems} />
                            </div>
                          )
                        })()}
                        <p className="text-sm font-semibold text-emerald-400 pt-3 border-t border-emerald-500/20">
                          이번 업로드는 이 주제로 먼저 시도하세요
                        </p>
                      </div>

                      {/* 2순위 이후 — 소형 리스트 */}
                      {rest.length > 0 && (
                        <div className="space-y-2">
                          {rest.map((c, i) => (
                            <div key={c.id} className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-md px-3 py-2.5">
                              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-400 shrink-0">
                                {i + 2}
                              </span>
                              <span className="flex-1 text-sm font-medium leading-snug break-words min-w-0 text-slate-200">{c.topic}</span>
                              <div className="flex shrink-0 items-center gap-1.5">
                                <Badge variant="outline" className="text-xs border-emerald-500/30 bg-emerald-500/5 text-emerald-400">
                                  신규
                                </Badge>
                                <Badge variant="outline" className={`text-xs ${c.badge.className}`}>
                                  {c.badge.label}
                                </Badge>
                              </div>
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
                <SectionHeader title="포맷 방향" subtitle="다음 영상에 적용할 길이·형식 권장" />
                {formats.length > 0 ? (
                  <NextTrendFormatSection data={formats} />
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-800 p-6 text-center text-sm text-slate-500">
                    포맷 데이터가 아직 없습니다. 분석 후 자동으로 채워집니다.
                  </div>
                )}
                {/* 리스크 메모 — 있을 때만 인라인 표시 */}
                {riskSignal.hasRisk && (
                  <div className="flex items-start gap-3 rounded-xl border border-amber-900/40 bg-amber-900/10 px-4 py-3">
                    <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium text-amber-300">주의할 신호</p>
                      <p className="text-sm text-amber-400/80">{riskSignal.topic}</p>
                    </div>
                  </div>
                )}
              </section>

              {/* [3] 데이터 인사이트 — 태그 효율성 + 시간대별 반응도 + 체류 시간 예측 */}
              {(viewModel.tagEfficiency.length > 0 || viewModel.temporalResonance != null || viewModel.watchTimeCatalyst != null) && (
                <section className="space-y-4">
                  <SectionHeader title="성공 공식 분석" subtitle="내 데이터 안에서 발견된 조회수·참여율 패턴" />
                  <NextTrendDataInsightsSection
                    tagEfficiency={viewModel.tagEfficiency}
                    temporalResonance={viewModel.temporalResonance}
                    watchTimeCatalyst={viewModel.watchTimeCatalyst}
                  />
                </section>
              )}

              {/* [4] 실행 힌트 — Starter 차단 */}
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
                    <SectionHeader title="실행 힌트" subtitle="제목·훅·썸네일에 바로 적용할 방향" />
                    {hints.length > 0 ? (
                      <NextTrendExecutionHints data={hints} />
                    ) : (
                      <div className="rounded-xl border border-dashed border-slate-800 p-6 text-center text-sm text-slate-500">
                        실행 힌트 데이터가 아직 없습니다. 분석 후 자동으로 채워집니다.
                      </div>
                    )}
                  </section>

                  {/* [4] 영상 기획안 */}
                  {actions.length > 0 && (
                    <section className="space-y-4">
                      <SectionHeader title="영상 기획안" subtitle="1순위 주제를 기반으로 한 초안" />
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
    <div className="min-h-screen bg-slate-950">
      <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-100 lg:text-3xl">Next Trend</h1>
          <p className="mt-1 text-sm text-slate-500">내부 흐름 기반 다음 시도</p>
        </div>
        <ChannelContextHeader channelContext={channelContext} />
        <NextTrendEmptyState channelId={channelId || undefined} />
      </div>
    </div>
  )
}
