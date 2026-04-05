"use client"

import { useState, useEffect, useRef } from "react"
import { Download, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface StrategyPlanSectionProps {
  channelId: string
}

const COOLDOWN_MS = 12 * 60 * 60 * 1000
const storageKey = (id: string) => `tw_strategy_sat:${id}` // savedAt 캐시

function getRemainingLabel(savedAt: number): string | null {
  const remaining = COOLDOWN_MS - (Date.now() - savedAt)
  if (remaining <= 0) return null
  const h = Math.floor(remaining / (1000 * 60 * 60))
  const m = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
  return h > 0 ? `${h}시간 ${m}분` : `${m}분`
}

/** 마크다운 렌더러 */
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

export function StrategyPlanSection({ channelId }: StrategyPlanSectionProps) {
  const [markdown, setMarkdown] = useState<string | null>(null)
  const [pending, setPending] = useState(false)   // 분석 후 생성 대기 중
  const [remainLabel, setRemainLabel] = useState<string | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // DB에서 읽기 (마운트 시 + 폴링)
  async function fetchFromDB() {
    try {
      const res = await fetch(`/api/action-plan/strategy-plan?channelId=${channelId}`)
      const data = await res.json() as { markdown: string | null; pending?: boolean }
      if (data.markdown) {
        setMarkdown(data.markdown)
        setPending(false)
        // 생성 시각을 localStorage에 저장 (쿨다운 계산용)
        try {
          const existing = localStorage.getItem(storageKey(channelId))
          if (!existing) {
            localStorage.setItem(storageKey(channelId), String(Date.now()))
          }
        } catch { /* ignore */ }
        stopPolling()
      } else if (data.pending) {
        setPending(true) // 아직 생성 중 — 폴링 유지
      } else {
        setPending(false) // 분석 데이터 없음
      }
    } catch { /* ignore */ }
  }

  function stopPolling() {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
  }

  useEffect(() => {
    fetchFromDB()
    // pending 상태면 3초마다 재확인
    pollRef.current = setInterval(() => {
      fetchFromDB()
    }, 3000)
    return () => stopPolling()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId])

  // pending이 해소되면 폴링 중단
  useEffect(() => {
    if (!pending && markdown) stopPolling()
  }, [pending, markdown])

  // 남은 쿨다운 라벨 — 1분마다 갱신
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

  // 생성 대기 중 (분석은 완료, 원페이퍼 백그라운드 생성 중)
  if (pending) {
    return (
      <div className="rounded-xl border bg-card p-6 space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin text-primary shrink-0" />
          <span>전략 플랜을 생성하고 있습니다. 잠시만 기다려주세요…</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-primary/60 rounded-full animate-[loading_2s_ease-in-out_infinite]" style={{ width: "60%" }} />
        </div>
      </div>
    )
  }

  // 데이터 없음 (아직 분석 전)
  if (!markdown) return null

  // 완료 — 렌더링
  return (
    <div ref={cardRef} className="rounded-xl border bg-card overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-5 py-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <span className="font-heading font-medium text-sm leading-none tracking-[-0.01em]">TubeWatch™</span>
          <span className="text-muted-foreground/40 text-sm">|</span>
          <span className="text-sm font-semibold text-foreground">성장 전략 실행 플랜</span>
          <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-200">튜브워치 엔진</Badge>
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
        <PlanDocument markdown={markdown} />
      </div>

      {/* 하단 — 남은 쿨다운 표시 */}
      {remainLabel && (
        <div className="px-5 py-3 border-t bg-muted/20 flex justify-end">
          <span className="text-xs text-muted-foreground">{remainLabel} 후 재분석 시 갱신됩니다</span>
        </div>
      )}
    </div>
  )
}
