"use client"

import { Badge } from "@/components/ui/badge"
import { Film, Clock, Repeat, ArrowRight } from "lucide-react"
import type { FormatRecommendation } from "../mock-data"

interface NextTrendFormatSectionProps {
  data: FormatRecommendation[]
}

function SegmentGauge({ value }: { value: number }) {
  const filled = Math.round((value / 100) * 5)
  return (
    <div className="flex gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full transition-colors ${
            i < filled ? "bg-emerald-500" : "bg-slate-700"
          }`}
        />
      ))}
    </div>
  )
}

export function NextTrendFormatSection({ data }: NextTrendFormatSectionProps) {
  return (
    <div className={`grid gap-4 ${data.length === 1 ? "grid-cols-1 justify-items-center" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
      {data.map((format) => (
        <div
          key={format.id}
          className={`rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-md p-5 space-y-4 min-w-0 ${data.length === 1 ? "w-full max-w-sm" : ""}`}
        >
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Film className="h-4 w-4 text-emerald-400 shrink-0" />
              <h4 className="font-semibold text-slate-100 break-words min-w-0">{format.format}</h4>
            </div>
            {format.seriesPotential && (
              <Badge variant="outline" className="flex items-center gap-1 self-start border-emerald-500/40 bg-emerald-500/10 text-emerald-400 text-xs">
                <Repeat className="h-3 w-3" />
                시리즈 가능
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Clock className="h-4 w-4" />
            <span>권장 길이: {format.recommendedLength}</span>
          </div>

          <div className="space-y-1.5 min-w-0">
            <p className="text-xs text-slate-500">전개 방식</p>
            <div className="flex flex-wrap items-center gap-1 text-sm">
              {format.approach.split(" → ").map((step, idx, arr) => (
                <span key={idx} className="flex items-center gap-1">
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-300">{step}</span>
                  {idx < arr.length - 1 && <ArrowRight className="h-3 w-3 text-slate-600" />}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">내부 적합도</span>
              <span className="font-semibold tabular-nums text-emerald-400">{format.internalFit}%</span>
            </div>
            <SegmentGauge value={format.internalFit} />
          </div>

          <p className="text-xs text-slate-500 italic">{format.basedOn}</p>
        </div>
      ))}
    </div>
  )
}
