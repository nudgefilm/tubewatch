"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"

interface ViewTrendDataPoint {
  index: number
  views: number
  date: string
}

interface AnalysisViewTrendChartProps {
  data: ViewTrendDataPoint[]
  interpretation?: string
  channelId?: string
}

const chartConfig = {
  views: {
    label: "조회수",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

function formatViews(value: number): string {
  if (!Number.isFinite(value)) return "—"
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
  return Math.round(value).toString()
}

function deriveSummaryLine(
  data: ViewTrendDataPoint[],
  trendDirection: "상승" | "하락",
  maxViews: number,
  minViews: number
): string {
  if (!data?.length) return "데이터가 부족하여 흐름 해석이 제한됩니다"
  const n = data.length
  const variationRatio = maxViews > 0 ? (maxViews - minViews) / maxViews : 0
  if (variationRatio > 0.6) {
    return `최근 ${n}편 기준 조회수 편차가 크게 나타납니다 — 최저 ${formatViews(minViews)}, 최고 ${formatViews(maxViews)}`
  }
  if (trendDirection === "상승") {
    return `최근 ${n}편 기준 조회 흐름이 완만한 상승세를 보이고 있습니다`
  }
  return `최근 ${n}편 기준 조회 흐름이 정체 또는 하락세를 나타내고 있습니다`
}

export function AnalysisViewTrendChart({ data, interpretation, channelId }: AnalysisViewTrendChartProps) {
  // Fallback 1: 표본 2개 미만 — 추세 그래프를 그릴 수 없음
  if (data.length < 2) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <p className="text-sm text-muted-foreground">
            표본 부족으로 조회 흐름 그래프를 표시할 수 없습니다.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Fallback 2: 유효한 조회수 값이 전혀 없는 경우 (전부 0 또는 null)
  const hasValidViews = data.some((d) => d.views > 0)
  if (!hasValidViews) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <p className="text-sm text-muted-foreground">
            유효한 조회수 데이터가 부족합니다.
          </p>
        </CardContent>
      </Card>
    )
  }

  const maxViews = Math.max(...data.map((d) => d.views))
  const minViews = Math.min(...data.map((d) => d.views))
  const maxIdx = data.reduce((best, d, i) => d.views > data[best].views ? i : best, 0)
  const minIdx = data.reduce((worst, d, i) => d.views < data[worst].views ? i : worst, 0)
  // domain 안전 처리: min === max 이거나 0일 때 recharts가 빈 축을 그리는 것을 방지
  const yDomainMin = minViews > 0 ? minViews * 0.8 : 0
  const yDomainMax = maxViews > 0 ? maxViews * 1.1 : 100
  const trendDirection = data[data.length - 1].views > data[0].views ? "상승" : "하락"
  const summaryLine = deriveSummaryLine(data, trendDirection, maxViews, minViews)
  const smallSampleGuidance = data.length <= 4
    ? `현재 ${data.length}개 영상 기준 흐름입니다. 표본이 늘면 추세 정확도가 높아집니다.`
    : null

  const renderDot = (props: { cx?: number; cy?: number; index?: number }) => {
    const { cx = 0, cy = 0, index = 0 } = props
    if (index === maxIdx) {
      return (
        <g key="dot-max">
          <circle cx={cx} cy={cy} r={5} fill="#10b981" stroke="white" strokeWidth={2} />
          <text x={cx} y={cy - 10} textAnchor="middle" fontSize={10} fill="#10b981" fontWeight="600">
            {formatViews(data[index].views)}
          </text>
        </g>
      )
    }
    if (index === minIdx && minIdx !== maxIdx) {
      return (
        <g key="dot-min">
          <circle cx={cx} cy={cy} r={5} fill="#f43f5e" stroke="white" strokeWidth={2} />
          <text x={cx} y={cy + 16} textAnchor="middle" fontSize={10} fill="#f43f5e" fontWeight="600">
            {formatViews(data[index].views)}
          </text>
        </g>
      )
    }
    return <g key={`dot-${index}`} />
  }

  if (process.env.NODE_ENV === "development") {
    if (!data || data.length === 0) {
      console.warn("[TrendChart] empty data")
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-base">최근 조회 흐름</CardTitle>
            <p className="text-xs leading-relaxed text-muted-foreground">{summaryLine}</p>
          </div>
          <div
            className={`mt-0.5 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
              trendDirection === "상승"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-rose-50 text-rose-700"
            }`}
          >
            {trendDirection} 추세
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <ChartContainer config={chartConfig} className="h-[224px] w-full">
          <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11 }}
              className="text-muted-foreground"
            />
            <YAxis
              tickFormatter={formatViews}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11 }}
              className="text-muted-foreground"
              domain={[yDomainMin, yDomainMax]}
            />
            <Tooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => [
                    formatViews(typeof value === "number" ? value : Number(value)),
                    "조회수",
                  ]}
                />
              }
            />
            <Line
              type="monotone"
              dataKey="views"
              stroke="var(--color-views)"
              strokeWidth={2}
              dot={renderDot as any}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          </LineChart>
          </ResponsiveContainer>
        </ChartContainer>

        {smallSampleGuidance && (
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground/70">
            {smallSampleGuidance}
          </p>
        )}
        {interpretation && (
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground/70">
            {interpretation}
          </p>
        )}
        {/* 피크 영상 → Channel DNA 유도 */}
        {(() => {
          const peak = data.reduce((a, b) => (b.views > a.views ? b : a), data[0]!)
          if (peak.views === 0) return null
          return (
            <a
              href={channelId ? `/channel-dna?channel=${channelId}` : "/channel-dna"}
              className="mt-3 flex items-center gap-1.5 rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-primary hover:bg-primary/10 transition-colors"
            >
              <span className="font-medium">{peak.date} 영상이 조회수 정점을 기록했습니다.</span>
              <span className="text-muted-foreground">→ Channel DNA에서 패턴 확인</span>
            </a>
          )
        })()}
      </CardContent>
    </Card>
  )
}
