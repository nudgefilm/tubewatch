"use client"

import { NextTrendCandidatesSection } from "./sections/CandidatesSection"
import { NextTrendFormatSection } from "./sections/FormatSection"
import { NextTrendRiskSection } from "./sections/RiskSection"
import { NextTrendExecutionHints } from "./sections/ExecutionHintsSection"
import { NextTrendActionSection } from "./sections/ActionSection"
import { NextTrendSourceSplitSection } from "./sections/SourceSplitSection"
import { NextTrendVisualizationSection } from "./sections/VisualizationSection"
import { NextTrendEmptyState } from "./sections/EmptyState"
import {
  trendCandidates,
  formatRecommendations,
  riskMemos,
  executionHints,
  executionActions,
  sourceSplit,
  visualizationData,
} from "./mock-data"

interface NextTrendPageProps {
  channelId?: string
}

export function NextTrendPage({ channelId = "" }: NextTrendPageProps) {
  console.log("[v0] NextTrendPage rendering with channelId:", channelId)
  console.log("[v0] trendCandidates:", trendCandidates)
  const hasCandidates = trendCandidates.length > 0

  if (!hasCandidates) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">Next Trend</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              내부 신호 기반 다음 시도 방향 제안
            </p>
          </div>
          <NextTrendEmptyState />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-8">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">Next Trend</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            내부 신호 기반 다음 시도 방향 제안
          </p>
        </div>

        {/* A. 다음 시도 후보 */}
        <NextTrendCandidatesSection data={trendCandidates} />

        {/* B. 포맷 추천 */}
        <NextTrendFormatSection data={formatRecommendations} />

        {/* G. 시각화 */}
        <NextTrendVisualizationSection data={visualizationData} />

        {/* F. 내부 / 확장 분리 */}
        <NextTrendSourceSplitSection data={sourceSplit} />

        {/* D. 실행 힌트 */}
        <NextTrendExecutionHints data={executionHints} />

        {/* E. 실행 액션 */}
        <NextTrendActionSection data={executionActions} />

        {/* C. 리스크 메모 */}
        <NextTrendRiskSection data={riskMemos} />
      </div>
    </div>
  )
}
