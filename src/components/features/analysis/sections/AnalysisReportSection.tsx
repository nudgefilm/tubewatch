"use client"

import { useState, useEffect, useRef } from "react"
import { Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { OnePagerCard } from "@/components/features/shared/OnePagerCard"

interface AnalysisReportSectionProps {
  channelId: string
}

function usePendingMessage(isActive: boolean) {
  const [elapsed, setElapsed] = useState(0)
  const startRef = useRef<number | null>(null)

  useEffect(() => {
    if (!isActive) { startRef.current = null; setElapsed(0); return }
    if (!startRef.current) startRef.current = Date.now()
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current!) / 1000))
    }, 5000)
    return () => clearInterval(timer)
  }, [isActive])

  if (elapsed < 60) return { label: "약 3~5분 내 자동 완성됩니다", sub: "다른 메뉴를 먼저 둘러보셔도 됩니다." }
  if (elapsed < 240) return { label: "거의 완성되고 있습니다", sub: "잠시 후 이 화면으로 돌아오시면 확인할 수 있습니다." }
  return { label: "조금 더 걸리고 있습니다", sub: "페이지를 새로고침하거나 잠시 후 다시 확인해 주세요." }
}

const ShellHeader = () => (
  <div className="flex items-center justify-between px-5 py-3 border-b bg-muted/30">
    <div className="flex items-center gap-2">
      <span className="font-heading font-medium text-sm leading-none tracking-[-0.01em]">TubeWatch™</span>
      <span className="text-muted-foreground/40 text-sm">|</span>
      <span className="text-sm font-semibold text-foreground">채널 종합 진단서</span>
      <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-200">튜브워치 엔진</Badge>
    </div>
  </div>
)

export function AnalysisReportSection({ channelId }: AnalysisReportSectionProps) {
  const [markdown, setMarkdown] = useState<string | null>(null)
  const [pending, setPending] = useState(true)
  const [initialFetchDone, setInitialFetchDone] = useState(false)
  const isGenerating = (pending || !initialFetchDone) && !markdown
  const pendingMsg = usePendingMessage(isGenerating)

  useEffect(() => {
    const controller = new AbortController()
    let intervalId: ReturnType<typeof setInterval> | null = null

    setMarkdown(null)
    setPending(true)
    setInitialFetchDone(false)

    async function fetchNow() {
      try {
        const res = await fetch(`/api/analysis/report?channelId=${channelId}`, { signal: controller.signal })
        const data = await res.json() as { markdown: string | null; pending?: boolean }
        if (data.markdown && data.markdown.length <= 60000) {
          setMarkdown(data.markdown)
          setPending(false)
          if (intervalId) { clearInterval(intervalId); intervalId = null }
        } else if (data.pending) {
          setPending(true)
        } else {
          setPending(false)
          if (intervalId) { clearInterval(intervalId); intervalId = null }
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return
        setPending(false)
      } finally {
        if (!controller.signal.aborted) setInitialFetchDone(true)
      }
    }

    fetchNow()
    intervalId = setInterval(fetchNow, 8000)

    return () => {
      controller.abort()
      if (intervalId) { clearInterval(intervalId); intervalId = null }
    }
  }, [channelId])

  if (markdown) {
    return (
      <OnePagerCard
        title="채널 종합 진단서"
        markdown={markdown}
        downloadFilename="채널종합진단서.png"
      />
    )
  }

  if (isGenerating) {
    return (
      <div className="rounded-xl border bg-card overflow-hidden">
        <ShellHeader />
        <div className="px-5 py-5 space-y-2">
          <div className="flex items-center gap-2">
            <Loader2 className="size-3.5 animate-spin text-primary shrink-0" />
            <span className="text-sm font-medium text-foreground">{pendingMsg.label}</span>
          </div>
          <p className="text-xs text-muted-foreground pl-[22px]">{pendingMsg.sub}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <ShellHeader />
      <div className="px-5 py-5">
        <p className="text-sm text-muted-foreground">채널 분석 후 자동으로 생성됩니다.</p>
      </div>
    </div>
  )
}
