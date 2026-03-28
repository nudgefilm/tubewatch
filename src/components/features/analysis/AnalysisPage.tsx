"use client"

import { AnalysisHeaderSection } from "./sections/HeaderSection"
import { AnalysisScoreOverview } from "./sections/ScoreOverviewSection"
import { AnalysisKpiCards } from "./sections/KpiCardsSection"
import { AnalysisViewTrendChart } from "./sections/TrendChartSection"
import { AnalysisRecentVideosSection } from "./sections/RecentVideosSection"
import { AnalysisTopBottomCompare } from "./sections/TopBottomCompareSection"
import { AnalysisSummarySection } from "./sections/SummarySection"
import { AnalysisEmptyState } from "./sections/EmptyState"
import type {
  ChannelData,
  KpiData,
  VideoData,
  ComparisonData,
  SummaryData,
} from "./mock-data"
import type { AnalysisPageViewModel, AnalysisVideoRow } from "@/lib/analysis/analysisPageViewModel"

// ─── Mappers: AnalysisPageViewModel → section prop types ─────────────────────

function deriveStatusBadge(score: number | undefined): ChannelData["statusBadge"] {
  if (score == null) return "초기 성장"
  if (score >= 75) return "성장세"
  if (score >= 55) return "정체 구간"
  if (score >= 40) return "회복 필요"
  return "구조 재정비 필요"
}

function parseNumFromItemValue(value: string): number {
  const n = parseFloat(value.replace(/[^0-9.]/g, ""))
  return Number.isFinite(n) ? n : 0
}

function mapToChannelData(vm: AnalysisPageViewModel): ChannelData {
  const activityCard = vm.diagnosisCards.find((c) => c.title === "업로드·활동")
  const recentUploadsItem = activityCard?.items.find((i) => i.label.includes("30일"))
  const recentUploads = recentUploadsItem ? parseNumFromItemValue(recentUploadsItem.value) : 0

  return {
    id: vm.selectedChannelId ?? "",
    name: vm.channel?.title ?? "채널 없음",
    thumbnail: vm.channel?.thumbnailUrl ?? "/placeholder.svg",
    subscribers: vm.channel?.subscriberCount ?? 0,
    totalVideos: vm.channel?.videoCount ?? 0,
    recentUploads,
    channelDiagnosis: vm.headlineDiagnosis ?? "분석 결과 없음",
    statusSummary: vm.patternSummaryLine ?? "표본 부족 — 영상을 더 업로드하면 정확도가 높아집니다.",
    statusBadge: deriveStatusBadge(vm.scoreGauge?.score),
    lastAnalyzedAt: vm.lastRunAt ?? "—",
  }
}

function mapToKpiData(vm: AnalysisPageViewModel): KpiData {
  const activityCard = vm.diagnosisCards.find((c) => c.title === "업로드·활동")
  const responseCard = vm.diagnosisCards.find((c) => c.title === "조회·반응")
  const structureCard = vm.diagnosisCards.find((c) => c.title === "콘텐츠·구조")

  const intervalItem = activityCard?.items.find((i) => i.label.includes("간격"))
  const intervalDays = intervalItem ? parseNumFromItemValue(intervalItem.value) : 0
  const uploadsPerWeek = intervalDays > 0 ? Math.round((7 / intervalDays) * 10) / 10 : 0

  const avgViewsItem = responseCard?.items.find((i) => i.label.includes("평균 조회수"))
  const avgViews = avgViewsItem
    ? parseNumFromItemValue(avgViewsItem.value)
    : (vm.channel?.avgViews.value ?? 0)

  const medianViewsItem = responseCard?.items.find((i) => i.label.includes("중앙"))
  const medianViews = medianViewsItem
    ? parseNumFromItemValue(medianViewsItem.value)
    : Math.round(avgViews * 0.8)

  // View trend: compare first vs last of recentVideos by viewCount
  const videosWithViews = vm.recentVideos.filter((v) => v.viewCount != null)
  let trendValue = 0
  let trendDir: "상승" | "유지" | "하락" = "유지"
  if (videosWithViews.length >= 2) {
    const oldest = videosWithViews[videosWithViews.length - 1].viewCount ?? 0
    const newest = videosWithViews[0].viewCount ?? 0
    if (oldest > 0) {
      trendValue = Math.round(((newest - oldest) / oldest) * 100)
      trendDir = trendValue > 5 ? "상승" : trendValue < -5 ? "하락" : "유지"
    }
  }

  const structureStatus = structureCard?.status === "good" ? "안정" : "불안정"
  const structureInterp = structureCard
    ? structureCard.items.slice(0, 2).map((i) => `${i.label}: ${i.value}`).join(" / ")
    : "데이터 부족"

  const uploadStatus: "양호" | "보통" | "부족" =
    uploadsPerWeek >= 3 ? "양호" : uploadsPerWeek >= 1 ? "보통" : "부족"
  const uploadInterp = activityCard
    ? activityCard.items.map((i) => `${i.label}: ${i.value}`).join(", ")
    : "데이터 부족"

  return {
    uploadFrequency: {
      value: uploadsPerWeek,
      status: uploadStatus,
      interpretation: uploadInterp,
    },
    viewTrend: {
      value: trendValue,
      trend: trendDir,
      interpretation:
        videosWithViews.length < 2
          ? "표본 부족"
          : `최근 ${videosWithViews.length}개 영상 조회수 흐름 기반`,
    },
    contentStability: {
      titleLengthVariance: 0.2,
      videoLengthVariance: 0.2,
      keywordClusterVariance: 0.2,
      status: structureStatus,
      interpretation: structureInterp,
    },
    baselinePerformance: {
      averageViews: avgViews,
      interpretation: vm.channel?.avgViews.lowSampleWarning
        ? "표본이 적어 추정 편차가 있을 수 있습니다"
        : "최근 표본 영상 기준 평균 조회수",
    },
    auxiliaryBaseline: {
      medianViews,
      top20Threshold: Math.round(avgViews * 2),
      interpretation: "표본 기반 추정치 — 채널 전체 성과를 보장하지 않습니다",
    },
  }
}

function mapToViewTrendData(
  videos: AnalysisVideoRow[]
): { index: number; views: number; date: string }[] {
  return videos
    .filter((v) => v.viewCount != null)
    .slice(0, 10)
    .reverse()
    .map((v, i) => ({
      index: i + 1,
      views: v.viewCount ?? 0,
      date: v.publishedAt
        ? v.publishedAt.slice(5, 10).replace("-", "/")
        : `영상${i + 1}`,
    }))
}

function mapToVideoData(videos: AnalysisVideoRow[]): VideoData[] {
  return videos.map((v, i) => ({
    id: `video-${i}`,
    thumbnail: v.thumbnailUrl ?? "/placeholder.svg",
    title: v.title,
    uploadDate: v.publishedAt ?? "",
    views: v.viewCount ?? 0,
    duration: v.durationLabel ?? "—",
    performanceBadge: (() => {
      if (v.relativeBadge?.includes("높은")) return "상위"
      if (v.relativeBadge?.includes("낮은")) return "하위"
      return "평균권"
    })() as VideoData["performanceBadge"],
    patternTags: [],
  }))
}

function mapToComparisonData(vm: AnalysisPageViewModel): ComparisonData | null {
  if (vm.topVideos.length === 0 && vm.weakVideos.length === 0) return null

  const avgV = (vids: AnalysisVideoRow[]) => {
    const withV = vids.filter((v) => v.viewCount != null)
    if (!withV.length) return 0
    return Math.round(withV.reduce((s, v) => s + (v.viewCount ?? 0), 0) / withV.length)
  }
  const avgTitle = (vids: AnalysisVideoRow[]) => {
    if (!vids.length) return 0
    return Math.round(vids.reduce((s, v) => s + v.title.length, 0) / vids.length)
  }

  return {
    topGroup: {
      avgViews: avgV(vm.topVideos),
      avgTitleLength: avgTitle(vm.topVideos),
      avgVideoDuration: vm.topVideos[0]?.durationLabel ?? "—",
      uploadInterval: 0,
      commonPatterns: vm.topVideos.map((v) => v.title.slice(0, 18) + "…").slice(0, 3),
    },
    bottomGroup: {
      avgViews: avgV(vm.weakVideos),
      avgTitleLength: avgTitle(vm.weakVideos),
      avgVideoDuration: vm.weakVideos[0]?.durationLabel ?? "—",
      uploadInterval: 0,
      commonPatterns: vm.weakVideos.map((v) => v.title.slice(0, 18) + "…").slice(0, 3),
    },
    differencePoints: vm.performanceCompareSummary
      ? [vm.performanceCompareSummary]
      : ["상위/하위 영상 조회수 패턴 비교 기반 요약"],
  }
}

function mapToSummaryData(vm: AnalysisPageViewModel): SummaryData {
  return {
    strengths: vm.strengths.length > 0 ? vm.strengths : ["분석 데이터 부족"],
    improvements: vm.urgentImprovements.length > 0 ? vm.urgentImprovements : ["분석 데이터 부족"],
    evidenceSummary: vm.sampleSizeNote ?? "최근 영상 표본 기준 분석",
    keyBottleneck:
      vm.analysisConfidence ?? vm.patternSummaryLine ?? "분석 데이터가 부족합니다",
    nextStepLinks: [
      { label: "Channel DNA", description: "반복 성과 패턴을 구조화하여 확인" },
      { label: "Action Plan", description: "실행 우선순위를 정리하여 확인" },
    ],
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

interface ChannelAnalysisPageProps {
  channelId?: string
  viewModel?: AnalysisPageViewModel
}

export function ChannelAnalysisPage({ channelId: _channelId = "", viewModel }: ChannelAnalysisPageProps) {
  // No viewModel — no channel selected or no data yet
  if (!viewModel) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">Channel Analysis</h1>
            <p className="mt-1 text-sm text-muted-foreground">채널 현재 상태를 구조화한 원천 데이터 허브</p>
          </div>
          <AnalysisEmptyState type="no-data" title="채널 분석 결과가 없습니다" description="사이드바에서 채널을 선택하거나, 채널을 등록하면 분석을 시작할 수 있습니다." />
        </div>
      </div>
    )
  }

  const channelData = mapToChannelData(viewModel)
  const score = viewModel.scoreGauge?.score ?? 0
  const kpiData = mapToKpiData(viewModel)
  const trendData = mapToViewTrendData(viewModel.recentVideos)
  const videosData = mapToVideoData(viewModel.recentVideos)
  const comparisonData = mapToComparisonData(viewModel)
  const summaryData = mapToSummaryData(viewModel)
  const trendInterpretation = viewModel.growthScenarioLine ?? undefined

  // No-channel guard
  if (!viewModel.hasChannel) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">Channel Analysis</h1>
            <p className="mt-1 text-sm text-muted-foreground">채널 현재 상태를 구조화한 원천 데이터 허브</p>
          </div>
          <AnalysisEmptyState type="no-data" title="채널이 없습니다" description="채널을 먼저 등록하면 분석을 시작할 수 있습니다." />
        </div>
      </div>
    )
  }

  // No-result guard
  if (!viewModel.hasAnalysisResult) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">Channel Analysis</h1>
            <p className="mt-1 text-sm text-muted-foreground">채널 현재 상태를 구조화한 원천 데이터 허브</p>
          </div>
          <AnalysisHeaderSection channel={channelData} />
          <AnalysisEmptyState type="no-data" title="분석 결과 없음" description="분석을 실행하면 채널 데이터가 여기에 표시됩니다." />
        </div>
      </div>
    )
  }

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
        <AnalysisHeaderSection channel={channelData} />

        {/* B. Score Overview + KPI Cards */}
        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          <AnalysisScoreOverview score={score} />
          <AnalysisKpiCards data={kpiData} />
        </div>

        {/* F. View Trend Chart */}
        {trendData.length >= 2 ? (
          <AnalysisViewTrendChart
            data={trendData}
            interpretation={trendInterpretation}
          />
        ) : (
          <AnalysisEmptyState type="insufficient-samples" title="조회 흐름 데이터 부족" description="최근 영상이 2개 이상 있으면 조회 추세 차트가 표시됩니다." />
        )}

        {/* C. Recent Videos List */}
        {videosData.length > 0 ? (
          <AnalysisRecentVideosSection videos={videosData} />
        ) : (
          <AnalysisEmptyState type="no-data" title="최근 영상 없음" description="분석 대상 영상이 없습니다." />
        )}

        {/* D. Top/Bottom Performance Comparison */}
        {comparisonData ? (
          <AnalysisTopBottomCompare data={comparisonData} />
        ) : (
          <AnalysisEmptyState type="insufficient-samples" />
        )}

        {/* E. Summary Section */}
        <AnalysisSummarySection data={summaryData} />
      </div>
    </div>
  )
}
