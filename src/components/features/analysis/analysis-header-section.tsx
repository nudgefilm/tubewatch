"use client"

import Image from "next/image"
import { Users, Video, Upload, Clock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { ChannelData } from "./mock-data"

interface AnalysisHeaderSectionProps {
  channel: ChannelData
}

function getStatusBadgeStyle(status: ChannelData["statusBadge"]) {
  switch (status) {
    case "성장세":
      return "bg-emerald-50 text-emerald-700 border-emerald-200"
    case "초기 성장":
      return "bg-blue-50 text-blue-700 border-blue-200"
    case "정체 구간":
      return "bg-amber-50 text-amber-700 border-amber-200"
    case "회복 필요":
      return "bg-orange-50 text-orange-700 border-orange-200"
    case "구조 재정비 필요":
      return "bg-rose-50 text-rose-700 border-rose-200"
    default:
      return "bg-muted text-muted-foreground"
  }
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

export function AnalysisHeaderSection({ channel }: AnalysisHeaderSectionProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          {/* Channel Thumbnail and Basic Info */}
          <div className="flex items-start gap-4">
            <div className="relative size-16 shrink-0 overflow-hidden rounded-full bg-muted lg:size-20">
              <Image
                src={channel.thumbnail}
                alt={channel.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-semibold lg:text-2xl">{channel.name}</h2>
                <Badge variant="outline" className={getStatusBadgeStyle(channel.statusBadge)}>
                  {channel.statusBadge}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{channel.channelDiagnosis}</p>
            </div>
          </div>

          {/* Metrics */}
          <div className="flex flex-wrap gap-4 lg:ml-auto lg:gap-6">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-md bg-muted">
                <Users className="size-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">{formatNumber(channel.subscribers)}</p>
                <p className="text-xs text-muted-foreground">구독자</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-md bg-muted">
                <Video className="size-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">{channel.totalVideos.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">총 영상</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-md bg-muted">
                <Upload className="size-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">{channel.recentUploads}</p>
                <p className="text-xs text-muted-foreground">최근 30일</p>
              </div>
            </div>
          </div>
        </div>

        {/* Status Summary */}
        <div className="mt-6 rounded-lg bg-muted/50 p-4">
          <p className="text-sm text-foreground">{channel.statusSummary}</p>
          <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="size-3" />
            <span>최근 분석: {channel.lastAnalyzedAt}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
