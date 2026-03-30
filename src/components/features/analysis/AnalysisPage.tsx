"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AnalysisHeaderSection } from "./sections/HeaderSection"
import { AnalysisScoreOverview, type SectionScores } from "./sections/ScoreOverviewSection"
import { AnalysisKpiCards } from "./sections/KpiCardsSection"
import { AnalysisViewTrendChart } from "./sections/TrendChartSection"
import { AnalysisRecentVideosSection } from "./sections/RecentVideosSection"
import { AnalysisTopBottomCompare } from "./sections/TopBottomCompareSection"
import { AnalysisSummarySection } from "./sections/SummarySection"
import { AnalysisEmptyState } from "./sections/EmptyState"
import { StrategicCommentCard } from "@/components/features/shared/StrategicCommentCard"
import { PageFlowConnector } from "@/components/features/shared/PageFlowConnector"
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

  // ViewModel이 metrics 없을 때 삽입하는 fallback item ("표시 가능한 세부 지표")이
  // label 기반 검색이나 interpretation 문자열로 노출되지 않도록 필터링
  const FALLBACK_LABEL = "표시 가능한 세부 지표"
  const activityItems = activityCard?.items.filter((i) => i.label !== FALLBACK_LABEL) ?? []
  const responseItems = responseCard?.items.filter((i) => i.label !== FALLBACK_LABEL) ?? []
  const structureItems = structureCard?.items.filter((i) => i.label !== FALLBACK_LABEL) ?? []

  const intervalItem = activityItems.find((i) => i.label.includes("간격"))
  // intervalItem 미발견 시 null로 구분 — 0과 "데이터 없음"을 분리
  const intervalDays = intervalItem != null ? parseNumFromItemValue(intervalItem.value) : null
  const uploadsPerWeek: number | null =
    intervalDays != null && intervalDays > 0
      ? Math.round((7 / intervalDays) * 10) / 10
      : intervalDays === 0
        ? 0
        : null

  const avgViewsItem = responseItems.find((i) => i.label.includes("평균 조회수"))
  const avgViews: number | null = avgViewsItem
    ? parseNumFromItemValue(avgViewsItem.value)
    : vm.channel?.avgViews.value ?? null

  const medianViewsItem = responseItems.find((i) => i.label.includes("중앙"))
  const medianViews = medianViewsItem
    ? parseNumFromItemValue(medianViewsItem.value)
    : avgViews != null ? Math.round(avgViews * 0.8) : 0

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
  const structureInterp = structureItems.length > 0
    ? structureItems.slice(0, 2).map((i) => `${i.label}: ${i.value}`).join(" / ")
    : "구조 지표 데이터 없음"
  // stabilityScore: 구조 지표가 있으면 상태 기반 점수 추정, 없으면 null(미산출)
  const stabilityScore: number | null = structureItems.length > 0
    ? structureCard?.status === "good" ? 75 : 40
    : null

  const uploadStatus: "양호" | "보통" | "부족" =
    uploadsPerWeek != null && uploadsPerWeek >= 3 ? "양호"
    : uploadsPerWeek != null && uploadsPerWeek >= 1 ? "보통"
    : "부족"
  const uploadInterp = activityItems.length > 0
    ? activityItems.map((i) => `${i.label}: ${i.value}`).join(", ")
    : "활동 지표 데이터 없음"

  return {
    uploadFrequency: {
      value: uploadsPerWeek,  // null이면 KPI 카드에서 "미산출" 표시
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
      stabilityScore,  // null이면 "미산출", 값 있으면 0–100 점수 표시
      status: structureStatus,
      interpretation: structureInterp,
    },
    baselinePerformance: {
      averageViews: avgViews,
      interpretation: avgViews == null
        ? "조회 지표 데이터 없음"
        : vm.channel?.avgViews.lowSampleWarning
          ? "표본이 적어 추정 편차가 있을 수 있습니다"
          : "최근 표본 영상 기준 평균 조회수",
    },
    auxiliaryBaseline: {
      medianViews,
      top20Threshold: Math.round((avgViews ?? 0) * 2),
      interpretation: "표본 기반 추정치 — 채널 전체 성과를 보장하지 않습니다",
    },
  }
}

function mapToViewTrendData(
  videos: AnalysisVideoRow[]
): { index: number; views: number; date: string }[] {
  // viewCount null인 영상도 0으로 처리해 차트에 포함 (최소 렌더 조건 완화)
  return videos
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
    // analysisConfidence는 "low"/"medium"/"high" enum 값이므로 병목 텍스트로 직접 사용하면 안 됨
    keyBottleneck:
      vm.patternSummaryLine ?? vm.urgentImprovements[0] ?? "분석 데이터가 부족합니다",
    nextStepLinks: [
      { label: "Channel DNA", description: "반복 성과 패턴을 구조화하여 확인" },
      { label: "Action Plan", description: "실행 우선순위를 정리하여 확인" },
    ],
  }
}

const TITLE_TO_SECTION_KEY: Record<string, keyof SectionScores> = {
  "업로드·활동": "channelActivity",
  "조회·반응": "audienceResponse",
  "콘텐츠·구조": "contentStructure",
  "메타·발견성": "seoOptimization",
  "성장 신호": "growthMomentum",
}

function mapToSectionScores(vm: AnalysisPageViewModel): SectionScores | undefined {
  if (vm.diagnosisCards.length === 0) return undefined
  const out: SectionScores = {}
  for (const card of vm.diagnosisCards) {
    const key = TITLE_TO_SECTION_KEY[card.title]
    if (key != null) out[key] = card.score
  }
  return Object.keys(out).length > 0 ? out : undefined
}

// ─── Component ───────────────────────────────────────────────────────────────

interface ChannelAnalysisPageProps {
  channelId?: string
  viewModel?: AnalysisPageViewModel
}

export function ChannelAnalysisPage({ channelId: _channelId = "", viewModel }: ChannelAnalysisPageProps) {
  const router = useRouter()
  const [isRequesting, setIsRequesting] = useState(false)
  const [requestError, setRequestError] = useState<string | null>(null)

  async function handleReanalyze() {
    if (!viewModel?.selectedChannelId) {
      console.warn("[AnalysisPage/reanalyze] ABORTED: selectedChannelId is null")
      return
    }
    setIsRequesting(true)
    setRequestError(null)

    const payload = { channelId: viewModel.selectedChannelId }
    console.log("[AnalysisPage/reanalyze] payload:", payload)

    try {
      const res = await fetch("/api/analysis/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      })
      const result = await res.json().catch(() => ({})) as { ok?: boolean; code?: string; error?: string }
      console.log("[AnalysisPage/reanalyze] response status:", res.status, "body:", result)

      if (result.code === "COOLDOWN_ACTIVE") {
        // 쿨다운 중 → 이미 최신 분석 결과가 있으므로 해당 채널 분석 페이지로 이동 (에러 메시지로 막지 않음)
        console.log("[AnalysisPage/reanalyze] cooldown active, navigating to existing result:", viewModel.selectedChannelId)
        router.push(`/analysis?channel=${viewModel.selectedChannelId}`)
        return
      }
      if (!result.ok) {
        console.error("[AnalysisPage/reanalyze] FAILED:", result.error)
        setRequestError(result.error ?? "분석 요청에 실패했습니다.")
        return
      }
      console.log("[AnalysisPage/reanalyze] SUCCESS → navigate to /analysis?channel=", viewModel.selectedChannelId)
      router.push(`/analysis?channel=${viewModel.selectedChannelId}`)
    } catch (err) {
      console.error("[AnalysisPage/reanalyze] fetch exception:", err)
      setRequestError("네트워크 오류가 발생했습니다. 다시 시도해 주세요.")
    } finally {
      setIsRequesting(false)
    }
  }

  // No viewModel — no channel selected or no data yet
  if (!viewModel) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">Channel Analysis</h1>
            <p className="mt-1 text-sm text-muted-foreground">채널 건강검진 리포트</p>
          </div>
          <AnalysisEmptyState type="no-data" title="채널 분석 결과가 없습니다" description="사이드바에서 채널을 선택하거나, 채널을 등록하면 분석을 시작할 수 있습니다." />
        </div>
      </div>
    )
  }

  const channelData = mapToChannelData(viewModel)
  const score = viewModel.scoreGauge?.score ?? 0
  const sectionScores = mapToSectionScores(viewModel)
  const kpiData = mapToKpiData(viewModel)
  const trendData = mapToViewTrendData(viewModel.recentVideos)
  const videosData = mapToVideoData(viewModel.recentVideos)
  const comparisonData = mapToComparisonData(viewModel)
  const summaryData = mapToSummaryData(viewModel)
  const trendInterpretation = viewModel.growthScenarioLine ?? undefined

  // 재진단 상태 신호
  const isAnalysisRunning = viewModel.menuStatus === "queued" || viewModel.menuStatus === "running"
  const isAnalysisCompleted = viewModel.menuStatus === "completed"
  const isNeedsRefresh = viewModel.menuStatus === "needs_refresh"
  // 슬라이딩 윈도우 N값 — ViewModel에서 우선 사용, fallback은 recentVideos 길이
  const sampleCount: number | null =
    (viewModel.reportPresentation?.sampleVideoCount ?? null) ??
    (viewModel.recentVideos.length > 0 ? viewModel.recentVideos.length : null)

  // No-channel guard — 온보딩형 안내
  if (!viewModel.hasChannel) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">Channel Analysis</h1>
            <p className="mt-1 text-sm text-muted-foreground">채널 건강검진 리포트</p>
          </div>
          <div className="flex min-h-[280px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
            <h3 className="mb-2 text-lg font-semibold">먼저 분석할 채널을 추가하세요</h3>
            <p className="mb-6 text-sm text-muted-foreground">채널을 등록하면 바로 분석을 시작할 수 있습니다</p>
            <a
              href="/channels"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
            >
              채널 추가하기
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl space-y-8 p-6 lg:p-8">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">Channel Analysis</h1>
          <p className="mt-1 text-sm text-muted-foreground">채널 건강검진 리포트</p>
        </div>

        {/* 실시간 채널 컨디션 보드 */}
        <section className="space-y-4">
          <div className="border-l-4 pl-3" style={{ borderColor: "var(--primary)" }}>
            <h2 className="text-xl font-bold tracking-tight">실시간 채널 컨디션 보드</h2>
            <p className="text-xs text-muted-foreground mt-0.5">현재 채널 상태와 진단 결과를 한눈에 확인합니다</p>
          </div>

          <AnalysisHeaderSection channel={channelData} />

          {/* 구버전 스냅샷 감지 — 재분석 유도 UI */}
          {viewModel.isLegacySnapshot && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 px-5 py-4 space-y-3 dark:border-amber-700 dark:bg-amber-950/40">
              <div>
                <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">이 분석은 최신 데이터가 아닙니다</p>
                <p className="mt-1 text-sm text-amber-800 dark:text-amber-300">
                  이 채널은 이전 방식으로 생성된 분석 결과입니다. 최신 영상 데이터를 반영하려면 재분석이 필요합니다.
                </p>
              </div>
              {requestError && (
                <p className="text-xs text-red-600 dark:text-red-400">{requestError}</p>
              )}
              <button
                onClick={handleReanalyze}
                disabled={isRequesting}
                className="inline-flex items-center justify-center rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-amber-700 disabled:opacity-60 transition-colors"
              >
                {isRequesting ? "분석 중…" : "지금 다시 분석하기"}
              </button>
            </div>
          )}

          {/* 분석 결과 없음 안내 — 빈 화면 대신 최소 상태로 계속 렌더 */}
          {!viewModel.hasAnalysisResult && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-950/30">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                {viewModel.headlineDiagnosis ??
                  "아직 이 채널에 대한 분석 결과가 없습니다. 분석이 완료되면 아래 항목들이 채워집니다."}
              </p>
            </div>
          )}

          {/* STEP 1 — 재진단 실행 중 안내 */}
          {isAnalysisRunning && (
            <div className="rounded-lg border border-blue-200 bg-blue-50/60 px-4 py-3 space-y-1 dark:border-blue-800 dark:bg-blue-950/20">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-300">채널을 분석 중입니다. 새로 추가된 영상을 반영하고 있습니다.</p>
              <p className="text-xs text-blue-700 dark:text-blue-400">기존 결과를 모두 다시 계산하는 방식이 아니라, 새 영상 중심으로 분석이 업데이트됩니다.</p>
            </div>
          )}

          {/* 데이터 제한 안내 (부분 데이터) */}
          {viewModel.hasAnalysisResult && viewModel.limitNotice && (
            <div className="rounded-lg border border-muted bg-muted/30 px-4 py-3">
              <p className="text-sm text-muted-foreground">{viewModel.limitNotice}</p>
            </div>
          )}

          {/* STEP 2 — 재진단 제한 상태 보강 (needs_refresh) */}
          {viewModel.hasAnalysisResult && isNeedsRefresh && (
            <div className="rounded-lg border border-amber-200 bg-amber-50/50 px-4 py-3 space-y-1 dark:border-amber-800 dark:bg-amber-950/20">
              <p className="text-xs text-amber-800 dark:text-amber-300">최근 12시간 이내에는 새 영상 데이터가 충분히 쌓이지 않아 결과 변화가 작을 수 있습니다.</p>
              <p className="text-xs text-amber-700 dark:text-amber-400">지금은 기존 분석 기준을 유지하고, 데이터가 더 쌓인 뒤 다시 반영됩니다.</p>
            </div>
          )}

          {/* STEP 3 — 재진단 완료 상태 안내 */}
          {viewModel.hasAnalysisResult && isAnalysisCompleted && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 px-4 py-2.5 dark:border-emerald-800 dark:bg-emerald-950/20">
              <p className="text-xs text-emerald-800 dark:text-emerald-300">새로 추가된 영상이 분석에 반영되었습니다.</p>
              <p className="text-xs text-emerald-700 dark:text-emerald-400">
                {sampleCount != null
                  ? `최신 기준으로 최근 ${sampleCount}개 영상 구성이 업데이트되었습니다.`
                  : "최신 기준으로 영상 구성이 업데이트되었습니다."}
              </p>
            </div>
          )}
        </section>

        {/* 성장 엔진 핵심 지표 */}
        <section className="space-y-4">
          <div className="border-l-4 pl-3" style={{ borderColor: "var(--primary)" }}>
            <h2 className="text-xl font-bold tracking-tight">성장 엔진 핵심 지표</h2>
            <p className="text-xs text-muted-foreground mt-0.5">업로드 빈도·조회 반응·콘텐츠 구조 등 핵심 수치를 구간별로 확인합니다</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-[1.2fr_2fr]">
            <AnalysisScoreOverview score={score} sectionScores={sectionScores} />
            <AnalysisKpiCards data={kpiData} />
          </div>
        </section>

        {/* 조회수 흐름 시그널 */}
        <section className="space-y-4">
          <div className="border-l-4 pl-3" style={{ borderColor: "var(--primary)" }}>
            <h2 className="text-xl font-bold tracking-tight">조회수 흐름 시그널</h2>
            <p className="text-xs text-muted-foreground mt-0.5">최근 표본 영상의 조회수 변화 흐름을 시각화합니다</p>
          </div>
          {trendData.length >= 1 ? (
            <AnalysisViewTrendChart
              data={trendData}
              interpretation={trendInterpretation}
            />
          ) : (
            <AnalysisEmptyState
              type="insufficient-samples"
              title="조회 흐름 데이터 부족"
              description="영상 데이터가 있으면 조회 추세 차트가 표시됩니다."
            />
          )}
        </section>

        {/* 최근 성과 히스토리 */}
        <section className="space-y-4">
          <div className="border-l-4 pl-3" style={{ borderColor: "var(--primary)" }}>
            <h2 className="text-xl font-bold tracking-tight">최근 성과 히스토리</h2>
            <p className="text-xs text-muted-foreground mt-0.5">스냅샷에 포함된 최근 영상과 상위·하위 성과 비교를 확인합니다</p>
          </div>
          {videosData.length > 0 ? (
            <AnalysisRecentVideosSection videos={videosData} />
          ) : (
            <AnalysisEmptyState
              type="no-data"
              title="최근 영상 없음"
              description="분석 대상 영상이 없습니다."
            />
          )}
          <AnalysisTopBottomCompare data={comparisonData} sampleCount={videosData.length} videos={videosData} />
        </section>

        {/* 종합 해석 */}
        <AnalysisSummarySection data={summaryData} />

        {/* STEP 4 — 슬라이딩 윈도우 안내 */}
        {viewModel.hasAnalysisResult && (
          <div className="rounded-lg border border-muted bg-muted/20 px-4 py-3 space-y-1">
            <p className="text-xs text-muted-foreground">
              {sampleCount != null
                ? `분석 기준은 항상 최근 ${sampleCount}개 영상으로 유지됩니다.`
                : "분석 기준은 항상 최근 영상 중심으로 유지됩니다."}
            </p>
            <p className="text-xs text-muted-foreground">새 영상이 들어오면 가장 오래된 일부 영상은 이번 분석 기준에서 빠질 수 있습니다.</p>
          </div>
        )}

        {/* TubeWatch 전략 코멘트 */}
        {viewModel.strategicComment && (
          <StrategicCommentCard data={viewModel.strategicComment} />
        )}

        {/* 분석 완료 → Action Plan 유도 */}
        {viewModel.hasAnalysisResult && (
          <PageFlowConnector
            message="분석이 완료되었습니다. 이제 실행 전략을 확인하세요."
            ctaLabel="Action Plan 보기"
            href="/action-plan"
          />
        )}
      </div>
    </div>
  )
}
