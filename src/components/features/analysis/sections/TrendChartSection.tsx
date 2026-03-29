"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
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
}

const chartConfig = {
  views: {
    label: "조회수",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

function formatViews(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
  return value.toString()
}

function deriveSummaryLine(
  data: ViewTrendDataPoint[],
  trendDirection: "상승" | "하락",
  maxViews: number,
  minViews: number
): string {
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

export function AnalysisViewTrendChart({ data, interpretation }: AnalysisViewTrendChartProps) {
  // 1개: 차트 대신 단일 수치 카드
  if (data.length === 1) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">최근 조회 흐름</CardTitle>
          <p className="text-sm leading-relaxed text-muted-foreground">
            현재 1개 영상 기준입니다. 표본이 늘면 추세 정확도가 높아집니다.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-8 rounded-lg bg-muted/40 px-5 py-4">
            <div>
              <p className="mb-0.5 text-xs text-muted-foreground">조회수</p>
              <p className="text-2xl font-bold tabular-nums">{formatViews(data[0].views)}</p>
            </div>
            <div>
              <p className="mb-0.5 text-xs text-muted-foreground">업로드</p>
              <p className="text-sm font-medium">{data[0].date}</p>
            </div>
          </div>
          {interpretation && (
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground/70">
              {interpretation}
            </p>
          )}
        </CardContent>
      </Card>
    )
  }

  const maxViews = Math.max(...data.map((d) => d.views))
  const minViews = Math.min(...data.map((d) => d.views))
  const trendDirection = data[data.length - 1].views > data[0].views ? "상승" : "하락"
  const summaryLine = deriveSummaryLine(data, trendDirection, maxViews, minViews)
  const smallSampleGuidance = data.length <= 4
    ? `현재 ${data.length}개 영상 기준 흐름입니다. 표본이 늘면 추세 정확도가 높아집니다.`
    : null

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
          <LineChart
            data={data}
            margin={{ top: 8, right: 10, left: -20, bottom: 0 }}
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
              domain={[minViews * 0.8, maxViews * 1.1]}
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
              dot={data.length <= 3}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          </LineChart>
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
      </CardContent>
    </Card>
  )
}
