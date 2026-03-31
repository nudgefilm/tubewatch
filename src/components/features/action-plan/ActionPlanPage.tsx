"use client"

import { useState, useEffect } from "react"
import { ActionPlanPrioritySection } from "./sections/PrioritySection"
import { ActionPlanCardsSection } from "./sections/CardsSection"
import { ActionPlanChecklistSection } from "./sections/ChecklistSection"
import { ActionPlanEmptyState } from "./sections/EmptyState"
import { ChannelContextHeader, type ChannelContext } from "@/components/features/shared/ChannelContextHeader"
import { StrategicCommentCard } from "@/components/features/shared/StrategicCommentCard"
import { PageFlowConnector } from "@/components/features/shared/PageFlowConnector"
import { FeaturePaywallBlock } from "@/components/features/shared/FeaturePaywallBlock"
import type {
  ActionPlanPageViewModel,
  ActionPlanCardVm,
  ActionPlanChecklistVm,
} from "@/lib/action-plan/actionPlanPageViewModel"

interface ActionPlanPageProps {
  channelId?: string
  channelContext?: ChannelContext
  viewModel?: ActionPlanPageViewModel
  isStarterPlan?: boolean
}

const difficultyLabel: Record<ActionPlanCardVm["difficulty"], string> = {
  low: "하",
  medium: "중",
  high: "상",
}

function toPrioritySection(actions: ActionPlanCardVm[]) {
  return actions.slice(0, 3).map((a, i) => ({
    id: a.id,
    level: a.priority,
    title: a.title,
    reason: a.whyNeeded,
    expectedEffect: a.expectedEffect,
    executionSteps: a.executionHint.split("\n").filter(Boolean),
    order: i + 1,
    difficulty: difficultyLabel[a.difficulty],
  }))
}

function toCardsSection(actions: ActionPlanCardVm[]) {
  return actions.map((a) => ({
    id: a.id,
    title: a.title,
    problemSummary: a.whyNeeded,
    whyNeeded: a.whyNeeded,
    howToExecute: a.executionHint.split("\n").filter(Boolean),
    expectedEffect: a.expectedEffect,
    scenarioBlocks: a.scenarioText?.split("\n").filter(Boolean) ?? [],
    priority: a.priority,
    dnaConnection:
      a.evidenceSource === "channel_dna" ? "채널 DNA 기반" : null,
    analysisConnection: "분석 스냅샷",
  }))
}

function toChecklistItems(items: ActionPlanChecklistVm[]) {
  return items
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
    const priorityData = toPrioritySection(viewModel.actions)
    const cardsData = toCardsSection(viewModel.actions)
    const checklistData = toChecklistItems(viewModel.checklistItems)

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

          {/* 성장 가능성 높은 3단계 실행 전략 */}
          <section className="space-y-4">
            <div className="border-l-4 pl-3" style={{ borderColor: "var(--primary)" }}>
              <h2 className="text-xl font-bold tracking-tight">성장 가능성 높은 3단계 실행 전략</h2>
              <p className="text-xs text-muted-foreground mt-0.5">지금 당장 실행할 수 있는 우선순위 높은 액션을 순서대로 제시합니다</p>
            </div>
            {priorityData.length > 0 ? (
              <ActionPlanPrioritySection data={priorityData} />
            ) : (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                분석이 완료되면 실행 전략이 자동으로 생성됩니다.
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

          {/* 실행 시 기대 변화 시나리오 */}
          <section className="space-y-4">
            <div className="border-l-4 pl-3" style={{ borderColor: "var(--primary)" }}>
              <h2 className="text-xl font-bold tracking-tight">실행 시 기대 변화 시나리오</h2>
              <p className="text-xs text-muted-foreground mt-0.5">각 액션을 실행했을 때 기대되는 채널 변화를 구체적으로 제시합니다</p>
            </div>
            {cardsData.length > 0 ? (
              <ActionPlanCardsSection data={cardsData} />
            ) : (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                분석이 완료되면 실행 카드가 자동으로 생성됩니다.
              </div>
            )}
          </section>

          {/* 업로드 전 필수 검토 항목 */}
          {checklistData.length > 0 && (
            <section className="space-y-4">
              <div className="border-l-4 pl-3" style={{ borderColor: "var(--primary)" }}>
                <h2 className="text-xl font-bold tracking-tight">업로드 전 필수 검토 항목</h2>
                <p className="text-xs text-muted-foreground mt-0.5">영상 업로드 전 반드시 확인해야 할 체크포인트입니다</p>
              </div>
              <ActionPlanChecklistSection items={checklistData} />
            </section>
          )}

          {/* TubeWatch 전략 코멘트 */}
          {viewModel.strategicComment && (
            <StrategicCommentCard data={viewModel.strategicComment} />
          )}

          {/* 다음 단계 연결 — SEO Lab */}
          {viewModel.hasAnalysis && (
            <PageFlowConnector
              message="이 액션을 제목과 키워드에 적용하세요."
              ctaLabel="SEO Lab에서 적용하기"
              href="/seo-lab"
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
