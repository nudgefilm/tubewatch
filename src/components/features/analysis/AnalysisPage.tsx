"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { RefreshCw, Clock } from "lucide-react"
import { AnalysisHeaderSection } from "./sections/HeaderSection"
import { AnalysisScoreOverview, type SectionScores } from "./sections/ScoreOverviewSection"
import { AnalysisKpiCards } from "./sections/KpiCardsSection"
import { AnalysisViewTrendChart } from "./sections/TrendChartSection"
import { AnalysisRecentVideosSection } from "./sections/RecentVideosSection"
import { AnalysisTopBottomCompare } from "./sections/TopBottomCompareSection"
import { AnalysisSummarySection } from "./sections/SummarySection"
import { AnalysisEmptyState } from "./sections/EmptyState"
import { PageFlowConnector } from "@/components/features/shared/PageFlowConnector"
import { FeaturePaywallBlock } from "@/components/features/shared/FeaturePaywallBlock"
import { buildAnalysisPageSections } from "@/lib/engines/analysisPageEngine"
import type { AnalysisPageViewModel } from "@/lib/analysis/analysisPageViewModel"

// ─── 재분석 쿨다운 타이머 박스 ───────────────────────────────────────────────

const COOLDOWN_MS = 12 * 60 * 60 * 1000 // 12시간

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
  onReanalyze: () => void
}

function ReanalyzeCooldownBox({ lastRunAt, sampleCount, isRequesting, requestError, onReanalyze }: ReanalyzeCooldownBoxProps) {
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

  const isCooldown = remainingMs === null || remainingMs > 0

  return (
    <div className={`rounded-lg border px-4 py-3 space-y-2.5 ${
      isCooldown
        ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20"
        : "border-primary/30 bg-primary/5 dark:border-primary/40"
    }`}>

      {/* 타이머 줄 */}
      <div className="flex items-center gap-1.5 text-sm font-medium text-emerald-800 dark:text-emerald-300">
        <Clock className="size-4 shrink-0" />
        {remainingMs === null ? (
          <span>다음 재분석까지 계산 중…</span>
        ) : isCooldown ? (
          <span>다음 재분석까지 <span className="tabular-nums">{formatCountdown(remainingMs)}</span> 남았습니다.</span>
        ) : (
          <span>재분석 가능 시간이 되었습니다.</span>
        )}
      </div>

      {/* 안내 문구 */}
      <div className="flex items-start gap-1.5 rounded-md bg-emerald-100/60 dark:bg-emerald-900/20 px-3 py-2 text-xs text-emerald-800 dark:text-emerald-300">
        <span className="shrink-0 mt-0.5">💡</span>
        <span>
          <span className="font-semibold">알림:</span>{" "}
          최근 {sampleCount != null ? `${sampleCount}개` : ""} 영상이 분석에 반영되었습니다. 새로운 영상을 1개 이상 업로드한 후 재분석을 진행해야 가장 정확하고 의미 있는 최신 분석 데이터를 확인하실 수 있습니다.
        </span>
      </div>

      {/* 재분석 버튼 — 쿨다운 종료 후만 표시 */}
      {!isCooldown && (
        <div className="space-y-1.5">
          {requestError && (
            <p className="text-xs text-destructive">{requestError}</p>
          )}
          <button
            onClick={onReanalyze}
            disabled={isRequesting}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
          >
            <RefreshCw className={`size-3.5 ${isRequesting ? "animate-spin" : ""}`} />
            {isRequesting ? "분석 중…" : "지금 재분석하기"}
          </button>
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
}

export function ChannelAnalysisPage({ channelId: _channelId = "", viewModel, isStarterPlan = false }: ChannelAnalysisPageProps) {
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
          <div>
            <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">Channel Analysis</h1>
            <p className="mt-1 text-sm text-muted-foreground">채널 건강검진 리포트</p>
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

        {/* 채널 현황 */}
        <section className="space-y-4">
          <div className="border-l-4 pl-3" style={{ borderColor: "var(--primary)" }}>
            <h2 className="text-xl font-bold tracking-tight">채널 현황</h2>
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

          {/* STEP 3 — 재진단 완료 + 쿨다운 타이머 */}
          {viewModel.hasAnalysisResult && isAnalysisCompleted && (
            <ReanalyzeCooldownBox
              lastRunAt={viewModel.lastRunAt}
              sampleCount={sampleCount}
              isRequesting={isRequesting}
              requestError={requestError}
              onReanalyze={handleReanalyze}
            />
          )}
        </section>

        {/* 채널 진단 지표 */}
        <section className="space-y-4">
          <div className="border-l-4 pl-3" style={{ borderColor: "var(--primary)" }}>
            <h2 className="text-xl font-bold tracking-tight">채널 진단 지표</h2>
            <p className="text-xs text-muted-foreground mt-0.5">업로드 빈도·조회 반응·콘텐츠 구조 등 핵심 수치를 구간별로 확인합니다</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-[1.2fr_2fr]">
            <AnalysisScoreOverview score={score} sectionScores={sectionScores} />
            <AnalysisKpiCards data={kpiData} />
          </div>

          {/* 구간 인사이트 — 시청자 반응 구조·SEO·구독 전환 (신규 분석 결과에서만 표시) */}
          {(sectionScores?.audienceResponse != null || sectionScores?.seoOptimization != null || sectionScores?.subscriptionConversion != null) && (() => {
            function insightBarColor(s: number) {
              return s >= 65 ? "bg-emerald-500" : s >= 45 ? "bg-amber-400" : "bg-rose-400"
            }
            function insightTextColor(s: number) {
              return s >= 65 ? "text-emerald-600" : s >= 45 ? "text-amber-600" : "text-rose-600"
            }
            const audienceCard = viewModel.diagnosisCards.find(c => c.title === "시청자 반응 구조")
            const seoCard = viewModel.diagnosisCards.find(c => c.title === "SEO 최적화 상태")
            const insights: { title: string; score: number; metaItems: string[]; interp: string }[] = []
            if (sectionScores.audienceResponse != null) {
              const s = sectionScores.audienceResponse
              const like = audienceCard?.items.find(i => i.label === "평균 좋아요 비율")
              const cmt = audienceCard?.items.find(i => i.label === "평균 댓글 비율")
              insights.push({
                title: "시청자 반응 구조",
                score: s,
                metaItems: [like, cmt].filter(Boolean).map(i => `${i!.label} ${i!.value}`),
                interp: s >= 65
                  ? "시청자 반응 신호가 콘텐츠 방향과 맞아 CTR 유지에 유리한 신호입니다"
                  : s >= 45 ? "반응 신호는 있으나 CTR 및 시청 지속시간 안정화 여지가 있습니다"
                  : "조회 반응이 낮아 초반 이탈이 높을 가능성이 있는 구조입니다",
              })
            }
            if (sectionScores.seoOptimization != null) {
              const s = sectionScores.seoOptimization
              const title = seoCard?.items.find(i => i.label === "평균 제목 길이")
              const tags = seoCard?.items.find(i => i.label === "평균 태그 수")
              insights.push({
                title: "SEO 최적화 상태",
                score: s,
                metaItems: [title, tags].filter(Boolean).map(i => `${i!.label} ${i!.value}`),
                interp: s >= 65
                  ? "키워드·제목 구조가 초반 클릭 유도력과 검색 유입에 기여하고 있는 신호입니다"
                  : s >= 45 ? "검색 유입 가능성은 있으나 키워드 배치가 더 정리될 여지가 있습니다"
                  : "제목·키워드 구조가 검색 노출을 이끌어내기 어려운 경향이 읽힙니다",
              })
            }
            if (sectionScores.subscriptionConversion != null) {
              const s = sectionScores.subscriptionConversion
              insights.push({
                title: "구독 전환 구조",
                score: s,
                metaItems: [],
                interp: s >= 65
                  ? "참여 구조와 콘텐츠 일관성이 구독 전환에 유리한 신호를 형성하고 있습니다"
                  : s >= 45 ? "구독 전환 신호가 부분적으로 감지되나 참여 일관성이 더 굳어져야 할 경향입니다"
                  : "구독 전환 구조가 약해 시청자가 이탈 없이 구독할 동기가 낮을 수 있습니다",
              })
            }
            return (
              <div className={`grid gap-3 ${insights.length >= 3 ? "sm:grid-cols-3" : insights.length === 2 ? "sm:grid-cols-2" : ""}`}>
                {insights.map(({ title, score, metaItems, interp }) => (
                  <div key={title} className="rounded-lg border px-4 py-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{title}</span>
                      <span className={`text-sm font-semibold tabular-nums ${insightTextColor(score)}`}>
                        {Math.round(score)}
                        <span className="text-xs text-muted-foreground font-normal ml-0.5">/ 100</span>
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted">
                      <div className={`h-full rounded-full transition-all ${insightBarColor(score)}`} style={{ width: `${score}%` }} />
                    </div>
                    {metaItems.length > 0 && (
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                        {metaItems.map(m => <span key={m} className="text-[11px] text-muted-foreground">{m}</span>)}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">{interp}</p>
                  </div>
                ))}
              </div>
            )
          })()}
        </section>

        {/* Paywall — Starter 전용 */}
        {isStarterPlan && viewModel.hasAnalysisResult && (
          <FeaturePaywallBlock
            title="조회 흐름, 영상 성과 히스토리, 진단 요약을 확인하세요."
            description="채널 데이터 전체를 읽어야 다음 영상 방향이 보입니다."
            ctaLabel="전체 분석 리포트 열기"
            planLabel="Growth"
            previewHint="조회 흐름 추세와 상위·하위 영상 비교가 이어집니다"
          />
        )}

        {/* 조회수 흐름 시그널 */}
        {!isStarterPlan && (
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
        )}

        {/* 최근 성과 히스토리 */}
        {!isStarterPlan && (
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
        )}

        {/* 튜브워치 진단 요약 */}
        {!isStarterPlan && <AnalysisSummarySection data={summaryData} />}

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
