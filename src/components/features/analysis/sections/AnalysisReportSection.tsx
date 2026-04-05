"use client"

import { useState, useEffect, useRef } from "react"
import { Download, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

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

  if (elapsed < 30) return { label: "약 2~3분 내 자동 완성됩니다", sub: "다른 메뉴를 먼저 둘러보셔도 됩니다." }
  if (elapsed < 150) return { label: "거의 완성되고 있습니다", sub: "잠시 후 이 화면으로 돌아오시면 확인할 수 있습니다." }
  return { label: "조금 더 걸리고 있습니다", sub: "페이지를 새로고침하거나 잠시 후 다시 확인해 주세요." }
}

/** 마크다운 렌더러 */
function ReportDocument({ markdown }: { markdown: string }) {
  const lines = markdown.split("\n")
  const elements: React.ReactNode[] = []
  let i = 0

  function renderInline(text: string): React.ReactNode[] {
    const parts = text.split(/(\*\*[^*]+\*\*)/)
    return parts.map((part, idx) =>
      part.startsWith("**") && part.endsWith("**")
        ? <strong key={idx} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>
        : <span key={idx}>{part}</span>
    )
  }

  while (i < lines.length) {
    const line = lines[i]

    if (line.startsWith("## ") || line.startsWith("# ")) {
      const text = line.replace(/^#{1,2}\s*/, "")
      const match = text.match(/^(.*?)\s*(\([^)]+\))?$/)
      const mainTitle = match?.[1]?.trim() ?? text
      const subTitle = match?.[2] ?? ""
      elements.push(
        <div key={i} className={`${elements.length > 0 ? "mt-6" : ""} mb-2`}>
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            {mainTitle}
            {subTitle && <span className="text-xs font-normal text-muted-foreground/70">{subTitle}</span>}
          </h3>
          <div className="mt-1 h-px bg-border/60" />
        </div>
      )
      i++; continue
    }

    if (line.startsWith("### ")) {
      elements.push(<p key={i} className="text-xs font-semibold text-foreground/80 mt-4 mb-1">{line.replace(/^###\s*/, "")}</p>)
      i++; continue
    }

    if (line.startsWith("- ") || line.startsWith("* ")) {
      const items: string[] = []
      while (i < lines.length && (lines[i].startsWith("- ") || lines[i].startsWith("* "))) {
        items.push(lines[i].replace(/^[-*]\s+/, "")); i++
      }
      elements.push(
        <ul key={`ul-${i}`} className="space-y-1 mb-1">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground leading-relaxed">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/50 shrink-0" />
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      )
      continue
    }

    if (/^\d+\.\s/.test(line)) {
      const items: string[] = []
      let num = 1
      while (i < lines.length && new RegExp(`^${num}\\. `).test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, "")); i++; num++
      }
      elements.push(
        <ol key={`ol-${i}`} className="space-y-1.5 mb-1">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2.5 text-sm text-muted-foreground leading-relaxed">
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">{idx + 1}</span>
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ol>
      )
      continue
    }

    if (line.trim() === "") { i++; continue }

    elements.push(<p key={i} className="text-sm text-muted-foreground leading-relaxed mb-2">{renderInline(line)}</p>)
    i++
  }

  return <div className="space-y-0.5">{elements}</div>
}

export function AnalysisReportSection({ channelId }: AnalysisReportSectionProps) {
  const [markdown, setMarkdown] = useState<string | null>(null)
  const [pending, setPending] = useState(true)
  const [initialFetchDone, setInitialFetchDone] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isGenerating = (pending || !initialFetchDone) && !markdown
  const pendingMsg = usePendingMessage(isGenerating)

  async function fetchFromDB() {
    try {
      const res = await fetch(`/api/analysis/report?channelId=${channelId}`)
      const data = await res.json() as { markdown: string | null; pending?: boolean }
      if (data.markdown) {
        setMarkdown(data.markdown)
        setPending(false)
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

  async function handleDownload() {
    if (!cardRef.current) return
    try {
      const { toPng } = await import("html-to-image")
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, backgroundColor: "#ffffff" })
      const link = document.createElement("a")
      link.href = dataUrl
      link.download = "채널종합진단서.png"
      link.style.position = "fixed"
      link.style.opacity = "0"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (e) {
      console.error("[download]", e)
    }
  }

  const SectionHeader = () => (
    <div className="flex items-center justify-between px-5 py-3 border-b bg-muted/30">
      <div className="flex items-center gap-2">
        <span className="font-heading font-medium text-sm leading-none tracking-[-0.01em]">TubeWatch™</span>
        <span className="text-muted-foreground/40 text-sm">|</span>
        <span className="text-sm font-semibold text-foreground">채널 종합 진단서</span>
        <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-200">튜브워치 엔진</Badge>
      </div>
      {markdown && (
        <button
          onClick={handleDownload}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          title="이미지로 저장"
        >
          <Download className="h-3.5 w-3.5" />
          <span>이미지 저장</span>
        </button>
      )}
    </div>
  )

  if (markdown) {
    return (
      <div ref={cardRef} className="rounded-xl border bg-card overflow-hidden">
        <SectionHeader />
        <div className="px-5 py-5">
          <ReportDocument markdown={markdown} />
        </div>
      </div>
    )
  }

  if (isGenerating) {
    return (
      <div className="rounded-xl border bg-card overflow-hidden">
        <SectionHeader />
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
      <SectionHeader />
      <div className="px-5 py-5">
        <p className="text-sm text-muted-foreground">채널 분석 후 자동으로 생성됩니다.</p>
      </div>
    </div>
  )
}
