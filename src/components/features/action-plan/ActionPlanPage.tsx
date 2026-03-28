"use client"

import { ActionPlanSummarySection } from "./sections/SummarySection"
import { ActionPlanPrioritySection } from "./sections/PrioritySection"
import { ActionPlanCardsSection } from "./sections/CardsSection"
import { ActionPlanChecklistSection } from "./sections/ChecklistSection"
import { ActionPlanTrackingSection } from "./sections/TrackingSection"
import { ActionPlanAssistSection } from "./sections/AssistSection"
import { ActionPlanVisualization } from "./sections/VisualizationSection"
import { ActionPlanEmptyState } from "./sections/EmptyState"
import {
  actionPlanSummary,
  priorityActions,
  actionCards,
  checklist,
  trackingKPIs,
  assistContent,
  visualizationData,
} from "./mock-data"
import { ChannelContextHeader, type ChannelContext } from "@/components/features/shared/ChannelContextHeader"

interface ActionPlanPageProps {
  channelId?: string
  channelContext?: ChannelContext
}

export function ActionPlanPage({ channelId = "", channelContext }: ActionPlanPageProps) {
  const hasData = true // mock: 실제로는 데이터 존재 여부 체크

  if (!hasData) {
    return <ActionPlanEmptyState />
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-8">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">Action Plan</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            채널 성장을 위한 맞춤형 실행 전략 가이드
          </p>
        </div>

        {/* 채널 컨텍스트 */}
        <ChannelContextHeader channelContext={channelContext} />

        {/* A. 전략 요약 */}
        <ActionPlanSummarySection data={actionPlanSummary} />

        {/* B. 실행 우선순위 */}
        <ActionPlanPrioritySection data={priorityActions} />

        {/* G. 전략 시각화 */}
        <ActionPlanVisualization data={visualizationData} />

        {/* C. 액션 카드 */}
        <ActionPlanCardsSection data={actionCards} />

        {/* D. 체크리스트 */}
        <ActionPlanChecklistSection data={checklist} />

        {/* E. 성과 추적 */}
        <ActionPlanTrackingSection data={trackingKPIs} />

        {/* F. 실행 보조 */}
        <ActionPlanAssistSection data={assistContent} />
      </div>
    </div>
  )
}
