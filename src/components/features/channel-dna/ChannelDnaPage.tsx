"use client"

import { Dna, Users, BarChart3, Layers, Calendar, Film, RefreshCw, Target } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DnaStructureSummarySection } from "./sections/StructureSummarySection"
import { DnaCardsSection } from "./sections/CardsSection"
import { DnaFormatDistributionSection } from "./sections/FormatDistributionSection"
import { DnaEmptyState } from "./sections/EmptyState"
import { ChannelContextHeader, type ChannelContext } from "@/components/features/shared/ChannelContextHeader"
import { PageFlowConnector } from "@/components/features/shared/PageFlowConnector"
import { FeaturePaywallBlock } from "@/components/features/shared/FeaturePaywallBlock"
import { buildChannelDnaPageSections } from "@/lib/engines/channelDnaPageEngine"
import type { ChannelDnaPageViewModel } from "@/lib/channel-dna/channelDnaPageViewModel"
import type { FanbaseLoyaltyVm } from "@/lib/channel-dna/internalChannelDnaSummary"
import { ChannelDnaReportSection } from "./sections/ChannelDnaReportSection"

function fanbaseLoyaltyDisplay(fl: FanbaseLoyaltyVm) {
  const gradeLabel =
    fl.grade === "very_high" ? "매우 높음" : fl.grade === "average" ? "보통" : "낮음"
  const gradeBadgeClass =
    fl.grade === "very_high" ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300"
    : fl.grade === "average" ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300"
    : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300"
  const valueColor =
    fl.grade === "very_high" ? "text-emerald-600 dark:text-emerald-400"
    : fl.grade === "average" ? "text-amber-600 dark:text-amber-400"
    : "text-rose-500 dark:text-rose-400"
  const insightText =
    fl.grade === "very_high"
      ? "팬덤 결속력이 강합니다. 커뮤니티 탭을 활성화해 이 흐름을 채널 성장으로 연결하세요."
      : fl.grade === "average"
      ? "참여율이 평균 수준입니다. 영상 중반부에 좋아요·댓글 유도 멘트를 추가해 반응률을 높여보세요."
      : "시청자 반응이 낮은 편입니다. 질문형 제목이나 영상 끝 CTA를 강화해 참여를 유도하세요."
  return { gradeLabel, gradeBadgeClass, valueColor, insightText }
}

interface ChannelDnaPageProps {
  channelId?: string
  channelContext?: ChannelContext
  viewModel?: ChannelDnaPageViewModel
  isStarterPlan?: boolean
}

export function ChannelDnaPage({ channelId = "", channelContext, viewModel, isStarterPlan = false }: ChannelDnaPageProps) {
  // Real data path — 채널 등록 + 분석 완료 상태만 진입
  if (viewModel?.hasChannel && viewModel.menuStatus !== "not_started") {
    const vm = viewModel.internalChannelDnaSummary
    const { structureSummary, dnaCards, formatDistribution } = buildChannelDnaPageSections(vm)

    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl space-y-8 p-6 lg:p-8">

          {/* Page Header */}
          <div>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <Target className="size-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">Channel DNA</h1>
                <p className="mt-1 text-sm text-muted-foreground">성공 공식 추출기</p>
              </div>
            </div>
          </div>

          <ChannelContextHeader channelContext={channelContext} />

          {/* [1] 채널 정체성 — 타겟 시청자 + 콘텐츠 패턴 */}
          <section className="space-y-6">
            <div className="border-l-4 pl-3" style={{ borderColor: "var(--primary)" }}>
              <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight"><Dna className="size-5 shrink-0 text-primary" />채널 정체성</h2>
              <p className="text-xs text-muted-foreground mt-0.5">튜브워치가 분석한 시청자층과 반복되는 콘텐츠 흐름</p>
            </div>

            {vm.targetAudience.length > 0 && (
              <div className="space-y-2">
                <p className="flex items-center gap-1.5 text-sm font-medium"><Users className="size-4 shrink-0 text-primary" />타겟 시청자</p>
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
                <p className="flex items-center gap-1.5 text-sm font-medium"><RefreshCw className="size-4 shrink-0 text-primary" />콘텐츠 주제 일관성</p>
                <div className="space-y-2">
                  {vm.contentPatterns.map((pattern, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-lg border px-4 py-3 text-sm">
                      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
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
              <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight"><BarChart3 className="size-5 shrink-0 text-primary" />채널 성과 패턴</h2>
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
              ctaLabel="지금 전체 구조 확인하기"
            />
          )}

          {/* [3] 채널 구조 안정성 — Starter 차단 */}
          {!isStarterPlan && (
            <section className="space-y-4">
              <div className="border-l-4 pl-3" style={{ borderColor: "var(--primary)" }}>
                <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight"><Layers className="size-5 shrink-0 text-primary" />채널 구조 안정성</h2>
                <p className="text-xs text-muted-foreground mt-0.5">성과 재현성과 지속 가능성을 결정하는 구조 변수</p>
              </div>
              <DnaStructureSummarySection data={structureSummary} />

              {/* 팬덤 응집도 */}
              {vm.fanbaseLoyalty != null && (() => {
                const fl = vm.fanbaseLoyalty!
                const { gradeLabel, gradeBadgeClass, valueColor, insightText } = fanbaseLoyaltyDisplay(fl)
                return (
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Users className="size-4 text-primary" />
                          팬덤 응집도
                        </CardTitle>
                        <Badge variant="outline" className={`text-xs font-semibold ${gradeBadgeClass}`}>
                          {gradeLabel}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        표본 {fl.sampleCount}편 기준 — 유튜브 카테고리별 평균 반응률(4.0%) 대비
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="rounded-lg border bg-muted/20 px-4 py-4 text-center space-y-1">
                        <p className={`text-3xl font-bold tabular-nums ${valueColor}`}>
                          {fl.per100Views}개
                        </p>
                        <p className="text-sm font-medium">조회수 100회당 반응</p>
                      </div>
                      <p className="text-xs leading-relaxed text-muted-foreground rounded-lg bg-muted/30 px-3 py-2">
                        {insightText}
                      </p>
                      <p className="text-[10px] text-muted-foreground/60">
                        유튜브 카테고리별 평균 반응률(4.0%)을 기준으로 산출된 수치입니다.
                      </p>
                    </CardContent>
                  </Card>
                )
              })()}

              {/* 채널 활동 패턴 — 업로드 일관성·빈도·간격 */}
              {(vm.uploadConsistencyLevel != null || vm.recent30dUploadCount != null || vm.avgUploadIntervalDays != null) && (
                <div className="rounded-lg border border-muted px-5 py-4 space-y-3">
                  <p className="flex items-center gap-1.5 text-sm font-medium"><Calendar className="size-4 shrink-0 text-primary" />채널 활동 패턴</p>
                  <div className="grid grid-cols-3 gap-3">
                    {/* 업로드 일관성 */}
                    <div className="space-y-0.5">
                      <p className="text-[11px] text-muted-foreground">업로드 일관성</p>
                      {vm.uploadConsistencyLevel != null ? (
                        <p className={`text-sm font-semibold ${
                          vm.uploadConsistencyLevel === "high" ? "text-emerald-600 dark:text-emerald-400"
                          : vm.uploadConsistencyLevel === "medium" ? "text-amber-600 dark:text-amber-400"
                          : "text-rose-500 dark:text-rose-400"
                        }`}>
                          {vm.uploadConsistencyLevel === "high" ? "안정적" : vm.uploadConsistencyLevel === "medium" ? "불규칙" : "불안정"}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground/50">—</p>
                      )}
                    </div>
                    {/* 최근 30일 업로드 */}
                    <div className="space-y-0.5">
                      <p className="text-[11px] text-muted-foreground">최근 30일 업로드</p>
                      {vm.recent30dUploadCount != null ? (
                        <p className="text-sm font-semibold tabular-nums">{vm.recent30dUploadCount}개</p>
                      ) : (
                        <p className="text-sm text-muted-foreground/50">—</p>
                      )}
                    </div>
                    {/* 평균 업로드 간격 */}
                    <div className="space-y-0.5">
                      <p className="text-[11px] text-muted-foreground">평균 업로드 간격</p>
                      {vm.avgUploadIntervalDays != null ? (
                        <p className="text-sm font-semibold tabular-nums">{vm.avgUploadIntervalDays}일</p>
                      ) : (
                        <p className="text-sm text-muted-foreground/50">—</p>
                      )}
                    </div>
                  </div>
                  {vm.uploadConsistencyFallback && (
                    <p className="text-xs text-muted-foreground">{vm.uploadConsistencyFallback}</p>
                  )}
                </div>
              )}
            </section>
          )}

          {/* [4] 포맷 분포 시각화 — Starter 차단, 데이터 있을 때만 */}
          {!isStarterPlan && formatDistribution && (
            <section className="space-y-4">
              <div className="border-l-4 pl-3" style={{ borderColor: "var(--primary)" }}>
                <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight"><Film className="size-5 shrink-0 text-primary" />포맷 분포</h2>
                <p className="text-xs text-muted-foreground mt-0.5">영상 길이 구간과 카테고리 비중으로 채널 정체성을 확인하세요</p>
              </div>
              <DnaFormatDistributionSection data={formatDistribution} analysisDate={viewModel.lastRunAt} />
            </section>
          )}

          {/* [5] 채널 DNA 진단 리포트 원페이퍼 — Starter 차단 */}
          {!isStarterPlan && channelId && (
            <section>
              <ChannelDnaReportSection channelId={channelId} channelTitle={channelContext?.title ?? null} />
            </section>
          )}

          {/* 다음 단계 연결 — Action Plan */}
          <PageFlowConnector
            message="이 분석을 실행 전략으로 바꾸세요."
            ctaLabel="Action Plan 보기"
            href={viewModel.selectedChannelId ? `/action-plan?channel=${viewModel.selectedChannelId}` : "/action-plan"}
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
