"use client"

import { useState, useRef, useTransition } from "react"
import {
  Download, ChevronDown, ChevronUp, FileText, Loader2,
  MapPin, TrendingUp, AlertTriangle, Target, BarChart2,
  Fingerprint, Compass, Users, Layers, BookOpen,
} from "lucide-react"
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

// ── 섹션 제목 아이콘 매핑 ─────────────────────────────────────────
function getSectionIcon(title: string): React.ReactNode {
  const t = title.toLowerCase()
  const cls = "size-3.5 shrink-0"
  if (t.includes("위치") || t.includes("현황") || t.includes("진단"))
    return <MapPin className={`${cls} text-primary/60`} />
  if (t.includes("강점"))
    return <TrendingUp className={`${cls} text-emerald-500/70`} />
  if (t.includes("병목") || t.includes("약점") || t.includes("개선") || t.includes("막는"))
    return <AlertTriangle className={`${cls} text-amber-500/70`} />
  if (t.includes("집중") || t.includes("실행") || t.includes("당장"))
    return <Target className={`${cls} text-primary/60`} />
  if (t.includes("종합") || t.includes("전망") || t.includes("의견"))
    return <BarChart2 className={`${cls} text-primary/60`} />
  if (t.includes("dna") || t.includes("아이덴티티") || t.includes("정체성"))
    return <Fingerprint className={`${cls} text-primary/60`} />
  if (t.includes("전략") || t.includes("방향"))
    return <Compass className={`${cls} text-primary/60`} />
  if (t.includes("오디언스") || t.includes("타겟") || t.includes("구독자"))
    return <Users className={`${cls} text-primary/60`} />
  if (t.includes("콘텐츠") || t.includes("패턴"))
    return <Layers className={`${cls} text-primary/60`} />
  return <BookOpen className={`${cls} text-primary/60`} />
}

// ── 인라인 렌더러 ──────────────────────────────────────────────────
function renderInline(text: string): React.ReactNode[] {
  text = stripEmoji(text)
  return text.split(/(\*\*[^*]+\*\*)/).map((part, idx) =>
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={idx} className={S.inlineBold}>{part.slice(2, -2)}</strong>
      : <span key={idx}>{part}</span>
  )
}

// ── PlanDocument 스타일 상수 (수정 금지 — CLAUDE.md 참고) ────────
const S = {
  sectionHeading:  "text-sm font-bold text-foreground tracking-tight flex items-center gap-2",
  sectionSubtitle: "text-xs font-normal text-muted-foreground/60",
  subHeading:      "text-[13px] font-semibold text-foreground/60 mt-5 mb-2 tracking-wide",
  boldLineHeading: "text-xs font-semibold text-foreground/60 mt-5 mb-1.5 tracking-wide",
  paragraph:       "text-sm text-muted-foreground leading-relaxed mb-3.5",
  listItem:        "text-sm text-muted-foreground leading-relaxed",
  listBadge:       "text-xs font-bold text-primary",
  inlineBold:      "font-medium text-foreground/80",
} as const

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
          <h3 className={S.sectionHeading}>
            {getSectionIcon(mainTitle)}
            {mainTitle}
            {subTitle && (
              <span className={S.sectionSubtitle}>{subTitle}</span>
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
        <p key={i} className={S.subHeading}>
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
            <li key={idx} className={`flex items-start gap-2.5 ${S.listItem}`}>
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
            <li key={idx} className={`flex items-start gap-3 ${S.listItem}`}>
              <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 ${S.listBadge}`}>
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

    // 전체 볼드 라인 (**text**) → 소제목으로 처리
    if (/^\*\*[^*]+\*\*[：:：]?\s*$/.test(line.trim())) {
      elements.push(
        <p key={i} className={`${S.boldLineHeading} uppercase`}>
          {stripEmoji(line.trim().replace(/^\*\*/, "").replace(/\*\*[：:：]?\s*$/, ""))}
        </p>
      )
      i++; continue
    }

    // 일반 단락
    elements.push(
      <p key={i} className={S.paragraph}>
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
  const [isPending, startTransition] = useTransition()
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
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{preview}</p>
          </div>
          <button
            onClick={() => startTransition(() => setExpanded(true))}
            disabled={isPending}
            className="mt-5 flex w-full items-center justify-center gap-1.5 rounded-lg border border-primary/25 bg-primary/5 px-4 py-2.5 text-[13px] font-semibold text-primary hover:bg-primary/10 active:scale-[0.99] transition-all disabled:opacity-60 disabled:pointer-events-none"
          >
            {isPending ? (
              <>
                <Loader2 className="size-3.5 shrink-0 animate-spin" />
                <span>불러오는 중...</span>
              </>
            ) : (
              <>
                <FileText className="size-3.5 shrink-0" />
                <span>리포트 전문 보기</span>
                <ChevronDown className="size-3.5" />
              </>
            )}
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
