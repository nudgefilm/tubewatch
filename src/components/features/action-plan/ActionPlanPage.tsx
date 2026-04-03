"use client"

import { useState, useEffect } from "react"
import { ActionPlanCardsSection } from "./sections/CardsSection"
import { ActionPlanChecklistSection } from "./sections/ChecklistSection"
import { ActionPlanKeywordSection } from "./sections/KeywordSection"
import { ActionPlanDeficitSection } from "./sections/DeficitSection"
import { ActionPlanEmptyState } from "./sections/EmptyState"
import { ChannelContextHeader, type ChannelContext } from "@/components/features/shared/ChannelContextHeader"
import { FeaturePaywallBlock } from "@/components/features/shared/FeaturePaywallBlock"
import { PageFlowConnector } from "@/components/features/shared/PageFlowConnector"
import type { ActionPlanPageViewModel } from "@/lib/action-plan/actionPlanPageViewModel"
import { buildActionPlanPageSections } from "@/lib/engines/actionPlanPageEngine"

interface ActionPlanPageProps {
  channelId?: string
  channelContext?: ChannelContext
  viewModel?: ActionPlanPageViewModel
  isStarterPlan?: boolean
}


export function ActionPlanPage({ channelId = "", channelContext, viewModel, isStarterPlan = false }: ActionPlanPageProps) {
  const [showFirstVisitBanner, setShowFirstVisitBanner] = useState(false)

  useEffect(() => {
    const seen = localStorage.getItem("hasSeenFirstActionPlanGuide")
    if (!seen) {
      setShowFirstVisitBanner(true)
      localStorage.setItem("hasSeenFirstActionPlanGuide", "1")
    }
  }, [])

  // Real data path
  if (viewModel) {
    const { cardsData, checklistData, seoKeywordsData, seoDeficitData, engagementGapData, linguisticInsightData } = buildActionPlanPageSections(viewModel, isStarterPlan)

    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl space-y-8 p-6 lg:p-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">Action Plan</h1>
            <p className="mt-1 text-sm text-muted-foreground">오늘 당장 할 일 리스트</p>
          </div>

          <ChannelContextHeader channelContext={channelContext} />

          {/* 최초 방문 안내 — 1회만 노출 */}
          {viewModel.hasAnalysis && showFirstVisitBanner && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm font-medium text-foreground">
              지금 채널에 바로 적용할 액션을 정리했습니다.
            </div>
          )}

          {/* 분석 결과 없음 — 빈 화면 대신 안내 + 최소 상태 렌더 */}
          {!viewModel.hasAnalysis && (
            <>
              {viewModel.limitNotice && (
                <div className="rounded-lg border border-amber-200 bg-amber-50/50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-300">
                  {viewModel.limitNotice}
                </div>
              )}
              <ActionPlanEmptyState channelId={viewModel.selectedChannelId ?? undefined} />
            </>
          )}

          {/* 분석 결과 있음 — 데이터 제한 안내 */}
          {viewModel.hasAnalysis && viewModel.limitNotice && (
            <div className="rounded-lg border border-amber-200 bg-amber-50/50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-300">
              {viewModel.limitNotice}
            </div>
          )}

          {/* [1] 우선순위별 실행 계획 */}
          <section className="space-y-4">
            <div className="border-l-4 pl-3" style={{ borderColor: "var(--primary)" }}>
              <h2 className="text-xl font-bold tracking-tight">우선순위별 실행 계획</h2>
              <p className="text-xs text-muted-foreground mt-0.5">P1부터 순서대로 실행하세요. 각 카드에 실행 근거와 기대 변화가 포함됩니다</p>
            </div>
            {cardsData.length > 0 ? (
              <ActionPlanCardsSection data={cardsData} />
            ) : (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                분석이 완료되면 실행 계획이 자동으로 생성됩니다.
              </div>
            )}
          </section>

          {/* Paywall — Starter 전용 */}
          {isStarterPlan && viewModel.hasAnalysis && (
            <FeaturePaywallBlock
              title="지금 채널에 맞는 다음 액션이 더 준비되어 있습니다."
              description="우선순위별 실행 전략 전체를 열어보세요."
              ctaLabel="지금 실행 전략 전체 열기"
              planLabel="Growth"
              previewHint="남은 액션에서 조회 상승 핵심 포인트가 이어집니다"
            />
          )}

          {/* [2] 업로드 전 체크리스트 — Starter 차단 */}
          {!isStarterPlan && checklistData.length > 0 && (
            <section className="space-y-4">
              <div className="border-l-4 pl-3" style={{ borderColor: "var(--primary)" }}>
                <h2 className="text-xl font-bold tracking-tight">업로드 전 체크리스트</h2>
                <p className="text-xs text-muted-foreground mt-0.5">영상을 올리기 전 매번 확인할 항목</p>
              </div>
              <ActionPlanChecklistSection items={checklistData} />
            </section>
          )}

          {/* [3] SEO 키워드 진단 — Starter 차단, 실질 데이터 있을 때만 */}
          {!isStarterPlan && seoKeywordsData && (seoKeywordsData.hasTagData || seoKeywordsData.descriptionStats != null) && (
            <section className="space-y-4">
              <div className="border-l-4 border-primary pl-3">
                <h2 className="text-xl font-bold tracking-tight">SEO 키워드 진단</h2>
                <p className="text-xs text-muted-foreground mt-0.5">태그와 설명란을 점검하고 바로 수정하세요</p>
              </div>
              <ActionPlanKeywordSection data={seoKeywordsData} />
            </section>
          )}

          {/* [4] 수정 가능한 결손 리포트 — Starter 차단 */}
          {!isStarterPlan && (seoDeficitData || engagementGapData || linguisticInsightData) && (
            <section className="space-y-4">
              <div className="border-l-4 pl-3" style={{ borderColor: "var(--primary)" }}>
                <h2 className="text-xl font-bold tracking-tight">지금 바로 수정하세요</h2>
                <p className="text-xs text-muted-foreground mt-0.5">유튜브 스튜디오에서 즉시 적용 가능한 결손 항목</p>
              </div>
              <ActionPlanDeficitSection seoDeficit={seoDeficitData} engagementGap={engagementGapData} linguisticInsight={linguisticInsightData} />
            </section>
          )}

          {/* 다음 단계 연결 */}
          {viewModel.hasAnalysis && (
            <PageFlowConnector
              message="다음 트렌드 방향을 확인하고 주제를 결정하세요."
              ctaLabel="Next Trend 보기"
              href="/next-trend"
            />
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
          <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">Action Plan</h1>
          <p className="mt-1 text-sm text-muted-foreground">오늘 당장 할 일 리스트</p>
        </div>
        <ChannelContextHeader channelContext={channelContext} />
        <ActionPlanEmptyState channelId={channelId || undefined} />
      </div>
    </div>
  )
}
