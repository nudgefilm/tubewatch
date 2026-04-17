"use client"

import { Card, CardContent } from "@/components/ui/card"
import type { AnalysisSectionScores } from "@/lib/engines/analysisPageEngine"
import type { AnalysisDiagnosisCardVm } from "@/lib/analysis/analysisPageViewModel"

function pastelBarClass(score: number): string {
  if (score >= 65) return "bg-sky-400/70"
  if (score >= 45) return "bg-amber-300/80"
  return "bg-rose-300/80"
}

function scoreStyle(score: number): { text: string; cls: string } {
  if (score >= 80) return { text: "양호", cls: "text-emerald-600 dark:text-emerald-400" }
  if (score >= 60) return { text: "보통", cls: "text-amber-600 dark:text-amber-400" }
  return { text: "취약", cls: "text-rose-500 dark:text-rose-400" }
}

function formatNumber(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return "—"
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return Math.round(n).toString()
}

interface MetricCardProps {
  title: string
  score: number
  meta: string
  tooltip: string
}

function MetricCard({ title, score, meta, tooltip }: MetricCardProps) {
  const { text: statusText, cls: statusCls } = scoreStyle(score)
  return (
    <div className="rounded-lg bg-card p-4 shadow-sm space-y-2.5" title={tooltip}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{title}</span>
        <span className="text-sm tabular-nums">
          {Math.round(score)}
          <span className="text-xs text-muted-foreground font-normal ml-0.5">/ 100</span>
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${pastelBarClass(score)}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{meta}</span>
        <span className={`text-xs font-medium ${statusCls}`}>{statusText}</span>
      </div>
    </div>
  )
}

interface KpiDataForEngagement {
  baselinePerformance: {
    averageViews: number | null
    medianViews: number
    interpretation: string
  }
}

interface EngagementGridSectionProps {
  sectionScores?: AnalysisSectionScores
  diagnosisCards: AnalysisDiagnosisCardVm[]
  kpiData: KpiDataForEngagement
}

const FALLBACK_LABEL = "표시 가능한 세부 지표"

export function EngagementGridSection({ sectionScores, diagnosisCards, kpiData }: EngagementGridSectionProps) {
  const audienceCard = diagnosisCards.find(c => c.title === "시청자 반응 구조")
  const seoCard = diagnosisCards.find(c => c.title === "SEO 최적화 상태")
  const subCard = diagnosisCards.find(c => c.title === "구독 전환 구조")

  const likeItem = audienceCard?.items.find(i => i.label === "평균 좋아요 비율")
  const cmtItem = audienceCard?.items.find(i => i.label === "평균 댓글 비율")
  const titleItem = seoCard?.items.find(i => i.label === "평균 제목 길이")
  const tagsItem = seoCard?.items.find(i => i.label === "평균 태그 수")

  const audienceMeta = [likeItem, cmtItem]
    .filter(Boolean)
    .map(i => `${i!.label} ${i!.value}`)
    .join(" / ") || "반응 데이터 집계 중"

  const seoMeta = [titleItem, tagsItem]
    .filter(Boolean)
    .map(i => `${i!.label} ${i!.value}`)
    .join(" / ") || "SEO 데이터 집계 중"

  const subItems = subCard?.items.filter(i => i.label !== FALLBACK_LABEL) ?? []
  const subMeta = subItems.length > 0
    ? subItems.map(i => `${i.label} ${i.value}`).join(" / ")
    : "전환 신호 분석 중"

  const audienceScore = sectionScores?.audienceResponse
  const seoScore = sectionScores?.seoOptimization
  const subScore = sectionScores?.subscriptionConversion
  const hasBenchmark = kpiData.baselinePerformance.averageViews != null

  const cardCount = [audienceScore, seoScore, subScore, hasBenchmark ? 1 : null].filter(v => v != null).length
  if (cardCount === 0) return null

  return (
    <div className="grid grid-cols-2 gap-3">
      {audienceScore != null && (
        <MetricCard
          title="시청자 반응"
          score={audienceScore}
          meta={audienceMeta}
          tooltip="시청자 반응 신호(좋아요·댓글 비율)를 기반으로 한 콘텐츠 반응 점수입니다"
        />
      )}
      {seoScore != null && (
        <MetricCard
          title="SEO 최적화"
          score={seoScore}
          meta={seoMeta}
          tooltip="제목 길이·태그 구조 등 검색 유입에 기여하는 메타 최적화 점수입니다"
        />
      )}
      {subScore != null && (
        <MetricCard
          title="구독 전환"
          score={subScore}
          meta={subMeta}
          tooltip="시청자가 채널을 구독으로 전환하는 구조적 신호를 기반으로 한 점수입니다"
        />
      )}
      {hasBenchmark && (
        <div className="rounded-lg bg-card p-4 shadow-sm space-y-2.5">
          <span className="text-sm font-medium">기준 성과선</span>
          <div className="space-y-1.5 pt-0.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">평균 조회수</span>
              <span className="tabular-nums font-medium">{formatNumber(kpiData.baselinePerformance.averageViews)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">중앙값</span>
              <span className="tabular-nums font-medium">{formatNumber(kpiData.baselinePerformance.medianViews)}</span>
            </div>
          </div>
          <p className="text-[11px] leading-relaxed text-muted-foreground">{kpiData.baselinePerformance.interpretation}</p>
        </div>
      )}
    </div>
  )
}
