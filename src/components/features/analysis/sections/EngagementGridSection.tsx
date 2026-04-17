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
  interpretation: string
}

function MetricCard({ title, score, meta, interpretation }: MetricCardProps) {
  const { text: statusText, cls: statusCls } = scoreStyle(score)
  return (
    <div className="rounded-lg border bg-card p-4 pt-4 shadow-sm space-y-2.5">
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
      <p className="text-[11px] leading-relaxed text-muted-foreground">{interpretation}</p>
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

function deriveInterpretation(key: "audience" | "seo" | "sub", score: number): string {
  const tier = score >= 65 ? 0 : score >= 45 ? 1 : 2
  const map = {
    audience: [
      "시청자 반응 신호가 콘텐츠 방향과 맞아 CTR 유지에 유리한 신호입니다",
      "반응 신호는 있으나 CTR 및 시청 지속시간 안정화 여지가 있습니다",
      "조회 반응이 낮아 초반 이탈이 높을 가능성이 있는 구조입니다",
    ],
    seo: [
      "키워드·제목 구조가 초반 클릭 유도력과 검색 유입에 기여하고 있는 신호입니다",
      "검색 유입 가능성은 있으나 키워드 배치가 더 정리될 여지가 있습니다",
      "제목·키워드 구조가 검색 노출을 이끌어내기 어려운 경향이 읽힙니다",
    ],
    sub: [
      "참여 구조와 콘텐츠 일관성이 구독 전환에 유리한 신호를 형성하고 있습니다",
      "구독 전환 신호가 부분적으로 감지되나 참여 일관성이 더 굳어져야 할 경향입니다",
      "구독 전환 구조가 약해 시청자가 채널을 이탈 없이 구독할 동기가 낮을 수 있습니다",
    ],
  }
  return map[key][tier]
}

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
          interpretation={deriveInterpretation("audience", audienceScore)}
        />
      )}
      {seoScore != null && (
        <MetricCard
          title="SEO 최적화"
          score={seoScore}
          meta={seoMeta}
          interpretation={deriveInterpretation("seo", seoScore)}
        />
      )}
      {subScore != null && (
        <MetricCard
          title="구독 전환"
          score={subScore}
          meta={subMeta}
          interpretation={deriveInterpretation("sub", subScore)}
        />
      )}
      {hasBenchmark && (
        <div className="rounded-lg border bg-card p-4 pt-4 shadow-sm space-y-2.5">
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
