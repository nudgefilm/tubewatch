"use client"

import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { VideoData } from "../mock-data"

interface AnalysisRecentVideosSectionProps {
  videos: VideoData[]
}

function getPerformanceBadgeStyle(badge: VideoData["performanceBadge"]) {
  switch (badge) {
    case "상위":
      return "bg-emerald-50 text-emerald-700 border-emerald-200"
    case "평균권":
      return "bg-muted text-muted-foreground"
    case "하위":
      return "bg-rose-50 text-rose-700 border-rose-200"
    case "관찰 필요":
      return "bg-amber-50 text-amber-700 border-amber-200"
    default:
      return "bg-muted text-muted-foreground"
  }
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

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${month}/${day}`
}

function deriveSummaryLine(videos: VideoData[]): string {
  const withViews = videos.filter((v) => v.views > 0)
  if (withViews.length === 0) return `표본 ${videos.length}편 — 조회수 데이터 준비 중입니다`

  const maxViews = Math.max(...withViews.map((v) => v.views))
  const minViews = Math.min(...withViews.map((v) => v.views))
  const topCount = videos.filter((v) => v.performanceBadge === "상위").length

  if (topCount > 0) {
    return `표본 ${videos.length}편 중 상위 성과 ${topCount}편 포함. 조회수 범위 ${formatViews(minViews)} – ${formatViews(maxViews)}`
  }
  return `표본 ${videos.length}편 기준. 조회수 범위 ${formatViews(minViews)} – ${formatViews(maxViews)}`
}

export function AnalysisRecentVideosSection({ videos }: AnalysisRecentVideosSectionProps) {
  const summaryLine = deriveSummaryLine(videos)
  const isSmallSample = videos.length < 5

  // 1~2개: 간단 카드 리스트
  if (videos.length <= 2) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="space-y-1">
            <CardTitle className="text-base">최근 영상 목록</CardTitle>
            <p className="text-xs leading-relaxed text-muted-foreground">{summaryLine}</p>
          </div>
          <p className="mt-1 text-xs text-amber-600/80">
            현재 {videos.length}개 영상 기준입니다. 표본이 늘면 분석 정확도가 높아집니다.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {videos.map((video) => (
            <div
              key={video.id}
              className={`flex items-center gap-3 rounded-lg border p-3 ${
                video.performanceBadge === "상위" ? "border-emerald-200 bg-emerald-50/30" : ""
              }`}
            >
              <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded-md bg-muted">
                <Image
                  src={video.thumbnail}
                  alt={video.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-medium leading-snug">{video.title}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span
                    className={`font-semibold tabular-nums ${
                      video.performanceBadge === "상위"
                        ? "text-emerald-700"
                        : video.performanceBadge === "하위"
                          ? "text-rose-600"
                          : "text-foreground"
                    }`}
                  >
                    {formatViews(video.views)}
                  </span>
                  {video.uploadDate && <span>{formatDate(video.uploadDate)}</span>}
                  <span>{video.duration}</span>
                </div>
              </div>
              <Badge
                variant="outline"
                className={`shrink-0 ${getPerformanceBadgeStyle(video.performanceBadge)}`}
              >
                {video.performanceBadge}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  // 3개 이상: 테이블
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="space-y-1">
          <CardTitle className="text-base">최근 영상 목록</CardTitle>
          <p className="text-xs leading-relaxed text-muted-foreground">{summaryLine}</p>
        </div>
        {isSmallSample && (
          <p className="mt-1 text-xs text-amber-600/80">
            현재 {videos.length}개 영상 기준입니다. 표본이 늘면 분석 정확도가 높아집니다.
          </p>
        )}
      </CardHeader>
      <CardContent className="px-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[360px] pl-6">영상</TableHead>
                <TableHead className="whitespace-nowrap text-center">업로드</TableHead>
                <TableHead className="whitespace-nowrap text-right">조회수</TableHead>
                <TableHead className="whitespace-nowrap text-center">길이</TableHead>
                <TableHead className="whitespace-nowrap pr-6 text-center">성과</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {videos.map((video) => (
                <TableRow
                  key={video.id}
                  className={`group ${
                    video.performanceBadge === "상위"
                      ? "bg-emerald-50/30 dark:bg-emerald-950/10"
                      : ""
                  }`}
                >
                  <TableCell className="pl-6">
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
                        <Image
                          src={video.thumbnail}
                          alt={video.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <span className="line-clamp-2 text-sm font-medium leading-snug">
                        {video.title}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-center text-sm text-muted-foreground">
                    {video.uploadDate ? formatDate(video.uploadDate) : "—"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right">
                    <span
                      className={`font-mono text-sm font-semibold tabular-nums ${
                        video.performanceBadge === "상위"
                          ? "text-emerald-700 dark:text-emerald-400"
                          : video.performanceBadge === "하위"
                            ? "text-rose-600 dark:text-rose-400"
                            : ""
                      }`}
                    >
                      {formatViews(video.views)}
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-center text-sm text-muted-foreground">
                    {video.duration}
                  </TableCell>
                  <TableCell className="pr-6 text-center">
                    <Badge
                      variant="outline"
                      className={getPerformanceBadgeStyle(video.performanceBadge)}
                    >
                      {video.performanceBadge}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
