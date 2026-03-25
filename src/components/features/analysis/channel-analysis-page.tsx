"use client"

import { AnalysisHeaderSection } from "./analysis-header-section"
import { AnalysisScoreOverview } from "./analysis-score-overview"
import { AnalysisKpiCards } from "./analysis-kpi-cards"
import { AnalysisViewTrendChart } from "./analysis-view-trend-chart"
import { AnalysisRecentVideosSection } from "./analysis-recent-videos-section"
import { AnalysisTopBottomCompare } from "./analysis-top-bottom-compare"
import { AnalysisSummarySection } from "./analysis-summary-section"
import {
  mockChannelData,
  mockKpiData,
  mockViewTrendData,
  mockVideosData,
  mockComparisonData,
  mockSummaryData,
  mockOverallScore,
} from "./mock-data"

export function ChannelAnalysisPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-8">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">Channel Analysis</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            채널 현재 상태를 구조화한 원천 데이터 허브
          </p>
        </div>

        {/* A. Channel Header */}
        <AnalysisHeaderSection channel={mockChannelData} />

        {/* B. Score Overview + KPI Cards */}
        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          <AnalysisScoreOverview score={mockOverallScore} />
          <AnalysisKpiCards data={mockKpiData} />
        </div>

        {/* F. View Trend Chart */}
        <AnalysisViewTrendChart
          data={mockViewTrendData}
          interpretation="최근 10개 영상 기준 조회수 흐름이 상승 추세를 보이고 있습니다. 특히 비교형/리스트형 포맷 영상에서 일관된 성과가 나타납니다."
        />

        {/* C. Recent Videos List */}
        <AnalysisRecentVideosSection videos={mockVideosData} />

        {/* D. Top/Bottom Performance Comparison */}
        <AnalysisTopBottomCompare data={mockComparisonData} />

        {/* E. Summary Section */}
        <AnalysisSummarySection data={mockSummaryData} />
      </div>
    </div>
  )
}
