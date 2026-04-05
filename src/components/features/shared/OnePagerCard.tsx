"use client"

import { useState, useRef } from "react"
import { Download, ChevronDown, ChevronUp, FileText } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface OnePagerCardProps {
  title: string
  markdown: string
  downloadFilename: string
  badgeLabel?: string
  extra?: React.ReactNode
}

// ── 마크다운 → 평문 변환 (미리보기용) ──────────────────────────────
function extractPreview(markdown: string, maxChars = 180): string {
  const plain = markdown
    .split("\n")
    .filter((l) => l.trim() && !l.startsWith("#") && !l.startsWith("---"))
    .map((l) =>
      l.replace(/\*\*([^*]+)\*\*/g, "$1")
       .replace(/^[-*]\s+/, "")
       .replace(/^\d+\.\s+/, "")
       .trim()
    )
    .filter(Boolean)
    .join(" ")
  return plain.length > maxChars ? plain.slice(0, maxChars) + "…" : plain
}

// ── 이모지 제거 ────────────────────────────────────────────────────
function stripEmoji(text: string): string {
  return text.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, "").trim()
}

// ── 인라인 렌더러 ──────────────────────────────────────────────────
function renderInline(text: string): React.ReactNode[] {
  text = stripEmoji(text)
  return text.split(/(\*\*[^*]+\*\*)/).map((part, idx) =>
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={idx} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>
      : <span key={idx}>{part}</span>
  )
}

// ── 마크다운 렌더러 ────────────────────────────────────────────────
export function PlanDocument({ markdown }: { markdown: string }) {
  const lines = markdown.split("\n")
  const elements: React.ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // H1 / H2 — 섹션 제목
    if (line.startsWith("## ") || line.startsWith("# ")) {
      const text = stripEmoji(line.replace(/^#{1,2}\s*/, ""))
      const match = text.match(/^(.*?)\s*(\([^)]+\))?$/)
      const mainTitle = match?.[1]?.trim() ?? text
      const subTitle = match?.[2] ?? ""
      const isFirst = elements.length === 0
      elements.push(
        <div key={i} className={`${isFirst ? "" : "mt-8"} mb-3`}>
          <h3 className="text-sm font-bold text-foreground tracking-tight flex items-center gap-2">
            {mainTitle}
            {subTitle && (
              <span className="text-xs font-normal text-muted-foreground/60">{subTitle}</span>
            )}
          </h3>
          <div className="mt-2 h-px bg-border/40" />
        </div>
      )
      i++; continue
    }

    // H3 — 소제목
    if (line.startsWith("### ")) {
      elements.push(
        <p key={i} className="text-[12.5px] font-semibold text-foreground/60 mt-5 mb-2 tracking-wide">
          {stripEmoji(line.replace(/^###\s*/, ""))}
        </p>
      )
      i++; continue
    }

    // 불릿 리스트
    if (line.startsWith("- ") || line.startsWith("* ")) {
      const items: string[] = []
      while (i < lines.length && (lines[i].startsWith("- ") || lines[i].startsWith("* "))) {
        items.push(lines[i].replace(/^[-*]\s+/, "")); i++
      }
      elements.push(
        <ul key={`ul-${i}`} className="space-y-2.5 mb-3 mt-1.5">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2.5 text-sm text-muted-foreground leading-[1.7]">
              <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-primary/50 shrink-0" />
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      )
      continue
    }

    // 번호 리스트
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = []
      let num = 1
      while (i < lines.length && new RegExp(`^${num}\\. `).test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, "")); i++; num++
      }
      elements.push(
        <ol key={`ol-${i}`} className="space-y-3 mb-3 mt-1.5">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-3 text-sm text-muted-foreground leading-[1.7]">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                {idx + 1}
              </span>
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ol>
      )
      continue
    }

    if (line.trim() === "") { i++; continue }

    // 일반 단락
    elements.push(
      <p key={i} className="text-sm text-muted-foreground leading-[1.75] mb-3.5">
        {renderInline(line)}
      </p>
    )
    i++
  }

  return <div>{elements}</div>
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
        <div className="px-5 pt-5 pb-6">
          {/* 미리보기 레이블 */}
          <p className="text-[10px] font-semibold text-muted-foreground/50 tracking-widest uppercase mb-2">Preview</p>
          {/* 좌측 강조선 + 미리보기 텍스트 */}
          <div className="border-l-2 border-primary/20 pl-3">
            <p className="text-[13.5px] text-muted-foreground/80 leading-[1.7] line-clamp-3">{preview}</p>
          </div>
          <button
            onClick={() => setExpanded(true)}
            className="mt-5 flex w-full items-center justify-center gap-1.5 rounded-lg border border-primary/25 bg-primary/5 px-4 py-2.5 text-[13px] font-semibold text-primary hover:bg-primary/10 active:scale-[0.99] transition-all"
          >
            <FileText className="size-3.5 shrink-0" />
            <span>리포트 전문 보기</span>
            <ChevronDown className="size-3.5" />
          </button>
        </div>
      )}

      {/* 펼침 — expanded일 때만 PlanDocument 마운트 (메모리 최적화) */}
      {expanded && (
        <div>
          <div className="px-6 pt-6 pb-3">
            <PlanDocument markdown={markdown} />
          </div>

          {extra && <div className="border-t mx-0">{extra}</div>}

          {/* 하단 바 — 접기 + 다운로드 */}
          <div className="px-5 py-3 mt-2 border-t bg-muted/20 flex items-center justify-between">
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              <span>이미지 저장</span>
            </button>
            <button
              onClick={() => setExpanded(false)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronUp className="size-3.5" />
              <span>접기</span>
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
