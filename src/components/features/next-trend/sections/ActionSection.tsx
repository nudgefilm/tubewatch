"use client"

import { useRef } from "react"
import { Badge } from "@/components/ui/badge"
import { Video, Image as ImageIcon, FileText, Zap, AlignLeft, Lightbulb, AlertCircle, BarChart2, Type, Tag, Shield, Users, Download } from "lucide-react"
import type { ExecutionAction, ViewingPointGauge } from "@/mocks/next-trend"

interface NextTrendActionSectionProps {
  data: ExecutionAction[]
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

      <div className="divide-y">

        {/* 기획 의도 */}
        {action.whyThisTopic && action.whyThisTopic !== "—" && (
          <SectionRow icon={<Lightbulb className="h-4 w-4" />} label="기획 의도">
            <p className="text-sm leading-relaxed break-words">
              <RichText text={action.whyThisTopic} />
            </p>
          </SectionRow>
        )}

        {/* 문제 진단 & 해결 방향 */}
        {action.painPoint && action.painPoint !== "—" && (
          <SectionRow icon={<AlertCircle className="h-4 w-4" />} label="문제 진단 & 해결 방향">
            <p className="text-sm leading-relaxed break-words">
              <RichText text={action.painPoint} />
            </p>
          </SectionRow>
        )}

        {/* 영상 기획안 (촬영 기준) */}
        <SectionRow icon={<Video className="h-4 w-4" />} label="영상 기획안 (촬영 기준)">
          <p className="text-sm leading-relaxed break-words">
            <RichText text={action.videoTitle} />
          </p>
        </SectionRow>

        {/* 제목 후보 (3개) */}
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

        {/* 썸네일 방향 */}
        <SectionRow icon={<ImageIcon className="h-4 w-4" />} label="썸네일 방향">
          <p className="text-sm leading-relaxed break-words">
            <RichText text={action.thumbnailDirection} />
          </p>
        </SectionRow>

        {/* 오프닝 훅 */}
        {action.openingHook && action.openingHook !== "—" && (
          <SectionRow icon={<Zap className="h-4 w-4" />} label="오프닝 훅">
            <p className="text-sm leading-relaxed break-words">
              <RichText text={action.openingHook} />
            </p>
          </SectionRow>
        )}

        {/* 대본 구조 */}
        {action.scriptOutline && action.scriptOutline !== "—" && (
          <SectionRow icon={<AlignLeft className="h-4 w-4" />} label="대본 구조">
            <p className="text-sm leading-relaxed break-words">
              <RichText text={action.scriptOutline} />
            </p>
          </SectionRow>
        )}

        {/* 이탈 방지 포인트 */}
        {action.exitPrevention && action.exitPrevention !== "—" && (
          <SectionRow icon={<Shield className="h-4 w-4" />} label="이탈 방지 포인트">
            <p className="text-sm leading-relaxed break-words">
              <RichText text={action.exitPrevention} />
            </p>
          </SectionRow>
        )}

        {/* 제작 팁 */}
        <SectionRow icon={<FileText className="h-4 w-4" />} label="제작 팁">
          <p className="text-sm leading-relaxed break-words">
            <RichText text={action.contentPlan} />
          </p>
        </SectionRow>

        {/* 시청 포인트 게이지 */}
        {action.viewingPoints && action.viewingPoints.length > 0 && (
          <SectionRow icon={<BarChart2 className="h-4 w-4" />} label="시청 포인트">
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

        {/* 업로드 후 점검 포인트 */}
        {action.expectedReaction && action.expectedReaction !== "—" && (
          <SectionRow icon={<Users className="h-4 w-4" />} label="업로드 후 점검 포인트">
            <p className="text-sm leading-relaxed break-words">
              <RichText text={action.expectedReaction} />
            </p>
          </SectionRow>
        )}

      </div>
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
