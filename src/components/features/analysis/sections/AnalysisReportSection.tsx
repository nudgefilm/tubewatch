"use client"

import { useState, useEffect, useRef } from "react"
import { Loader2, RefreshCw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { OnePagerCard } from "@/components/features/shared/OnePagerCard"
import { IntegratedSummaryButton } from "@/components/features/shared/IntegratedSummaryButton"

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

  void elapsed
  return { label: "튜브워치 엔진이 채널의 잠재력 분석을 통해 6가지 핵심 섹션을 설계하고 있습니다.", sub: "작업이 완료되면 전략 리포트가 자동 노출되니 잠시 후 확인 바랍니다." }
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
  const [isFailed, setIsFailed] = useState(false)
  const [isRetrying, setIsRetrying] = useState(false)
  const [retryError, setRetryError] = useState<string | null>(null)
  const isGenerating = (pending || !initialFetchDone) && !markdown
  const pendingMsg = usePendingMessage(isGenerating)

  useEffect(() => {
    const controller = new AbortController()
    let intervalId: ReturnType<typeof setInterval> | null = null

    setMarkdown(null)
    setPending(true)
    setInitialFetchDone(false)
    setIsFailed(false)
    setRetryError(null)

    async function fetchNow() {
      try {
        const res = await fetch(`/api/analysis/report?channelId=${channelId}`, { signal: controller.signal })
        const data = await res.json() as { markdown: string | null; pending?: boolean; reason?: string }
        if (data.markdown && data.markdown.length <= 60000) {
          setMarkdown(data.markdown)
          setPending(false)
          if (intervalId) { clearInterval(intervalId); intervalId = null }
        } else if (data.pending) {
          setPending(true)
        } else {
          setPending(false)
          if (!data.markdown) setIsFailed(true)
          if (intervalId) { clearInterval(intervalId); intervalId = null }
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return
        setPending(false)
        setIsFailed(true)
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

  async function handleRetry() {
    setIsRetrying(true)
    setRetryError(null)
    try {
      const res = await fetch("/api/analysis/regenerate-module", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId, moduleKey: "analysis_report" }),
      })
      const data = await res.json() as { ok?: boolean; markdown?: string; error?: string }
      if (data.ok && data.markdown) {
        setMarkdown(data.markdown)
        setIsFailed(false)
      } else {
        setRetryError(data.error ?? "재생성에 실패했습니다. 잠시 후 다시 시도해주세요.")
      }
    } catch {
      setRetryError("네트워크 오류가 발생했습니다.")
    } finally {
      setIsRetrying(false)
    }
  }

  if (markdown) {
    return (
      <>
        <OnePagerCard
          title="채널 종합 진단서"
          markdown={markdown}
          downloadFilename="채널종합진단서.png"
        />
        <IntegratedSummaryButton channelId={channelId} />
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

  if (isFailed) {
    return (
      <div className="rounded-xl border bg-card overflow-hidden">
        <ShellHeader />
        <div className="px-5 py-5 space-y-3">
          <p className="text-sm text-muted-foreground">리포트를 불러오지 못했습니다. 아래 버튼으로 해당 섹션만 다시 생성할 수 있습니다.</p>
          <button
            type="button"
            onClick={() => { void handleRetry() }}
            disabled={isRetrying}
            className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 transition-colors disabled:opacity-50 disabled:pointer-events-none"
          >
            {isRetrying
              ? <><Loader2 className="size-3.5 animate-spin" /><span>재생성 중…</span></>
              : <><RefreshCw className="size-3.5" /><span>이 섹션 다시 생성하기</span></>
            }
          </button>
          {retryError && <p className="text-xs text-red-500">{retryError}</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <ShellHeader />
      <div className="px-5 py-5">
        <p className="text-sm text-muted-foreground">튜브워치 엔진이 채널의 잠재력 분석을 통해 6가지 핵심 섹션을 설계하고 있습니다. 작업이 완료되면 전략 리포트가 자동 노출되니 잠시 후 확인 바랍니다.</p>
      </div>
    </div>
  )
}
