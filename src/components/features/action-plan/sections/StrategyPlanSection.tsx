"use client"

import { useState } from "react"
import { Sparkles, Download, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useRef } from "react"

interface StrategyPlanSectionProps {
  channelId: string
}

/** video_plan_document와 동일한 마크다운 렌더러 */
function PlanDocument({ markdown }: { markdown: string }) {
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
      i++
      continue
    }

    if (line.startsWith("### ")) {
      const text = line.replace(/^###\s*/, "")
      elements.push(
        <p key={i} className="text-xs font-semibold text-foreground/80 mt-4 mb-1">{text}</p>
      )
      i++
      continue
    }

    if (line.startsWith("- ") || line.startsWith("* ")) {
      const items: string[] = []
      while (i < lines.length && (lines[i].startsWith("- ") || lines[i].startsWith("* "))) {
        items.push(lines[i].replace(/^[-*]\s+/, ""))
        i++
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
        items.push(lines[i].replace(/^\d+\.\s+/, ""))
        i++
        num++
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

    elements.push(
      <p key={i} className="text-sm text-muted-foreground leading-relaxed mb-2">
        {renderInline(line)}
      </p>
    )
    i++
  }

  return <div className="space-y-0.5">{elements}</div>
}

export function StrategyPlanSection({ channelId }: StrategyPlanSectionProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error" | "cooldown">("idle")
  const [markdown, setMarkdown] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [cooldownLabel, setCooldownLabel] = useState<string | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  async function handleGenerate() {
    setStatus("loading")
    setErrorMsg(null)
    setCooldownLabel(null)
    try {
      const res = await fetch("/api/action-plan/strategy-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId }),
      })
      const data = await res.json()
      if (res.status === 429 || data.code === "COOLDOWN_ACTIVE") {
        const h: number = data.remainHours ?? 0
        const m: number = data.remainMins ?? 0
        const label = h > 0 ? `${h}시간 ${m}분` : `${m}분`
        setCooldownLabel(label)
        setStatus("cooldown")
        return
      }
      if (!res.ok || data.error) {
        setErrorMsg(data.error ?? "생성에 실패했습니다.")
        setStatus("error")
        return
      }
      setMarkdown(data.markdown)
      setStatus("done")
    } catch {
      setErrorMsg("네트워크 오류가 발생했습니다.")
      setStatus("error")
    }
  }

  async function handleDownload() {
    if (!cardRef.current) return
    try {
      const { toPng } = await import("html-to-image")
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, backgroundColor: "#ffffff" })
      const link = document.createElement("a")
      link.href = dataUrl
      link.download = "성장전략실행플랜.png"
      link.style.position = "fixed"
      link.style.opacity = "0"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (e) {
      console.error("[download]", e)
    }
  }

  // 쿨다운 — 버튼 비활성, 안내 메시지
  if (status === "cooldown") {
    return (
      <div className="rounded-xl border border-dashed border-amber-300/60 bg-amber-50/40 dark:bg-amber-950/10 p-8 flex flex-col items-center gap-4 text-center">
        <div className="flex size-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
          <Sparkles className="size-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold">생성 대기 중</p>
          {cooldownLabel ? (
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-amber-600 dark:text-amber-400">{cooldownLabel} 후</span> 생성 가능합니다
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">채널 분석 후 일정 시간이 지나야 생성할 수 있습니다</p>
          )}
        </div>
      </div>
    )
  }

  // 생성 전 — 버튼만 표시
  if (status === "idle" || status === "error") {
    return (
      <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-8 flex flex-col items-center gap-4 text-center">
        <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
          <Sparkles className="size-5 text-primary" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold">성장 전략 실행 플랜 생성</p>
          <p className="text-xs text-muted-foreground">채널 분석 데이터를 기반으로 AI가 맞춤 전략 원페이퍼를 작성합니다</p>
        </div>
        {errorMsg && (
          <p className="text-xs text-destructive">{errorMsg}</p>
        )}
        <button
          onClick={handleGenerate}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Sparkles className="h-4 w-4" />
          원페이퍼 생성하기
        </button>
      </div>
    )
  }

  // 로딩
  if (status === "loading") {
    return (
      <div className="rounded-xl border bg-card p-8 flex flex-col items-center gap-3 text-center">
        <Loader2 className="size-6 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">채널 데이터를 분석해 전략 플랜을 작성 중입니다…</p>
      </div>
    )
  }

  // 완료 — 원페이퍼 렌더링
  return (
    <div ref={cardRef} className="rounded-xl border bg-card overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-5 py-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <span className="font-heading font-medium text-sm leading-none tracking-[-0.01em]">TubeWatch™</span>
          <span className="text-muted-foreground/40 text-sm">|</span>
          <span className="text-sm font-semibold text-foreground">성장 전략 실행 플랜</span>
          <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-200">AI 생성</Badge>
        </div>
        <button
          onClick={handleDownload}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          title="이미지로 저장"
        >
          <Download className="h-3.5 w-3.5" />
          <span>이미지 저장</span>
        </button>
      </div>

      {/* 본문 */}
      <div className="px-5 py-5">
        {markdown && <PlanDocument markdown={markdown} />}
      </div>

      {/* 재생성 */}
      <div className="px-5 py-3 border-t bg-muted/20 flex justify-end">
        <button
          onClick={() => { setStatus("idle"); setMarkdown(null) }}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          다시 생성
        </button>
      </div>
    </div>
  )
}
