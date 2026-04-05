"use client"

import { useState, useRef } from "react"
import { Download, ChevronDown, ChevronUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface OnePagerCardProps {
  title: string
  markdown: string
  downloadFilename: string
  /** 헤더 우측 뱃지 텍스트 (기본: "튜브워치 엔진") */
  badgeLabel?: string
  /** 접힘 상태 미리보기 줄 수 (기본: 3) */
  previewLines?: number
  /** 카드 하단 추가 콘텐츠 (태그·게이지 등) */
  extra?: React.ReactNode
}

// ── 마크다운 → 평문 변환 (미리보기용) ──────────────────────────────
function extractPreview(markdown: string, maxChars = 160): string {
  const plain = markdown
    .split("\n")
    .filter((l) => l.trim() && !l.startsWith("#") && !l.startsWith("---"))
    .map((l) => l.replace(/\*\*([^*]+)\*\*/g, "$1").replace(/^[-*]\s+/, "").replace(/^\d+\.\s+/, "").trim())
    .filter(Boolean)
    .join(" ")
  return plain.length > maxChars ? plain.slice(0, maxChars) + "…" : plain
}

// ── 마크다운 렌더러 ──────────────────────────────────────────────
function renderInline(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/).map((part, idx) =>
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={idx} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>
      : <span key={idx}>{part}</span>
  )
}

export function PlanDocument({ markdown }: { markdown: string }) {
  const lines = markdown.split("\n")
  const elements: React.ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (line.startsWith("## ") || line.startsWith("# ")) {
      const text = line.replace(/^#{1,2}\s*/, "")
      const match = text.match(/^(.*?)\s*(\([^)]+\))?$/)
      const mainTitle = match?.[1]?.trim() ?? text
      const subTitle = match?.[2] ?? ""
      elements.push(
        <div key={i} className={`${elements.length > 0 ? "mt-7" : ""} mb-3`}>
          <h3 className="text-sm font-bold text-foreground tracking-tight flex items-center gap-2">
            {mainTitle}
            {subTitle && <span className="text-xs font-normal text-muted-foreground/70">{subTitle}</span>}
          </h3>
          <div className="mt-1.5 h-px bg-border/50" />
        </div>
      )
      i++; continue
    }

    if (line.startsWith("### ")) {
      elements.push(
        <p key={i} className="text-xs font-semibold text-foreground/80 mt-5 mb-1.5 tracking-wide uppercase">
          {line.replace(/^###\s*/, "")}
        </p>
      )
      i++; continue
    }

    if (line.startsWith("- ") || line.startsWith("* ")) {
      const items: string[] = []
      while (i < lines.length && (lines[i].startsWith("- ") || lines[i].startsWith("* "))) {
        items.push(lines[i].replace(/^[-*]\s+/, "")); i++
      }
      elements.push(
        <ul key={`ul-${i}`} className="space-y-1.5 mb-2 mt-1">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2.5 text-[13px] text-muted-foreground leading-relaxed">
              <span className="mt-2 w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0" />
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
        <ol key={`ol-${i}`} className="space-y-2 mb-2 mt-1">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-3 text-[13px] text-muted-foreground leading-relaxed">
              <span className="mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">{idx + 1}</span>
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ol>
      )
      continue
    }

    if (line.trim() === "") { i++; continue }

    elements.push(
      <p key={i} className="text-[13px] text-muted-foreground leading-relaxed mb-2.5">
        {renderInline(line)}
      </p>
    )
    i++
  }

  return <div className="space-y-0">{elements}</div>
}

// ── 메인 카드 컴포넌트 ────────────────────────────────────────────
export function OnePagerCard({
  title,
  markdown,
  downloadFilename,
  badgeLabel = "튜브워치 엔진",
  extra,
}: OnePagerCardProps) {
  const [expanded, setExpanded] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const preview = extractPreview(markdown)

  async function handleDownload() {
    if (!cardRef.current) return
    try {
      const { toPng } = await import("html-to-image")
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, backgroundColor: "#ffffff" })
      const link = document.createElement("a")
      link.href = dataUrl
      link.download = downloadFilename
      link.style.position = "fixed"
      link.style.opacity = "0"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (e) {
      console.error("[download]", e)
    }
  }

  return (
    <div ref={cardRef} className="rounded-xl border bg-card overflow-hidden">

      {/* 헤더 */}
      <div className="flex items-center justify-between px-5 py-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <span className="font-heading font-medium text-sm leading-none tracking-[-0.01em]">TubeWatch™</span>
          <span className="text-muted-foreground/40 text-sm">|</span>
          <span className="text-sm font-semibold text-foreground">{title}</span>
          <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-200">{badgeLabel}</Badge>
        </div>
        {expanded && (
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

      {/* 접힘 — 미리보기 */}
      {!expanded && (
        <div className="px-5 pt-4 pb-5">
          <p className="text-[13px] text-muted-foreground leading-relaxed line-clamp-3">{preview}</p>
          <button
            onClick={() => setExpanded(true)}
            className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5 text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
          >
            <span>리포트 전문 보기</span>
            <ChevronDown className="size-4" />
          </button>
        </div>
      )}

      {/* 펼침 — 슬라이드 애니메이션 */}
      <div
        style={{
          display: "grid",
          gridTemplateRows: expanded ? "1fr" : "0fr",
          transition: "grid-template-rows 0.35s ease",
        }}
      >
        <div style={{ overflow: "hidden" }}>
          <div className="px-5 pt-5 pb-2">
            <PlanDocument markdown={markdown} />
          </div>

          {extra && <div className="border-t">{extra}</div>}

          {/* 접기 + 다운로드 */}
          <div className="px-5 py-3 border-t bg-muted/20 flex items-center justify-between">
            <button
              onClick={handleDownload}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              <span>이미지 저장</span>
            </button>
            <button
              onClick={() => setExpanded(false)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronUp className="size-3.5" />
              <span>접기</span>
            </button>
          </div>
        </div>
      </div>

    </div>
  )
}
