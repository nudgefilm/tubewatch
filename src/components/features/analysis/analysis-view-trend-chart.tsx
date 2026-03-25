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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K`
  }
  return value.toString()
}

export function AnalysisViewTrendChart({ data, interpretation }: AnalysisViewTrendChartProps) {
  const maxViews = Math.max(...data.map((d) => d.views))
  const minViews = Math.min(...data.map((d) => d.views))
  const trendDirection = data[data.length - 1].views > data[0].views ? "상승" : "하락"

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">최근 조회 흐름</CardTitle>
            <CardDescription>최근 업로드 영상 기준</CardDescription>
          </div>
          <div
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              trendDirection === "상승"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-rose-50 text-rose-700"
            }`}
          >
            {trendDirection} 추세
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <LineChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
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
                  formatter={(value) => [formatViews(value as number), "조회수"]}
                />
              }
            />
            <Line
              type="monotone"
              dataKey="views"
              stroke="var(--color-views)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          </LineChart>
        </ChartContainer>

        {interpretation && (
          <p className="mt-4 text-xs text-muted-foreground">{interpretation}</p>
        )}
      </CardContent>
    </Card>
  )
}
