"use client"

import { Badge } from "@/components/ui/badge"
import { Video, Image, FileText, Zap, AlignLeft } from "lucide-react"
import type { ExecutionAction } from "@/mocks/next-trend"

interface NextTrendActionSectionProps {
  data: ExecutionAction[]
}

/** **bold** 마크업과 들여쓰기 줄을 처리하는 리치 텍스트 렌더러 */
function RichText({ text }: { text: string }) {
  function parseLine(line: string, key: number, isLast: boolean) {
    const isIndented = line.startsWith("  ")
    const trimmed = isIndented ? line.trimStart() : line

    // **text** → bold + primary color
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
      <span
        key={key}
        className={isIndented ? "text-xs text-muted-foreground" : ""}
      >
        {rendered}
        {!isLast && <br />}
      </span>
    )
  }

  const lines = text.split("\n")
  return <span>{lines.map((line, i) => parseLine(line, i, i === lines.length - 1))}</span>
}

export function NextTrendActionSection({ data }: NextTrendActionSectionProps) {
  return (
    <div className="space-y-4">
      {data.map((action) => (
        <div
          key={action.id}
          className="rounded-xl border bg-card overflow-hidden"
        >
          {/* 헤더 */}
          <div className="flex items-center gap-2 px-5 py-3 border-b bg-muted/30">
            <Badge
              variant="outline"
              className={
                action.experimentPriority === 1
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : action.experimentPriority === 2
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                  : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
              }
            >
              실험 우선순위 #{action.experimentPriority}
            </Badge>
          </div>

          {/* 본문 */}
          <div className="divide-y">

            {/* 영상 개요 */}
            <div className="flex items-start gap-3 px-5 py-4">
              <Video className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div className="space-y-1.5 min-w-0">
                <p className="text-xs font-medium text-muted-foreground">영상 개요</p>
                <p className="text-sm leading-relaxed break-words">
                  <RichText text={action.videoTitle} />
                </p>
              </div>
            </div>

            {/* 제목 · 썸네일 방향 */}
            <div className="flex items-start gap-3 px-5 py-4">
              <Image className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div className="space-y-1.5 min-w-0">
                <p className="text-xs font-medium text-muted-foreground">제목 · 썸네일 방향</p>
                <p className="text-sm leading-relaxed break-words">
                  <RichText text={action.thumbnailDirection} />
                </p>
              </div>
            </div>

            {/* 오프닝 훅 */}
            {action.openingHook && action.openingHook !== "—" && (
              <div className="flex items-start gap-3 px-5 py-4">
                <Zap className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div className="space-y-1.5 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">오프닝 훅</p>
                  <p className="text-sm leading-relaxed break-words">
                    <RichText text={action.openingHook} />
                  </p>
                </div>
              </div>
            )}

            {/* 대본 구성 */}
            {action.scriptOutline && action.scriptOutline !== "—" && (
              <div className="flex items-start gap-3 px-5 py-4">
                <AlignLeft className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div className="space-y-1.5 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">대본 구성</p>
                  <p className="text-sm leading-relaxed break-words">
                    <RichText text={action.scriptOutline} />
                  </p>
                </div>
              </div>
            )}

            {/* 제작 팁 */}
            <div className="flex items-start gap-3 px-5 py-4">
              <FileText className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div className="space-y-1.5 min-w-0">
                <p className="text-xs font-medium text-muted-foreground">제작 팁</p>
                <p className="text-sm leading-relaxed break-words">
                  <RichText text={action.contentPlan} />
                </p>
              </div>
            </div>

          </div>
        </div>
      ))}
    </div>
  )
}
