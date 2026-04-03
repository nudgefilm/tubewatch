"use client"

import { Badge } from "@/components/ui/badge"
import { Type, Zap, Image, Compass, Play } from "lucide-react"
import type { ExecutionHint } from "../mock-data"

interface NextTrendExecutionHintsProps {
  data: ExecutionHint[]
}

const typeConfig = {
  title: { icon: Type, label: "제목", color: "bg-blue-500/10 text-blue-400 border border-blue-500/20" },
  hook: { icon: Zap, label: "훅", color: "bg-amber-500/10 text-amber-400 border border-amber-500/20" },
  thumbnail: { icon: Image, label: "썸네일", color: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" },
  angle: { icon: Compass, label: "각도", color: "bg-violet-500/10 text-violet-400 border border-violet-500/20" },
  start: { icon: Play, label: "시작", color: "bg-rose-500/10 text-rose-400 border border-rose-500/20" },
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
            className="rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-md p-4 space-y-3"
          >
            <div className="flex items-center gap-2">
              <div className={`rounded-md p-1.5 ${config.color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium text-slate-200">{hint.label}</span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed break-words">{hint.content}</p>
            <Badge variant="outline" className="text-xs border-slate-700 bg-slate-800/50 text-slate-400">
              {hint.linkedTo}
            </Badge>
          </div>
        )
      })}
    </div>
  )
}
