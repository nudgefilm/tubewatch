"use client"

import { ActionPlanPrioritySection } from "./sections/PrioritySection"
import { ActionPlanCardsSection } from "./sections/CardsSection"
import { ActionPlanChecklistSection } from "./sections/ChecklistSection"
import { ActionPlanEmptyState } from "./sections/EmptyState"
import { ChannelContextHeader, type ChannelContext } from "@/components/features/shared/ChannelContextHeader"
import { StrategicCommentCard } from "@/components/features/shared/StrategicCommentCard"
import type {
  ActionPlanPageViewModel,
  ActionPlanCardVm,
  ActionPlanChecklistVm,
} from "@/lib/action-plan/actionPlanPageViewModel"

interface ActionPlanPageProps {
  channelId?: string
  channelContext?: ChannelContext
  viewModel?: ActionPlanPageViewModel
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
    howToExecute: [a.executionHint],
    expectedEffect: a.expectedEffect,
    priority: a.priority,
    dnaConnection:
      a.evidenceSource === "channel_dna" ? "채널 DNA 기반" : null,
    analysisConnection: "분석 스냅샷",
  }))
}

function toChecklistItems(items: ActionPlanChecklistVm[]) {
  return items
}

export function ActionPlanPage({ channelId = "", channelContext, viewModel }: ActionPlanPageProps) {
  // Real data path
  if (viewModel) {
    if (!viewModel.hasAnalysis) {
      return (
        <div className="min-h-screen bg-background">
          <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-8">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">Action Plan</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                채널 성장을 위한 맞춤형 실행 전략 가이드
              </p>
            </div>
            <ChannelContextHeader channelContext={channelContext} />
            <ActionPlanEmptyState />
          </div>
        </div>
      )
    }

    const priorityData = toPrioritySection(viewModel.actions)
    const cardsData = toCardsSection(viewModel.actions)
    const checklistData = toChecklistItems(viewModel.checklistItems)

    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">Action Plan</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              채널 성장을 위한 맞춤형 실행 전략 가이드
            </p>
          </div>

          <ChannelContextHeader channelContext={channelContext} />

          {viewModel.limitNotice && (
            <div className="rounded-lg border border-amber-200 bg-amber-50/50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-300">
              {viewModel.limitNotice}
            </div>
          )}

          {priorityData.length > 0 && (
            <ActionPlanPrioritySection data={priorityData} />
          )}

          {cardsData.length > 0 && (
            <ActionPlanCardsSection data={cardsData} />
          )}

          {checklistData.length > 0 && (
            <ActionPlanChecklistSection items={checklistData} />
          )}

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
          <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">Action Plan</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            채널 성장을 위한 맞춤형 실행 전략 가이드
          </p>
        </div>
        <ChannelContextHeader channelContext={channelContext} />
        <ActionPlanEmptyState channelId={channelId || undefined} />
      </div>
    </div>
  )
}
