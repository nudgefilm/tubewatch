"use client"

import { SeoLabDiagnosticSection } from "./sections/DiagnosticSection"
import { SeoLabKeywordAnalysisSection } from "./sections/KeywordAnalysisSection"
import { SeoLabTitleOptimizationSection } from "./sections/TitleOptimizationSection"
import { SeoLabTopicClusterSection } from "./sections/TopicClusterSection"
import { SeoLabActionSection } from "./sections/ActionSection"
import { SeoLabVisualizationSection } from "./sections/VisualizationSection"
import {
  seoDiagnosticData,
  keywordAnalysisData,
  titleOptimizationData,
  topicClusterData,
  seoActionsData,
  seoVisualizationData,
} from "./mock-data"

interface SeoLabPageProps {
  channelId?: string
}

export function SeoLabPage({ channelId = "" }: SeoLabPageProps) {
  const hasSeoData = true // mock: 데이터 존재 여부

  if (!hasSeoData) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl p-6 lg:p-8">
          <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
            <h3 className="mb-2 text-lg font-medium">SEO 데이터가 없습니다</h3>
            <p className="text-sm text-muted-foreground">
              채널 분석이 완료되면 SEO 최적화 데이터가 표시됩니다.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-8">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">SEO Lab</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            이 채널에서 통하는 키워드와 제목 구조를 데이터 기반으로 분석합니다
          </p>
        </div>

        {/* A. SEO 진단 */}
        <SeoLabDiagnosticSection data={seoDiagnosticData} />

        {/* B. 키워드 분석 */}
        <SeoLabKeywordAnalysisSection data={keywordAnalysisData} />

        {/* C. 제목 구조 개선 */}
        <SeoLabTitleOptimizationSection data={titleOptimizationData} />

        {/* D. 주제 클러스터 */}
        <SeoLabTopicClusterSection data={topicClusterData} />

        {/* F. 시각화 */}
        <SeoLabVisualizationSection data={seoVisualizationData} />

        {/* E. 실행 액션 */}
        <SeoLabActionSection data={seoActionsData} />
      </div>
    </div>
  )
}
