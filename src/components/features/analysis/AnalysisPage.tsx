"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { RefreshCw, Clock, Activity, Gauge, TrendingUp, History as HistoryIcon, BarChart3 } from "lucide-react"
import { OverloadRetryBanner, isOverloadError } from "@/components/features/shared/OverloadRetryBanner"
import { AnalysisProgressBar } from "@/components/features/shared/AnalysisProgressBar"
import { AnalysisHeaderSection } from "./sections/HeaderSection"
import { ScorecardSection } from "./sections/ScorecardSection"
import { MomentumSection } from "./sections/MomentumSection"
import { EngagementGridSection } from "./sections/EngagementGridSection"
const AnalysisViewTrendChart = dynamic(
  () => import("./sections/TrendChartSection").then((m) => ({ default: m.AnalysisViewTrendChart })),
  { ssr: false, loading: () => null }
)
import { AnalysisRecentVideosSection } from "./sections/RecentVideosSection"
import { AnalysisTopBottomCompare } from "./sections/TopBottomCompareSection"
import { AnalysisSummarySection } from "./sections/SummarySection"
import { AnalysisReportSection } from "./sections/AnalysisReportSection"
import { AnalysisEmptyState } from "./sections/EmptyState"
import { PageFlowConnector } from "@/components/features/shared/PageFlowConnector"
import { buildAnalysisPageSections } from "@/lib/engines/analysisPageEngine"
import type { AnalysisPageViewModel } from "@/lib/analysis/analysisPageViewModel"
// ─── 재분석 쿨다운 타이머 박스 ───────────────────────────────────────────────

const COOLDOWN_MS = 24 * 60 * 60 * 1000 // 24시간

function formatCountdown(ms: number): string {
  if (ms <= 0) return "0분"
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0) return `${h}시간 ${m}분 ${s}초`
  if (m > 0) return `${m}분 ${s}초`
  return `${s}초`
}

interface ReanalyzeCooldownBoxProps {
  lastRunAt: string | null
  sampleCount: number | null
  isRequesting: boolean
  requestError: string | null
  onReanalyze: (force?: boolean) => void
  isAdmin?: boolean
}

function ReanalyzeCooldownBox({ lastRunAt, sampleCount, isRequesting, requestError, onReanalyze, isAdmin = false }: ReanalyzeCooldownBoxProps) {
  // null = 마운트 전(서버 렌더) — 하이드레이션 불일치 방지
  const [remainingMs, setRemainingMs] = useState<number | null>(null)

  useEffect(() => {
    function calc() {
      if (!lastRunAt) return 0
      const elapsed = Date.now() - new Date(lastRunAt).getTime()
      return Math.max(0, COOLDOWN_MS - elapsed)
    }
    setRemainingMs(calc())
    const id = setInterval(() => {
      const next = calc()
      setRemainingMs(next)
      if (next <= 0) clearInterval(id)
    }, 1000)
    return () => clearInterval(id)
  }, [lastRunAt])

  // admin은 쿨다운 무시 — 서버도 bypass하므로 UI도 동일하게 적용
  const isCooldown = !isAdmin && (remainingMs === null || remainingMs > 0)

  return (
    <div className="rounded-lg border bg-muted/30 px-4 py-3 space-y-2.5">

      {/* 타이머 줄 */}
      <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
        <Clock className="size-4 shrink-0 text-muted-foreground" />
        {remainingMs === null ? (
          <span>다음 재분석까지 계산 중…</span>
        ) : isCooldown ? (
          <span>다음 재분석까지 <span className="tabular-nums">{formatCountdown(remainingMs)}</span> 남았습니다.</span>
        ) : (
          <span>재분석 가능 시간이 되었습니다.</span>
        )}
      </div>

      {/* 안내 문구 */}
      <div className="flex items-start gap-1.5 rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        <span className="shrink-0 mt-0.5">💡</span>
        <span>
          <span className="font-semibold">알림:</span>{" "}
          최근 {sampleCount != null ? `${sampleCount}개` : "50개"} 영상이 분석에 반영되었습니다. 새로운 영상을 2개 이상 업로드한 후 재분석을 진행해야 의미 있는 최신 분석 데이터를 확인하실 수 있습니다.
        </span>
      </div>

      {/* 재분석 버튼 — 쿨다운 종료 후만 표시 */}
      {!isCooldown && (
        <div className="space-y-1.5">
          {requestError && (
            <OverloadRetryBanner
              message={requestError}
              isRequesting={isRequesting}
              onRetry={() => onReanalyze()}
            />
          )}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onReanalyze()}
              disabled={isRequesting}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
            >
              <RefreshCw className={`size-3.5 ${isRequesting ? "animate-spin" : ""}`} />
              {isRequesting ? "분석 중…" : "지금 재분석하기"}
            </button>
            {/* 어드민 전용 — delta 무시하고 Gemini 신규 호출 강제 */}
            {isAdmin && (
              <button
                onClick={() => onReanalyze(true)}
                disabled={isRequesting}
                className="inline-flex items-center gap-1.5 rounded-md border border-amber-400 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-60 transition-colors dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-700"
              >
                <RefreshCw className={`size-3.5 ${isRequesting ? "animate-spin" : ""}`} />
                강제 재분석 (AI 새로 생성)
              </button>
            )}
          </div>
          <AnalysisProgressBar isActive={isRequesting} />
        </div>
      )}
    </div>
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

interface ChannelAnalysisPageProps {
  channelId?: string
  viewModel?: AnalysisPageViewModel
  isStarterPlan?: boolean
  isAdmin?: boolean
}

export function ChannelAnalysisPage({ channelId: _channelId = "", viewModel, isStarterPlan = false, isAdmin = false }: ChannelAnalysisPageProps) {
  const router = useRouter()
  const [isRequesting, setIsRequesting] = useState(false)
  const [requestError, setRequestError] = useState<string | null>(null)

  async function handleReanalyze(force = false) {
    if (!viewModel?.selectedChannelId) {
      console.warn("[AnalysisPage/reanalyze] ABORTED: selectedChannelId is null")
      return
    }
    setIsRequesting(true)
    setRequestError(null)

    const payload: Record<string, unknown> = { channelId: viewModel.selectedChannelId }
    if (force) payload.forceFullRun = true
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
      if (result.code === "OVERLOAD_QUEUED") {
        console.warn("[AnalysisPage/reanalyze] Gemini overloaded (503)")
        setRequestError("현재 외부 API 접속량이 몰려 사용량이 증가하고 있습니다. 채널진단 데이터 컨설팅 > 내 채널 > '월간 리포트 신청'을 통해 종합 진단 리포트를 먼저 받아보세요.")
        return
      }
      if (!result.ok) {
        console.error("[AnalysisPage/reanalyze] FAILED:", result.error)
        setRequestError(result.error ?? "분석 요청에 실패했습니다.")
        return
      }
      console.log("[AnalysisPage/reanalyze] SUCCESS → refresh page data")
      router.refresh()
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
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <BarChart3 className="size-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">Channel Analysis</h1>
              <p className="mt-1 text-sm text-muted-foreground">채널 건강검진 리포트</p>
            </div>
          </div>
          <AnalysisEmptyState type="no-data" title="채널 분석 결과가 없습니다" description="사이드바에서 채널을 선택하거나, 채널을 등록하면 분석을 시작할 수 있습니다." />
        </div>
      </div>
    )
  }

  const {
    channelData, score, sectionScores, kpiData,
    trendData, videosData, comparisonData, summaryData, trendInterpretation,
  } = buildAnalysisPageSections(viewModel)

  // 재진단 상태 신호
  const isAnalysisRunning = viewModel.menuStatus === "queued" || viewModel.menuStatus === "running"
  const isAnalysisCompleted = viewModel.menuStatus === "completed"
  const isNeedsRefresh = viewModel.menuStatus === "needs_refresh"
  // 슬라이딩 윈도우 N값 — ViewModel에서 우선 사용, fallback은 recentVideos 길이
  const sampleCount: number | null =
    (viewModel.reportPresentation?.sampleVideoCount ?? null) ??
    (viewModel.recentVideos.length > 0 ? viewModel.recentVideos.length : null)

  // No-channel guard
  if (!viewModel.hasChannel) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-8">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <BarChart3 className="size-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">Channel Analysis</h1>
              <p className="mt-1 text-sm text-muted-foreground">채널 건강검진 리포트</p>
            </div>
          </div>
          <AnalysisEmptyState
            title="먼저 분석할 채널을 추가하세요"
            description="채널을 등록하면 바로 분석을 시작할 수 있습니다."
          />
        </div>
      </div>
    )
  }

  // 채널 등록 완료 but 분석 미실행 (queued·running 제외)
  const isRunningEarly = viewModel.menuStatus === "queued" || viewModel.menuStatus === "running"
  if (viewModel.hasChannel && !viewModel.hasAnalysisResult && !isRunningEarly) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-8">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <BarChart3 className="size-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">Channel Analysis</h1>
              <p className="mt-1 text-sm text-muted-foreground">채널 건강검진 리포트</p>
            </div>
          </div>
          <AnalysisEmptyState
            channelId={viewModel.selectedChannelId ?? undefined}
            title="채널 분석을 시작하세요"
            description="채널이 등록되었습니다. 분석을 실행하면 성과 리포트를 확인할 수 있습니다."
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl space-y-8 p-6 lg:p-8">
        {/* Page Header */}
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
            <BarChart3 className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">Channel Analysis</h1>
            <p className="mt-1 text-sm text-muted-foreground">채널 건강검진 리포트</p>
          </div>
        </div>

        {/* 채널 현황 */}
        <section className="space-y-4">
          <div className="border-l-4 pl-3" style={{ borderColor: "var(--primary)" }}>
            <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight"><Activity className="size-5 shrink-0 text-primary" />채널 현황</h2>
            <p className="text-xs text-muted-foreground mt-0.5">현재 채널 상태와 진단 결과를 한눈에 확인합니다</p>
          </div>

          <AnalysisHeaderSection channel={channelData} />


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
              <p className="text-xs text-amber-800 dark:text-amber-300">최근 24시간 이내에는 새 영상 데이터가 충분히 쌓이지 않아 결과 변화가 작을 수 있습니다.</p>
              <p className="text-xs text-amber-700 dark:text-amber-400">지금은 기존 분석 기준을 유지하고, 데이터가 더 쌓인 뒤 다시 반영됩니다.</p>
            </div>
          )}

          {/* STEP 3 — 재진단 완료 + 쿨다운 타이머 */}
          {viewModel.hasAnalysisResult && isAnalysisCompleted && (
            <ReanalyzeCooldownBox
              lastRunAt={viewModel.lastRunAt}
              sampleCount={sampleCount}
              isRequesting={isRequesting}
              requestError={requestError}
              onReanalyze={handleReanalyze}
              isAdmin={isAdmin}
            />
          )}
        </section>

        {/* 채널 진단 지표 */}
        <section className="space-y-4">
          <div className="border-l-4 pl-3" style={{ borderColor: "var(--primary)" }}>
            <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight"><Gauge className="size-5 shrink-0 text-primary" />채널 진단 지표</h2>
            <p className="text-xs text-muted-foreground mt-0.5">업로드 빈도·조회 반응·콘텐츠 구조 등 핵심 수치를 구간별로 확인합니다</p>
          </div>
          <ScorecardSection score={score} sectionScores={sectionScores} />

          <MomentumSection
            uploadDates={videosData.map(v => v.uploadDate)}
          />

          <EngagementGridSection
            sectionScores={sectionScores}
            diagnosisCards={viewModel.diagnosisCards}
            kpiData={kpiData}
          />
        </section>

        {/* 조회수 흐름 시그널 */}
        <section className="space-y-4">
          <div className="border-l-4 pl-3" style={{ borderColor: "var(--primary)" }}>
            <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight"><TrendingUp className="size-5 shrink-0 text-primary" />조회수 흐름 시그널</h2>
            <p className="text-xs text-muted-foreground mt-0.5">최근 표본 영상의 조회수 변화 흐름을 시각화합니다</p>
          </div>
          {trendData.length >= 1 ? (
            <AnalysisViewTrendChart
              data={trendData}
              interpretation={trendInterpretation}
              channelId={viewModel.selectedChannelId ?? undefined}
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
            <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight"><HistoryIcon className="size-5 shrink-0 text-primary" />최근 성과 히스토리</h2>
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

        {/* 튜브워치 진단 요약 */}
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

        {/* 채널 종합 진단서 원페이퍼 */}
        {viewModel.selectedChannelId && (
          <section>
            <AnalysisReportSection channelId={viewModel.selectedChannelId} channelTitle={viewModel.channel?.title ?? null} />
          </section>
        )}

        {/* 분석 완료 → Channel DNA 유도 */}
        {viewModel.hasAnalysisResult && (
          <PageFlowConnector
            message="분석이 완료되었습니다. 채널의 DNA를 확인하세요."
            ctaLabel="Channel DNA 보기"
            href={viewModel.selectedChannelId ? `/channel-dna?channel=${viewModel.selectedChannelId}` : "/channel-dna"}
          />
        )}
      </div>
    </div>
  )
}
