"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Plus, Youtube, Users, Video, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

// Mock data for demonstration
const mockChannels = [
  {
    id: "UC_x5XG1OV2P6uZZ5FSM9Ttw",
    name: "Google Developers",
    thumbnail: "/placeholder.svg",
    subscribers: "2.5M",
    videoCount: 1234,
  },
  {
    id: "UCVHFbqXqoYvEWM1Ddxl0QKg",
    name: "Tech Channel",
    thumbnail: "/placeholder.svg",
    subscribers: "890K",
    videoCount: 567,
  },
]

interface Channel {
  id: string
  name: string
  thumbnail: string
  subscribers: string
  videoCount: number
}

function ChannelCard({ channel }: { channel: Channel }) {
  return (
    <Card className="hover-lift overflow-hidden">
      <CardHeader className="pb-0">
        <div className="flex items-center gap-4">
          <div className="relative size-16 overflow-hidden rounded-full bg-muted">
            <Image
              src={channel.thumbnail}
              alt={channel.name}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="truncate text-base">{channel.name}</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Users className="size-4" />
            <span>구독자 {channel.subscribers}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Video className="size-4" />
            <span>영상 {channel.videoCount.toLocaleString()}개</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <Link href={`/analysis/${channel.id}`}>
            <BarChart3 className="size-4" />
            채널 분석하기
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

function EmptyChannelState({ onAddChannel }: { onAddChannel: () => void }) {
  return (
    <Empty className="border min-h-[400px]">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Youtube className="size-6" />
        </EmptyMedia>
        <EmptyTitle>등록된 채널이 없습니다</EmptyTitle>
        <EmptyDescription>
          유튜브 채널을 등록하고 분석을 시작하세요
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button onClick={onAddChannel}>
          <Plus className="size-4" />
          채널 추가
        </Button>
      </EmptyContent>
    </Empty>
  )
}

function AddChannelDialog({
  open,
  onOpenChange,
  onAdd,
  channelCount,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (url: string) => void
  channelCount: number
}) {
  const [channelUrl, setChannelUrl] = useState("")
  const maxChannels = 3
  const canAddMore = channelCount < maxChannels

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (channelUrl.trim() && canAddMore) {
      onAdd(channelUrl)
      setChannelUrl("")
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>채널 추가</DialogTitle>
          <DialogDescription>
            분석하고 싶은 유튜브 채널 URL을 입력하세요
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="py-4">
            <Input
              placeholder="https://youtube.com/@channel"
              value={channelUrl}
              onChange={(e) => setChannelUrl(e.target.value)}
              disabled={!canAddMore}
            />
            <p className="mt-2 text-sm text-muted-foreground">
              최대 {maxChannels}개의 채널을 등록할 수 있습니다 ({channelCount}/{maxChannels})
            </p>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                취소
              </Button>
            </DialogClose>
            <Button type="submit" disabled={!channelUrl.trim() || !canAddMore}>
              <Plus className="size-4" />
              추가
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function ChannelsPage() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const maxChannels = 3

  const handleAddChannel = (url: string) => {
    // In a real app, this would fetch channel data from YouTube API
    const newChannel: Channel = {
      id: `channel-${Date.now()}`,
      name: "새 채널",
      thumbnail: "/placeholder.svg",
      subscribers: "0",
      videoCount: 0,
    }
    setChannels((prev) => [...prev, newChannel])
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">내 채널</h1>
            <p className="mt-1 text-muted-foreground">
              유튜브 채널을 등록하고 채널 분석을 시작하세요
            </p>
          </div>
          {channels.length > 0 && channels.length < maxChannels && (
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="size-4" />
              채널 추가
            </Button>
          )}
        </div>

        {/* Channel limit message */}
        {channels.length > 0 && (
          <p className="mb-6 text-sm text-muted-foreground">
            최대 {maxChannels}개의 채널을 등록할 수 있습니다 ({channels.length}/{maxChannels})
          </p>
        )}

        {/* Content */}
        {channels.length === 0 ? (
          <EmptyChannelState onAddChannel={() => setDialogOpen(true)} />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {channels.map((channel) => (
              <ChannelCard key={channel.id} channel={channel} />
            ))}
          </div>
        )}

        {/* Add Channel Dialog */}
        <AddChannelDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onAdd={handleAddChannel}
          channelCount={channels.length}
        />
      </div>
    </div>
  )
}
