"use client"

import { useRef } from "react"
import { Badge } from "@/components/ui/badge"
import { Video, Image as ImageIcon, FileText, Zap, AlignLeft, Lightbulb, AlertCircle, BarChart2, Type, Tag, Shield, Users, Download } from "lucide-react"
import type { ExecutionAction, ViewingPointGauge } from "@/mocks/next-trend"

interface NextTrendActionSectionProps {
  data: ExecutionAction[]
  topCandidate?: { topic: string; reason: string } | null
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

    // ## 섹션 헤더
    if (line.startsWith("## ")) {
      const text = line.replace(/^##\s*/, "")
      // "1. 기획 의도 (The Logic)" 형태에서 영문 부제 추출
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

    // - 불릿 리스트 항목 (연속된 항목 묶기)
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

    // 번호 리스트 (1. 2. 3.)
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

    // 빈 줄 → 단락 구분 (skip)
    if (line.trim() === "") {
      i++
      continue
    }

    // 일반 단락
    elements.push(
      <p key={i} className="text-sm text-muted-foreground leading-relaxed mb-2">
        {renderInline(line)}
      </p>
    )
    i++
  }

  return <div className="space-y-0.5">{elements}</div>
}

/** **bold** 마크업과 들여쓰기 줄을 처리하는 리치 텍스트 렌더러 */
function RichText({ text }: { text: string }) {
  function parseLine(line: string, key: number, isLast: boolean) {
    const isIndented = line.startsWith("  ")
    const trimmed = isIndented ? line.trimStart() : line
    const parts = trimmed.split(/(\*\*[^*]+\*\*)/)
    const rendered = parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-semibold text-foreground">
            {part.slice(2, -2)}
          </strong>
        )
      }
      return <span key={i}>{part}</span>
    })
    return (
      <span key={key} className={isIndented ? "text-xs text-muted-foreground" : ""}>
        {rendered}
        {!isLast && <br />}
      </span>
    )
  }
  const lines = text.split("\n")
  return <span>{lines.map((line, i) => parseLine(line, i, i === lines.length - 1))}</span>
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

/** 기획안 카드 1장 (다운로드 기능 포함) */
function ActionCard({ action, topCandidate }: { action: ExecutionAction; topCandidate?: { topic: string; reason: string } | null }) {
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
      link.download = `영상기획안_${action.experimentPriority}순위.png`
      link.style.position = "fixed"
      link.style.opacity = "0"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (e) {
      console.error("[download]", e)
    }
  }

  const priorityBadgeClass =
    action.experimentPriority === 1
      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
      : action.experimentPriority === 2
      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
      : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"

  return (
    <div ref={cardRef} className="rounded-xl border bg-card overflow-hidden">

      {/* 헤더 */}
      <div className="flex items-center justify-between px-5 py-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <span className="font-heading font-medium text-sm leading-none tracking-[-0.01em]">TubeWatch™</span>
          <span className="text-muted-foreground/40 text-sm">|</span>
          <span className="text-sm font-semibold text-foreground">영상 기획안</span>
          <Badge variant="outline" className={priorityBadgeClass}>
            실험 우선순위 #{action.experimentPriority}
          </Badge>
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

      {/* 1순위 주제 요약 배너 */}
      {action.experimentPriority === 1 && topCandidate && (
        <div className="px-5 py-4 border-b bg-primary/5">
          <p className="text-[11px] font-medium text-primary/70 uppercase tracking-wide mb-1.5">다음 영상 주제 · 1순위</p>
          <p className="text-xl font-bold leading-snug break-words text-foreground">{topCandidate.topic}</p>
          {topCandidate.reason && (
            <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{topCandidate.reason}</p>
          )}
        </div>
      )}

      <div className="divide-y">

        {action.videoPlanDocument ? (
          /* ── AI 전략 리포트 모드 ─────────────────────────────────── */
          <>
            {/* 전략 리포트 본문 */}
            <div className="px-5 py-5">
              <PlanDocument markdown={action.videoPlanDocument} />
            </div>

            {/* 시청 포인트 게이지 — 시각 위젯은 항상 표시 */}
            {action.viewingPoints && action.viewingPoints.length > 0 && (
              <SectionRow icon={<BarChart2 className="h-4 w-4" />} label="시청 포인트 게이지">
                <ViewingGauge points={action.viewingPoints} />
              </SectionRow>
            )}

            {/* 추천 태그 — 클릭·복사용 */}
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
          </>
        ) : (
          /* ── 폴백: 개별 섹션 렌더링 (AI 데이터 없는 구버전) ──── */
          <>
            {action.whyThisTopic && action.whyThisTopic !== "—" && (
              <SectionRow icon={<Lightbulb className="h-4 w-4" />} label="기획 의도">
                <p className="text-sm leading-relaxed break-words"><RichText text={action.whyThisTopic} /></p>
              </SectionRow>
            )}
            {action.painPoint && action.painPoint !== "—" && (
              <SectionRow icon={<AlertCircle className="h-4 w-4" />} label="문제 진단 & 해결 방향">
                <p className="text-sm leading-relaxed break-words"><RichText text={action.painPoint} /></p>
              </SectionRow>
            )}
            <SectionRow icon={<Video className="h-4 w-4" />} label="영상 기획안 (촬영 기준)">
              <p className="text-sm leading-relaxed break-words"><RichText text={action.videoTitle} /></p>
            </SectionRow>
            {action.titleCandidates && action.titleCandidates.length > 0 && (
              <SectionRow icon={<Type className="h-4 w-4" />} label="제목 후보 (3개)">
                <ol className="space-y-2">
                  {action.titleCandidates.map((title, i) => (
                    <li key={i} className="text-sm leading-relaxed break-words">
                      <span className="font-semibold text-primary mr-1.5">{["①", "②", "③"][i]}</span>
                      <RichText text={title} />
                    </li>
                  ))}
                </ol>
              </SectionRow>
            )}
            <SectionRow icon={<ImageIcon className="h-4 w-4" />} label="썸네일 방향">
              <p className="text-sm leading-relaxed break-words"><RichText text={action.thumbnailDirection} /></p>
            </SectionRow>
            {action.openingHook && action.openingHook !== "—" && (
              <SectionRow icon={<Zap className="h-4 w-4" />} label="오프닝 훅">
                <p className="text-sm leading-relaxed break-words"><RichText text={action.openingHook} /></p>
              </SectionRow>
            )}
            {action.scriptOutline && action.scriptOutline !== "—" && (
              <SectionRow icon={<AlignLeft className="h-4 w-4" />} label="대본 구조">
                <p className="text-sm leading-relaxed break-words"><RichText text={action.scriptOutline} /></p>
              </SectionRow>
            )}
            {action.exitPrevention && action.exitPrevention !== "—" && (
              <SectionRow icon={<Shield className="h-4 w-4" />} label="이탈 방지 포인트">
                <p className="text-sm leading-relaxed break-words"><RichText text={action.exitPrevention} /></p>
              </SectionRow>
            )}
            <SectionRow icon={<FileText className="h-4 w-4" />} label="제작 팁">
              <p className="text-sm leading-relaxed break-words"><RichText text={action.contentPlan} /></p>
            </SectionRow>
            {action.viewingPoints && action.viewingPoints.length > 0 && (
              <SectionRow icon={<BarChart2 className="h-4 w-4" />} label="시청 포인트">
                <ViewingGauge points={action.viewingPoints} />
              </SectionRow>
            )}
            {action.recommendedTags && action.recommendedTags.length > 0 && (
              <SectionRow icon={<Tag className="h-4 w-4" />} label="추천 태그">
                <div className="flex flex-wrap gap-1.5">
                  {action.recommendedTags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs font-normal">#{tag}</Badge>
                  ))}
                </div>
              </SectionRow>
            )}
            {action.expectedReaction && action.expectedReaction !== "—" && (
              <SectionRow icon={<Users className="h-4 w-4" />} label="업로드 후 점검 포인트">
                <p className="text-sm leading-relaxed break-words"><RichText text={action.expectedReaction} /></p>
              </SectionRow>
            )}
          </>
        )}

      </div>
    </div>
  )
}

export function NextTrendActionSection({ data, topCandidate }: NextTrendActionSectionProps) {
  return (
    <div className="space-y-4">
      {data.map((action) => (
        <ActionCard key={action.id} action={action} topCandidate={topCandidate} />
      ))}
    </div>
  )
}
