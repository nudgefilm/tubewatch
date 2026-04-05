"use client"

import { useRef } from "react"
import { Badge } from "@/components/ui/badge"
import { BarChart2, Tag, Download, FileText } from "lucide-react"
import type { ExecutionAction, ViewingPointGauge } from "@/mocks/next-trend"

interface NextTrendActionSectionProps {
  data: ExecutionAction[]
}

/**
 * video_plan_document (마크다운) 렌더러
 * 지원: ## 헤더, **bold**, - 리스트, 1. 번호 리스트, 빈 줄 단락 구분
 */
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

    if (line.startsWith("## ")) {
      const text = line.replace(/^##\s*/, "")
      const match = text.match(/^(.*?)\s*(\([^)]+\))?$/)
      const mainTitle = match?.[1]?.trim() ?? text
      const subTitle = match?.[2] ?? ""
      elements.push(
        <div key={i} className={`${elements.length > 0 ? "mt-6" : ""} mb-2`}>
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            {mainTitle}
            {subTitle && (
              <span className="text-xs font-normal text-muted-foreground/70">{subTitle}</span>
            )}
          </h3>
          <div className="mt-1 h-px bg-border/60" />
        </div>
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

/** 1–5 점수 게이지 (●●●●○) */
function ViewingGauge({ points }: { points: ViewingPointGauge[] }) {
  if (!points || points.length === 0) return null
  return (
    <div className="space-y-2">
      {points.map(({ label, score }) => (
        <div key={label} className="flex items-center gap-3">
          <span className="w-16 text-xs text-muted-foreground shrink-0">{label}</span>
          <div className="flex gap-1">
            {Array.from({ length: 5 }, (_, i) => (
              <span
                key={i}
                className={`w-3 h-3 rounded-full ${i < score ? "bg-primary" : "bg-muted"}`}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">{score}/5</span>
        </div>
      ))}
    </div>
  )
}

/** 섹션 행 공통 레이아웃 */
function SectionRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3 px-5 py-4">
      <div className="mt-0.5 h-4 w-4 shrink-0 text-primary">{icon}</div>
      <div className="space-y-1.5 min-w-0 w-full">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        {children}
      </div>
    </div>
  )
}

/** 기획안 카드 1장 */
function ActionCard({ action }: { action: ExecutionAction }) {
  const cardRef = useRef<HTMLDivElement>(null)

  async function handleDownload() {
    if (!cardRef.current) return
    try {
      const { toPng } = await import("html-to-image")
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      })
      const link = document.createElement("a")
      link.href = dataUrl
      link.download = "영상기획안.png"
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

      {/* 헤더 — 항상 표시 */}
      <div className="flex items-center justify-between px-5 py-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <span className="font-heading font-medium text-sm leading-none tracking-[-0.01em]">TubeWatch™</span>
          <span className="text-muted-foreground/40 text-sm">|</span>
          <span className="text-sm font-semibold text-foreground">영상 기획안</span>
          <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-200">튜브워치 엔진</Badge>
        </div>
        {action.videoPlanDocument && (
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

      {action.videoPlanDocument ? (
        <div className="divide-y">
          {/* 원페이퍼 기획안 본문 */}
          <div className="px-5 py-5">
            <PlanDocument markdown={action.videoPlanDocument} />
          </div>

          {/* 시청 포인트 게이지 */}
          {action.viewingPoints && action.viewingPoints.length > 0 && (
            <SectionRow icon={<BarChart2 className="h-4 w-4" />} label="시청 포인트 게이지">
              <ViewingGauge points={action.viewingPoints} />
            </SectionRow>
          )}

          {/* 추천 태그 */}
          {action.recommendedTags && action.recommendedTags.length > 0 && (
            <SectionRow icon={<Tag className="h-4 w-4" />} label="추천 태그">
              <div className="flex flex-wrap gap-1.5">
                {action.recommendedTags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs font-normal">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </SectionRow>
          )}
        </div>
      ) : (
        <div className="px-5 py-5">
          <p className="text-sm text-muted-foreground">채널 분석 후 자동으로 생성됩니다.</p>
        </div>
      )}
    </div>
  )
}

export function NextTrendActionSection({ data }: NextTrendActionSectionProps) {
  return (
    <div className="space-y-4">
      {data.map((action) => (
        <ActionCard key={action.id} action={action} />
      ))}
    </div>
  )
}
