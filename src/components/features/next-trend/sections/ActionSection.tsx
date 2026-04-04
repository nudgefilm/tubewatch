"use client"

import { Badge } from "@/components/ui/badge"
import { Video, Image, FileText, Zap, AlignLeft } from "lucide-react"
import type { ExecutionAction } from "@/mocks/next-trend"

interface NextTrendActionSectionProps {
  data: ExecutionAction[]
}

function MultiLineText({ text }: { text: string }) {
  return (
    <span>
      {text.split("\n").map((line, i) => (
        <span key={i}>
          {line}
          {i < text.split("\n").length - 1 && <br />}
        </span>
      ))}
    </span>
  )
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
              <div className="space-y-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground">영상 개요</p>
                <p className="text-sm leading-relaxed break-words">
                  <MultiLineText text={action.videoTitle} />
                </p>
              </div>
            </div>

            {/* 제목 · 썸네일 방향 */}
            <div className="flex items-start gap-3 px-5 py-4">
              <Image className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div className="space-y-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground">제목 · 썸네일 방향</p>
                <p className="text-sm leading-relaxed break-words">
                  <MultiLineText text={action.thumbnailDirection} />
                </p>
              </div>
            </div>

            {/* 오프닝 훅 */}
            {action.openingHook && action.openingHook !== "—" && (
              <div className="flex items-start gap-3 px-5 py-4">
                <Zap className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div className="space-y-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">오프닝 훅</p>
                  <p className="text-sm leading-relaxed break-words">
                    <MultiLineText text={action.openingHook} />
                  </p>
                </div>
              </div>
            )}

            {/* 대본 구성 */}
            {action.scriptOutline && action.scriptOutline !== "—" && (
              <div className="flex items-start gap-3 px-5 py-4">
                <AlignLeft className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div className="space-y-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">대본 구성</p>
                  <p className="text-sm leading-relaxed break-words">
                    <MultiLineText text={action.scriptOutline} />
                  </p>
                </div>
              </div>
            )}

            {/* 콘텐츠 플랜 */}
            <div className="flex items-start gap-3 px-5 py-4">
              <FileText className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div className="space-y-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground">콘텐츠 플랜</p>
                <p className="text-sm leading-relaxed break-words">
                  <MultiLineText text={action.contentPlan} />
                </p>
              </div>
            </div>

          </div>
        </div>
      ))}
    </div>
  )
}
