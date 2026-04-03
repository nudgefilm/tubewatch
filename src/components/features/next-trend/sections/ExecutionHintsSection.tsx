"use client"

import { Badge } from "@/components/ui/badge"
import { Type, Zap, Image, Compass, Play } from "lucide-react"
import type { ExecutionHint } from "@/mocks/next-trend"

interface NextTrendExecutionHintsProps {
  data: ExecutionHint[]
}

const typeConfig = {
  title: { icon: Type, label: "제목", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  hook: { icon: Zap, label: "훅", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  thumbnail: { icon: Image, label: "썸네일", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  angle: { icon: Compass, label: "각도", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  start: { icon: Play, label: "시작", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
}

export function NextTrendExecutionHints({ data }: NextTrendExecutionHintsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {data.map((hint) => {
        const config = typeConfig[hint.type]
        const Icon = config.icon
        return (
          <div
            key={hint.id}
            className="rounded-xl border bg-card p-4 space-y-3"
          >
            <div className="flex items-center gap-2">
              <div className={`rounded-md p-1.5 ${config.color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium">{hint.label}</span>
            </div>
            <p className="text-sm break-words">{hint.content}</p>
            <Badge variant="outline" className="text-xs">
              {hint.linkedTo}
            </Badge>
          </div>
        )
      })}
    </div>
  )
}
