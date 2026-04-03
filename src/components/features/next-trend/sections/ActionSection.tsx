"use client"

import { Badge } from "@/components/ui/badge"
import { Video, Image, FileText } from "lucide-react"
import type { ExecutionAction } from "../mock-data"

interface NextTrendActionSectionProps {
  data: ExecutionAction[]
}

export function NextTrendActionSection({ data }: NextTrendActionSectionProps) {
  return (
    <div className="space-y-3">
      {data.map((action) => (
        <div
          key={action.id}
          className="rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-md p-5"
        >
          <div className="flex items-start gap-4">
            <div className="flex-1 space-y-4 min-w-0">
              <div>
                <Badge
                  variant="outline"
                  className={
                    action.experimentPriority === 1
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                      : action.experimentPriority === 2
                      ? "border-blue-500/40 bg-blue-500/10 text-blue-400"
                      : "border-slate-700 bg-slate-800 text-slate-400"
                  }
                >
                  실험 우선순위 #{action.experimentPriority}
                </Badge>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Video className="mt-0.5 h-4 w-4 text-slate-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 mb-0.5">제목</p>
                    <p className="font-medium text-slate-100 break-words">{action.videoTitle}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Image className="mt-0.5 h-4 w-4 text-slate-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 mb-0.5">썸네일 방향</p>
                    <p className="text-sm text-slate-300 break-words">{action.thumbnailDirection}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <FileText className="mt-0.5 h-4 w-4 text-slate-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 mb-0.5">콘텐츠 플랜</p>
                    <p className="text-sm text-slate-300 break-words">{action.contentPlan}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
