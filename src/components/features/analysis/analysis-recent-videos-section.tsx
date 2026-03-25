"use client"

import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { VideoData } from "./mock-data"

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

export function AnalysisRecentVideosSection({ videos }: AnalysisRecentVideosSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">최근 영상 목록</CardTitle>
        <CardDescription>분석 대상 영상 표본 ({videos.length}개)</CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[400px] pl-6">영상</TableHead>
                <TableHead className="text-center">업로드</TableHead>
                <TableHead className="text-right">조회수</TableHead>
                <TableHead className="text-center">길이</TableHead>
                <TableHead className="text-center">성과</TableHead>
                <TableHead className="pr-6">패턴</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {videos.map((video) => (
                <TableRow key={video.id} className="group">
                  <TableCell className="pl-6">
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded bg-muted">
                        <Image
                          src={video.thumbnail}
                          alt={video.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <span className="line-clamp-2 text-sm font-medium">{video.title}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-sm text-muted-foreground">
                    {formatDate(video.uploadDate)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatViews(video.views)}
                  </TableCell>
                  <TableCell className="text-center text-sm text-muted-foreground">
                    {video.duration}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant="outline"
                      className={getPerformanceBadgeStyle(video.performanceBadge)}
                    >
                      {video.performanceBadge}
                    </Badge>
                  </TableCell>
                  <TableCell className="pr-6">
                    <div className="flex flex-wrap gap-1">
                      {video.patternTags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
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
