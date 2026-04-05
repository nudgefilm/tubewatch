"use client"

import { useState, useEffect, useRef } from "react"
import { Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { OnePagerCard } from "@/components/features/shared/OnePagerCard"

interface StrategyPlanSectionProps {
  channelId: string
}

const COOLDOWN_MS = 12 * 60 * 60 * 1000
const storageKey = (id: string) => `tw_strategy_sat:${id}`

function getRemainingLabel(savedAt: number): string | null {
  const remaining = COOLDOWN_MS - (Date.now() - savedAt)
  if (remaining <= 0) return null
  const h = Math.floor(remaining / (1000 * 60 * 60))
  const m = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
  return h > 0 ? `${h}시간 ${m}분` : `${m}분`
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

  if (elapsed < 30) return { label: "약 1~2분 내 자동 완성됩니다", sub: "다른 메뉴를 먼저 둘러보셔도 됩니다." }
  if (elapsed < 120) return { label: "거의 완성되고 있습니다", sub: "잠시 후 이 화면으로 돌아오시면 확인할 수 있습니다." }
  return { label: "조금 더 걸리고 있습니다", sub: "페이지를 새로고침하거나 잠시 후 다시 확인해 주세요." }
}

const ShellHeader = () => (
  <div className="flex items-center justify-between px-5 py-3 border-b bg-muted/30">
    <div className="flex items-center gap-2">
      <span className="font-heading font-medium text-sm leading-none tracking-[-0.01em]">TubeWatch™</span>
      <span className="text-muted-foreground/40 text-sm">|</span>
      <span className="text-sm font-semibold text-foreground">성장 전략 실행 플랜</span>
      <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-200">튜브워치 엔진</Badge>
    </div>
  </div>
)

export function StrategyPlanSection({ channelId }: StrategyPlanSectionProps) {
  const [markdown, setMarkdown] = useState<string | null>(null)
  const [pending, setPending] = useState(true)
  const [initialFetchDone, setInitialFetchDone] = useState(false)
  const [remainLabel, setRemainLabel] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isGenerating = (pending || !initialFetchDone) && !markdown
  const pendingMsg = usePendingMessage(isGenerating)

  async function fetchFromDB() {
    try {
      const res = await fetch(`/api/action-plan/strategy-plan?channelId=${channelId}`)
      const data = await res.json() as { markdown: string | null; pending?: boolean }
      if (data.markdown) {
        setMarkdown(data.markdown)
        setPending(false)
        try {
          const existing = localStorage.getItem(storageKey(channelId))
          if (!existing) localStorage.setItem(storageKey(channelId), String(Date.now()))
        } catch { /* ignore */ }
        stopPolling()
      } else if (data.pending) {
        setPending(true)
      } else {
        setPending(false)
      }
    } catch {
      setPending(false)
    } finally {
      setInitialFetchDone(true)
    }
  }

  function stopPolling() {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
  }

  useEffect(() => {
    fetchFromDB()
    pollRef.current = setInterval(() => { fetchFromDB() }, 3000)
    return () => stopPolling()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId])

  useEffect(() => {
    if (!pending && markdown) stopPolling()
  }, [pending, markdown])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(channelId))
      if (!raw) return
      const savedAt = Number(raw)
      const update = () => setRemainLabel(getRemainingLabel(savedAt))
      update()
      const timer = setInterval(update, 60_000)
      return () => clearInterval(timer)
    } catch { /* ignore */ }
  }, [channelId, markdown])

  if (markdown) {
    return (
      <>
        <OnePagerCard
          title="성장 전략 실행 플랜"
          markdown={markdown}
          downloadFilename="성장전략실행플랜.png"
        />
        {remainLabel && (
          <p className="mt-2 text-right text-xs text-muted-foreground px-1">
            {remainLabel} 후 재분석 시 갱신됩니다
          </p>
        )}
      </>
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
