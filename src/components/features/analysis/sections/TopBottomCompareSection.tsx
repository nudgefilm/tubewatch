"use client"

import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import type { ComparisonData } from "../mock-data"

interface AnalysisTopBottomCompareProps {
  data: ComparisonData
}

function formatViews(views: number): string {
  if (views >= 1000000) {
    return `${(views / 1000000).toFixed(1)}M`
  }
  if (views >= 1000) {
    return `${(views / 1000).toFixed(1)}K`
  }
  return views.toString()
}

function ComparisonBar({
  label,
  topValue,
  bottomValue,
  unit,
  format = (v: number | string) => String(v),
}: {
  label: string
  topValue: number | string
  bottomValue: number | string
  unit?: string
  format?: (v: number | string) => string
}) {
  const numTop = typeof topValue === "number" ? topValue : parseFloat(topValue) || 0
  const numBottom = typeof bottomValue === "number" ? bottomValue : parseFloat(bottomValue) || 0
  const maxVal = Math.max(numTop, numBottom)
  const topWidth = maxVal > 0 ? (numTop / maxVal) * 100 : 0
  const bottomWidth = maxVal > 0 ? (numBottom / maxVal) * 100 : 0

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{label}</span>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <div className="h-2 w-full rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${topWidth}%` }}
            />
          </div>
          <span className="w-16 text-right text-xs font-medium">
            {format(topValue)}
            {unit}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-full rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-rose-400 transition-all"
              style={{ width: `${bottomWidth}%` }}
            />
          </div>
          <span className="w-16 text-right text-xs font-medium">
            {format(bottomValue)}
            {unit}
          </span>
        </div>
      </div>
    </div>
  )
}

export function AnalysisTopBottomCompare({ data }: AnalysisTopBottomCompareProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">상위/하위 성과 비교</CardTitle>
        <CardDescription>상위 20% vs 하위 20% 영상 그룹 비교</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left: Comparison Cards */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Top Group */}
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4">
              <div className="mb-3 flex items-center gap-2">
                <TrendingUp className="size-4 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-700">상위 20%</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">평균 조회수</span>
                  <span className="font-medium">{formatViews(data.topGroup.avgViews)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">제목 길이</span>
                  <span className="font-medium">{data.topGroup.avgTitleLength}자</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">영상 길이</span>
                  <span className="font-medium">{data.topGroup.avgVideoDuration}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">업로드 간격</span>
                  <span className="font-medium">{data.topGroup.uploadInterval}일</span>
                </div>
              </div>
              <div className="mt-3 space-y-1">
                {data.topGroup.commonPatterns.map((pattern, i) => (
                  <span
                    key={i}
                    className="mr-1 inline-block rounded bg-emerald-100 px-1.5 py-0.5 text-xs text-emerald-700"
                  >
                    {pattern}
                  </span>
                ))}
              </div>
            </div>

            {/* Bottom Group */}
            <div className="rounded-lg border border-rose-200 bg-rose-50/50 p-4">
              <div className="mb-3 flex items-center gap-2">
                <TrendingDown className="size-4 text-rose-600" />
                <span className="text-sm font-medium text-rose-700">하위 20%</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">평균 조회수</span>
                  <span className="font-medium">{formatViews(data.bottomGroup.avgViews)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">제목 길이</span>
                  <span className="font-medium">{data.bottomGroup.avgTitleLength}자</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">영상 길이</span>
                  <span className="font-medium">{data.bottomGroup.avgVideoDuration}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">업로드 간격</span>
                  <span className="font-medium">{data.bottomGroup.uploadInterval}일</span>
                </div>
              </div>
              <div className="mt-3 space-y-1">
                {data.bottomGroup.commonPatterns.map((pattern, i) => (
                  <span
                    key={i}
                    className="mr-1 inline-block rounded bg-rose-100 px-1.5 py-0.5 text-xs text-rose-700"
                  >
                    {pattern}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Visual Comparison */}
          <div className="space-y-6">
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="size-2.5 rounded-full bg-emerald-500" />
                <span className="text-muted-foreground">상위</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="size-2.5 rounded-full bg-rose-400" />
                <span className="text-muted-foreground">하위</span>
              </div>
            </div>

            <ComparisonBar
              label="평균 조회수"
              topValue={data.topGroup.avgViews}
              bottomValue={data.bottomGroup.avgViews}
              format={(v) => formatViews(typeof v === "number" ? v : Number(v))}
            />
            <ComparisonBar
              label="제목 길이"
              topValue={data.topGroup.avgTitleLength}
              bottomValue={data.bottomGroup.avgTitleLength}
              unit="자"
            />
            <ComparisonBar
              label="업로드 간격"
              topValue={data.bottomGroup.uploadInterval}
              bottomValue={data.topGroup.uploadInterval}
              unit="일"
            />
          </div>
        </div>

        {/* Difference Points */}
        <div className="mt-6 rounded-lg bg-muted/50 p-4">
          <h4 className="mb-3 text-sm font-medium">반복 차이 패턴</h4>
          <ul className="space-y-2">
            {data.differencePoints.map((point, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <ArrowRight className="mt-0.5 size-3.5 shrink-0 text-foreground" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
