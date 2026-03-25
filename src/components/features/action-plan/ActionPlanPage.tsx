"use client"

import { ActionPlanSummarySection } from "./action-plan-summary-section"
import { ActionPlanPrioritySection } from "./action-plan-priority-section"
import { ActionPlanCardsSection } from "./action-plan-cards-section"
import { ActionPlanChecklistSection } from "./action-plan-checklist-section"
import { ActionPlanTrackingSection } from "./action-plan-tracking-section"
import { ActionPlanAssistSection } from "./action-plan-assist-section"
import { ActionPlanVisualization } from "./action-plan-visualization"
import { ActionPlanEmptyState } from "./action-plan-empty-state"
import {
  actionPlanSummary,
  priorityActions,
  actionCards,
  checklist,
  trackingKPIs,
  assistContent,
  visualizationData,
} from "./mock-data"

interface ActionPlanPageProps {
  channelId: string
}

export function ActionPlanPage({ channelId }: ActionPlanPageProps) {
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
