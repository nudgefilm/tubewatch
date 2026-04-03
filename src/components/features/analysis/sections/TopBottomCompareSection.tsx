"use client"

import { TrendingUp, TrendingDown, ArrowRight, ThumbsUp, MessageSquare } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SegmentGauge } from "@/components/ui/SegmentGauge"
import type { ComparisonData, VideoData } from "../mock-data"

interface AnalysisTopBottomCompareProps {
  data: ComparisonData | null
  sampleCount?: number
  videos?: VideoData[]
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

function formatCount(n: number): string {
  if (n >= 10000) return `${Math.floor(n / 1000)}K`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return n.toString()
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${month}/${day}`
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
  const topScore = maxVal > 0 ? (numTop / maxVal) * 100 : 0
  const bottomScore = maxVal > 0 ? (numBottom / maxVal) * 100 : 0

  return (
    <div className="space-y-1.5">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <SegmentGauge score={topScore} stretch label={false} variant="primary" />
          </div>
          <span className="w-14 shrink-0 text-right text-xs font-medium tabular-nums">
            {format(topValue)}{unit}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <SegmentGauge score={bottomScore} stretch label={false} variant="subtle" />
          </div>
          <span className="w-14 shrink-0 text-right text-xs font-medium tabular-nums">
            {format(bottomValue)}{unit}
          </span>
        </div>
      </div>
    </div>
  )
}

/** 표본 부족 시 videos 배열로 최고/최저 카드 렌더링 */
function SparseSampleCompare({ videos, sampleCount }: { videos: VideoData[]; sampleCount: number }) {
  const sorted = [...videos].sort((a, b) => b.views - a.views)
  const best = sorted[0]
  const worst = sorted[sorted.length - 1]
  const hasTwoCards = sorted.length >= 2 && best.id !== worst.id

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="space-y-1">
          <CardTitle className="text-base">상위/하위 성과 비교</CardTitle>
          <p className="text-sm leading-relaxed text-muted-foreground">
            현재 {sampleCount}개 영상 기준 — 표본이 적어 참고용 비교입니다
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <div className={`grid gap-3 ${hasTwoCards ? "sm:grid-cols-2" : ""}`}>
          {/* 최고 성과 */}
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-4">
            <div className="mb-2 flex items-center gap-1.5">
              <TrendingUp className="size-3.5 text-emerald-600" />
              <span className="text-sm font-semibold text-emerald-700">최고 성과</span>
            </div>
            <p className="line-clamp-2 text-sm font-medium leading-snug">{best.title}</p>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="font-semibold tabular-nums text-emerald-700">
                {formatViews(best.views)}
              </span>
              {best.likeCount != null && (
                <span className="flex items-center gap-1 tabular-nums">
                  <ThumbsUp className="size-3 shrink-0" />
                  {formatCount(best.likeCount)}
                </span>
              )}
              {best.commentCount != null && (
                <span className="flex items-center gap-1 tabular-nums">
                  <MessageSquare className="size-3 shrink-0" />
                  {formatCount(best.commentCount)}
                </span>
              )}
              {best.uploadDate && <span>{formatDate(best.uploadDate)}</span>}
              <span>{best.duration}</span>
            </div>
          </div>

          {/* 최저 성과 (2개 이상일 때만) */}
          {hasTwoCards && (
            <div className="rounded-lg border border-rose-200 bg-rose-50/40 p-4">
              <div className="mb-2 flex items-center gap-1.5">
                <TrendingDown className="size-3.5 text-rose-600" />
                <span className="text-sm font-semibold text-rose-700">최저 성과</span>
              </div>
              <p className="line-clamp-2 text-sm font-medium leading-snug">{worst.title}</p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="font-semibold tabular-nums text-rose-600">
                  {formatViews(worst.views)}
                </span>
                {worst.likeCount != null && (
                  <span className="flex items-center gap-1 tabular-nums">
                    <ThumbsUp className="size-3 shrink-0" />
                    {formatCount(worst.likeCount)}
                  </span>
                )}
                {worst.commentCount != null && (
                  <span className="flex items-center gap-1 tabular-nums">
                    <MessageSquare className="size-3 shrink-0" />
                    {formatCount(worst.commentCount)}
                  </span>
                )}
                {worst.uploadDate && <span>{formatDate(worst.uploadDate)}</span>}
                <span>{worst.duration}</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function AnalysisTopBottomCompare({ data, sampleCount, videos }: AnalysisTopBottomCompareProps) {
  // 비교 데이터 없음: videos 있으면 참고용 비교, 없으면 안내
  if (!data) {
    if (videos && videos.length > 0) {
      return <SparseSampleCompare videos={videos} sampleCount={sampleCount ?? videos.length} />
    }
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">상위/하위 성과 비교</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {sampleCount != null && sampleCount < 5
              ? `현재 ${sampleCount}개 영상 기준으로 상위/하위 비교를 산출하기 어렵습니다. 표본이 늘면 비교 분석이 활성화됩니다.`
              : "상위/하위 비교 데이터가 없습니다."}
          </p>
        </CardContent>
      </Card>
    )
  }

  const [firstPoint, ...remainingPoints] = data.differencePoints

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="space-y-1">
          <CardTitle className="text-base">상위/하위 성과 비교</CardTitle>
          {firstPoint && (
            <p className="text-xs leading-relaxed text-muted-foreground">{firstPoint}</p>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Group cards + bars */}
        <div className="grid gap-4 lg:grid-cols-2">

          {/* Left: Group summary cards */}
          <div className="grid gap-3 sm:grid-cols-2">
            {/* Top Group */}
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-3.5">
              <div className="mb-2.5 flex items-center gap-1.5">
                <TrendingUp className="size-3.5 text-emerald-600" />
                <span className="text-xs font-semibold text-emerald-700">상위 그룹</span>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">평균 조회수</span>
                  <span className="font-semibold tabular-nums">{formatViews(data.topGroup.avgViews)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">제목 길이</span>
                  <span className="font-medium">{data.topGroup.avgTitleLength}자</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">영상 길이</span>
                  <span className="font-medium">{data.topGroup.avgVideoDuration}</span>
                </div>
                {data.topGroup.uploadInterval > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">업로드 간격</span>
                    <span className="font-medium">{data.topGroup.uploadInterval}일</span>
                  </div>
                )}
              </div>
              {data.topGroup.commonPatterns.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1">
                  {data.topGroup.commonPatterns.map((pattern, i) => (
                    <span
                      key={i}
                      className="inline-block rounded bg-emerald-100 px-1.5 py-0.5 text-[11px] text-emerald-700"
                    >
                      {pattern}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Group */}
            <div className="rounded-lg border border-rose-200 bg-rose-50/40 p-3.5">
              <div className="mb-2.5 flex items-center gap-1.5">
                <TrendingDown className="size-3.5 text-rose-600" />
                <span className="text-xs font-semibold text-rose-700">하위 그룹</span>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">평균 조회수</span>
                  <span className="font-semibold tabular-nums">{formatViews(data.bottomGroup.avgViews)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">제목 길이</span>
                  <span className="font-medium">{data.bottomGroup.avgTitleLength}자</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">영상 길이</span>
                  <span className="font-medium">{data.bottomGroup.avgVideoDuration}</span>
                </div>
                {data.bottomGroup.uploadInterval > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">업로드 간격</span>
                    <span className="font-medium">{data.bottomGroup.uploadInterval}일</span>
                  </div>
                )}
              </div>
              {data.bottomGroup.commonPatterns.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1">
                  {data.bottomGroup.commonPatterns.map((pattern, i) => (
                    <span
                      key={i}
                      className="inline-block rounded bg-rose-100 px-1.5 py-0.5 text-[11px] text-rose-700"
                    >
                      {pattern}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Visual bars */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="size-2 rounded-sm bg-primary" />
                <span className="text-muted-foreground">상위</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="size-2 rounded-sm bg-primary/40" />
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
            {(data.topGroup.uploadInterval > 0 || data.bottomGroup.uploadInterval > 0) && (
              <ComparisonBar
                label="업로드 간격"
                topValue={data.bottomGroup.uploadInterval}
                bottomValue={data.topGroup.uploadInterval}
                unit="일"
              />
            )}
          </div>
        </div>

        {/* Additional difference points */}
        {remainingPoints.length > 0 && (
          <div className="rounded-lg bg-muted/40 px-4 py-3">
            <h4 className="mb-2 text-xs font-semibold text-muted-foreground">추가 패턴 비교</h4>
            <ul className="space-y-1.5">
              {remainingPoints.map((point, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <ArrowRight className="mt-0.5 size-3 shrink-0 text-foreground/50" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
