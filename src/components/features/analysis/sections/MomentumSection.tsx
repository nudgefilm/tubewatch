"use client"

import { Card, CardContent } from "@/components/ui/card"

interface MomentumSectionProps {
  uploadDates: string[]
  trendPoints: { views: number }[]
  trendInterpretation?: string
  viewTrend: "상승" | "유지" | "하락"
  trendValue?: number
}

function formatK(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(Math.round(n))
}

function buildDotGrid(uploadDates: string[]): boolean[] {
  const today = new Date()
  const dateSet = new Set(
    uploadDates.filter(d => d && d.length >= 10).map(d => d.slice(0, 10))
  )
  return Array.from({ length: 84 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (83 - i))
    return dateSet.has(d.toISOString().slice(0, 10))
  })
}

interface SparklineProps {
  data: { views: number }[]
  trend: "상승" | "유지" | "하락"
}

function Sparkline({ data, trend }: SparklineProps) {
  if (data.length < 2) {
    return (
      <div className="flex h-16 items-center justify-center text-xs text-muted-foreground">
        데이터가 부족합니다
      </div>
    )
  }

  const views = data.map(d => d.views)
  const min = Math.min(...views)
  const max = Math.max(...views)
  const range = max - min || 1
  const W = 400
  const H = 64
  const PAD_X = 4
  const PAD_Y = 6

  const points = views
    .map((v, i) => {
      const x = PAD_X + (i / (views.length - 1)) * (W - PAD_X * 2)
      const y = H - PAD_Y - ((v - min) / range) * (H - PAD_Y * 2)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(" ")

  const strokeColor =
    trend === "상승" ? "#10b981" :
    trend === "하락" ? "#f43f5e" : "#f59e0b"

  return (
    <div className="relative pl-9">
      {/* Y-axis: min/max 좌측 정렬 */}
      <div className="pointer-events-none absolute bottom-0 left-0 top-0 flex flex-col justify-between text-[10px] leading-none text-muted-foreground/60">
        <span>{formatK(max)}</span>
        <span>{formatK(min)}</span>
      </div>
      <svg
        width="100%"
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="overflow-visible"
      >
        <polyline
          points={points}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}

export function MomentumSection({
  uploadDates,
  trendPoints,
  trendInterpretation,
  viewTrend,
  trendValue,
}: MomentumSectionProps) {
  const dots = buildDotGrid(uploadDates)
  const uploadCount = dots.filter(Boolean).length

  const trendBadgeCls =
    viewTrend === "상승"
      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
      : viewTrend === "하락"
        ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
        : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="space-y-4 p-6">
        {/* Dot Grid — 열우선(주 단위) 배치, 전체 너비 활용 */}
        <div>
          <div className="mb-2.5 flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">최근 12주 업로드 활동</span>
            <div className="flex items-center gap-3">
              {/* 범례 */}
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
                <span className="inline-block w-2 h-2 rounded-[2px] bg-primary/70" />
                업로드 있음
              </span>
              <span className="text-xs text-muted-foreground">{uploadCount}개 영상</span>
            </div>
          </div>
          {/* 열우선: 각 열 = 1주, 각 행 = 요일(7행). 좌→우 = 과거→현재 */}
          <div
            className="w-full"
            style={{
              display: "grid",
              gridAutoFlow: "column",
              gridTemplateRows: "repeat(7, auto)",
              gridAutoColumns: "1fr",
              gap: "3px",
            }}
          >
            {dots.map((active, idx) => (
              <div
                key={idx}
                className={`w-full rounded-[2px] transition-colors ${active ? "bg-primary/70" : "bg-muted/40"}`}
                style={{ aspectRatio: "1" }}
              />
            ))}
          </div>
          {/* 시간 방향 안내 */}
          <div className="mt-1 flex justify-between text-[10px] text-muted-foreground/40">
            <span>← 12주 전</span>
            <span>오늘 →</span>
          </div>
        </div>

        {/* Sparkline */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">조회수 추이</span>
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${trendBadgeCls}`}>
              {viewTrend}
              {trendValue != null && trendValue !== 0 && (
                <span className="ml-0.5">({trendValue > 0 ? "+" : ""}{trendValue}%)</span>
              )}
            </span>
          </div>
          <Sparkline data={trendPoints} trend={viewTrend} />
          {trendInterpretation && (
            <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{trendInterpretation}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
