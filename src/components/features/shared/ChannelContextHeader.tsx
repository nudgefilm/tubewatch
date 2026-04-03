"use client"

import Image from "next/image"
import { Users, Video } from "lucide-react"

export type ChannelContext = {
  title: string | null
  thumbnailUrl: string | null
  subscriberCount: number | null
  videoCount?: number | null
} | null

interface ChannelContextHeaderProps {
  channelContext?: ChannelContext
}

function formatSubscribers(n: number): string {
  if (n >= 100000000) return `${(n / 100000000).toFixed(1)}억`
  if (n >= 10000) return `${(n / 10000).toFixed(0)}만`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}천`
  return n.toLocaleString()
}

export function ChannelContextHeader({ channelContext }: ChannelContextHeaderProps) {
  if (!channelContext?.title) return null

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-muted/40 px-4 py-3">
      {/* 썸네일 */}
      <div className="relative size-9 shrink-0 overflow-hidden rounded-full bg-muted">
        {channelContext.thumbnailUrl ? (
          <Image
            src={channelContext.thumbnailUrl}
            alt={channelContext.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-muted">
            <Users className="size-4 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* 채널 정보 */}
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-base font-bold leading-none">
          {channelContext.title}
        </span>
        <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
          {channelContext.subscriberCount != null && (
            <span className="flex items-center gap-1">
              <Users className="size-3" />
              구독자 {formatSubscribers(channelContext.subscriberCount)}
            </span>
          )}
          {channelContext.videoCount != null && (
            <span className="flex items-center gap-1">
              <Video className="size-3" />
              영상 {channelContext.videoCount.toLocaleString()}개
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
