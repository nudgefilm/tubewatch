"use client"

import { useState, useEffect, useRef } from "react"
import { Download, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface ChannelDnaReportSectionProps {
  channelId: string
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

export function ChannelDnaReportSection({ channelId }: ChannelDnaReportSectionProps) {
  const [markdown, setMarkdown] = useState<string | null>(null)
  const [pending, setPending] = useState(true)   // 마운트 직후에는 loading으로 시작
  const [initialFetchDone, setInitialFetchDone] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  async function fetchFromDB() {
    try {
      const res = await fetch(`/api/channel-dna/report?channelId=${channelId}`)
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
    pollRef.current = setInterval(() => {
      fetchFromDB()
    }, 3000)
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
      link.download = "채널DNA진단리포트.png"
      link.style.position = "fixed"
      link.style.opacity = "0"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (e) {
      console.error("[download]", e)
    }
  }

  // 섹션 헤더는 항상 표시
  const CardHeader = () => (
    <div className="flex items-center justify-between px-5 py-3 border-b bg-muted/30">
      <div className="flex items-center gap-2">
        <span className="font-heading font-medium text-sm leading-none tracking-[-0.01em]">TubeWatch™</span>
        <span className="text-muted-foreground/40 text-sm">|</span>
        <span className="text-sm font-semibold text-foreground">채널 DNA 진단 리포트</span>
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

  // 리포트 완료
  if (markdown) {
    return (
      <div ref={cardRef} className="rounded-xl border bg-card overflow-hidden">
        <CardHeader />
        <div className="px-5 py-5">
          <ReportDocument markdown={markdown} />
        </div>
      </div>
    )
  }

  // 생성 중 (pending) 또는 초기 로딩 전
  if (pending || !initialFetchDone) {
    return (
      <div className="rounded-xl border bg-card overflow-hidden">
        <CardHeader />
        <div className="px-5 py-5 space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin text-primary shrink-0" />
            <span>채널 DNA 진단 리포트를 생성하고 있습니다. 잠시만 기다려주세요…</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-primary/60 rounded-full animate-[loading_2s_ease-in-out_infinite]" style={{ width: "60%" }} />
          </div>
        </div>
      </div>
    )
  }

  // 분석 전 (스냅샷 없음)
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <CardHeader />
      <div className="px-5 py-5">
        <p className="text-sm text-muted-foreground">채널 분석 후 자동으로 생성됩니다.</p>
      </div>
    </div>
  )
}
