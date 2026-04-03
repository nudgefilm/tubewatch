"use client"

import { Badge } from "@/components/ui/badge"
import { SegmentGauge } from "@/components/ui/SegmentGauge"
import { Clock, Repeat, ArrowRight } from "lucide-react"
import type { FormatRecommendation } from "../mock-data"

interface NextTrendFormatSectionProps {
  data: FormatRecommendation[]
}

export function NextTrendFormatSection({ data }: NextTrendFormatSectionProps) {
  return (
    <div className={`grid gap-4 ${data.length >= 3 ? "sm:grid-cols-2 lg:grid-cols-3" : data.length === 2 ? "sm:grid-cols-2" : "grid-cols-1"}`}>
      {data.map((format) => (
        <div
          key={format.id}
          className="rounded-xl border bg-card p-4 space-y-3 min-w-0"
        >
          <div className="flex flex-col gap-2">
            <h4 className="font-semibold break-words min-w-0">{format.format}</h4>
            {format.seriesPotential && (
              <Badge variant="secondary" className="flex items-center gap-1 self-start">
                <Repeat className="h-3 w-3" />
                시리즈 가능
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>권장 길이: {format.recommendedLength}</span>
          </div>

          <div className="space-y-1 min-w-0">
            <p className="text-xs text-muted-foreground">전개 방식</p>
            <div className="flex flex-wrap items-center gap-1 text-sm">
              {format.approach.split(" → ").map((step, idx, arr) => (
                <span key={idx} className="flex items-center gap-1">
                  <span className="rounded bg-muted px-2 py-0.5 text-xs">{step}</span>
                  {idx < arr.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">내부 적합도</p>
            <SegmentGauge score={format.internalFit} />
          </div>

          <p className="text-xs text-muted-foreground italic">
            {format.basedOn}
          </p>
        </div>
      ))}
    </div>
  )
}
