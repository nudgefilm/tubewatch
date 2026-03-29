"use client"

import { Upload, TrendingUp, Layers, Target, BarChart3 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { KpiData } from "../mock-data"

interface AnalysisKpiCardsProps {
  data: KpiData
}

function getStatusBadgeStyle(status: string) {
  switch (status) {
    case "양호":
    case "안정":
    case "상승":
      return "bg-emerald-50 text-emerald-700 border-emerald-200"
    case "보통":
    case "유지":
      return "bg-amber-50 text-amber-700 border-amber-200"
    case "부족":
    case "불안정":
    case "하락":
      return "bg-rose-50 text-rose-700 border-rose-200"
    default:
      return "bg-muted text-muted-foreground"
  }
}

function MiniProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const percentage = Math.min((value / max) * 100, 100)
  return (
    <div className="h-1.5 w-full rounded-full bg-muted">
      <div
        className={`h-full rounded-full transition-all ${color}`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}

function MiniSparkline({ trend }: { trend: "상승" | "유지" | "하락" }) {
  const paths = {
    상승: "M0,16 L8,12 L16,14 L24,8 L32,10 L40,4",
    유지: "M0,10 L8,11 L16,9 L24,10 L32,9 L40,10",
    하락: "M0,4 L8,8 L16,6 L24,12 L32,10 L40,16",
  }
  const colors = {
    상승: "stroke-emerald-500",
    유지: "stroke-amber-500",
    하락: "stroke-rose-500",
  }
  return (
    <svg width="40" height="20" viewBox="0 0 40 20" className="overflow-visible">
      <path
        d={paths[trend]}
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={colors[trend]}
      />
    </svg>
  )
}

function TinyBars({ values, maxValue }: { values: number[]; maxValue: number }) {
  return (
    <div className="flex h-4 items-end gap-0.5">
      {values.map((v, i) => (
        <div
          key={i}
          className="w-1.5 rounded-sm bg-foreground/25"
          style={{ height: `${(v / maxValue) * 100}%` }}
        />
      ))}
    </div>
  )
}

function NullState() {
  return (
    <>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold tabular-nums text-muted-foreground/30">표본 부족</span>
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">
        현재 데이터 기준으로 계산 제한
      </p>
      <div className="h-1.5 w-full rounded-full bg-muted/50" />
    </>
  )
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`
  }
  return num.toString()
}

export function AnalysisKpiCards({ data }: AnalysisKpiCardsProps) {
  return (
    <div className="flex flex-col gap-3">

      {/* Top row: 2 cards */}
      <div className="grid grid-cols-2 gap-3">

        {/* 1. Upload Frequency */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Upload className="size-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  업로드 빈도
                </CardTitle>
              </div>
              {data.uploadFrequency.value != null && (
                <Badge variant="outline" className={`text-[11px] px-1.5 py-0 ${getStatusBadgeStyle(data.uploadFrequency.status)}`}>
                  {data.uploadFrequency.status}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-2 min-h-[88px]">
            {data.uploadFrequency.value != null ? (
              <>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold tabular-nums">{data.uploadFrequency.value}</span>
                  <span className="text-sm text-muted-foreground">회/주</span>
                </div>
                <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                  {data.uploadFrequency.interpretation}
                </p>
                <MiniProgressBar value={data.uploadFrequency.value} max={5} color="bg-emerald-500" />
              </>
            ) : (
              <NullState />
            )}
          </CardContent>
        </Card>

        {/* 2. View Trend */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="size-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  조회 흐름
                </CardTitle>
              </div>
              <Badge variant="outline" className={`text-[11px] px-1.5 py-0 ${getStatusBadgeStyle(data.viewTrend.trend)}`}>
                {data.viewTrend.trend}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 min-h-[88px]">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold tabular-nums">
                {data.viewTrend.value > 0 ? "+" : ""}
                {data.viewTrend.value}
              </span>
              <span className="text-sm text-muted-foreground">%</span>
            </div>
            <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
              {data.viewTrend.interpretation}
            </p>
            <MiniSparkline trend={data.viewTrend.trend} />
          </CardContent>
        </Card>

      </div>

      {/* Bottom row: 3 cards */}
      <div className="grid grid-cols-3 gap-3">

        {/* 3. Content Stability */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Layers className="size-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  구조 안정성
                </CardTitle>
              </div>
              {data.contentStability.stabilityScore != null && (
                <Badge variant="outline" className={`text-[11px] px-1.5 py-0 ${getStatusBadgeStyle(data.contentStability.status)}`}>
                  {data.contentStability.status}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-2 min-h-[88px]">
            {data.contentStability.stabilityScore != null ? (
              <>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold tabular-nums">
                    {data.contentStability.stabilityScore}
                  </span>
                  <span className="text-sm text-muted-foreground">/ 100</span>
                </div>
                <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                  {data.contentStability.interpretation}
                </p>
                <TinyBars values={[85, 78, 82, 88, 80]} maxValue={100} />
              </>
            ) : (
              <NullState />
            )}
          </CardContent>
        </Card>

        {/* 4. Baseline Performance */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-1.5">
              <Target className="size-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium text-muted-foreground">
                기준 성과선
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 min-h-[88px]">
            {data.baselinePerformance.averageViews != null ? (
              <>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold tabular-nums">
                    {formatNumber(data.baselinePerformance.averageViews)}
                  </span>
                  <span className="text-sm text-muted-foreground">평균</span>
                </div>
                <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                  {data.baselinePerformance.interpretation}
                </p>
              </>
            ) : (
              <NullState />
            )}
          </CardContent>
        </Card>

        {/* 5. Auxiliary Baseline */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-1.5">
              <BarChart3 className="size-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium text-muted-foreground">
                보조 기준선
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 min-h-[88px]">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold tabular-nums">
                {formatNumber(data.auxiliaryBaseline.medianViews)}
              </span>
              <span className="text-sm text-muted-foreground">중앙</span>
            </div>
            <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
              {data.auxiliaryBaseline.interpretation}
            </p>
            <p className="text-sm text-muted-foreground/60">
              상위 20%: {formatNumber(data.auxiliaryBaseline.top20Threshold)}
            </p>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
