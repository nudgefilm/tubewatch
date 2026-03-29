"use client"

import { Lightbulb, ChevronRight, AlertTriangle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { StrategicCommentVm } from "@/lib/shared/strategicCommentTypes"

export type { StrategicCommentVm }

interface StrategicCommentCardProps {
  data: StrategicCommentVm
}

export function StrategicCommentCard({ data }: StrategicCommentCardProps) {
  return (
    <Card className="border-primary/25 bg-primary/[0.04] dark:bg-primary/[0.08]">
      <CardContent className="p-6 space-y-5">

        {/* ── 상단 배지 ── */}
        <div className="flex items-center gap-2">
          <Lightbulb className="size-4 text-primary shrink-0" />
          <Badge
            variant="secondary"
            className="text-xs font-semibold tracking-wide px-2.5"
          >
            TubeWatch 전략 코멘트
          </Badge>
        </div>

        {/* ── 메인 제목 ── */}
        <h3 className="text-base font-semibold leading-snug">{data.headline}</h3>

        {/* ── 핵심 요약 본문 ── */}
        <p className="text-sm text-muted-foreground leading-relaxed">
          {data.summary}
        </p>

        {/* ── 구분선 ── */}
        <div className="h-px bg-border/60" />

        {/* ── 핵심 포인트 칩 ── */}
        {data.keyTakeaways.length > 0 && (
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              핵심 포인트
            </p>
            <div className="flex flex-wrap gap-2">
              {data.keyTakeaways.map((takeaway, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 rounded-md border bg-background px-3 py-1.5 text-xs font-medium"
                >
                  <span className="size-1.5 rounded-full bg-primary shrink-0" />
                  {takeaway}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── 우선 실행 포인트 ── */}
        {data.priorityAction && (
          <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/[0.06] px-4 py-3">
            <ChevronRight className="size-4 text-primary mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-primary mb-1 uppercase tracking-wider">
                지금 실행할 포인트
              </p>
              <p className="text-sm leading-relaxed">{data.priorityAction}</p>
            </div>
          </div>
        )}

        {/* ── 주의 포인트 ── */}
        {data.caution && (
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50/50 dark:border-amber-800/60 dark:bg-amber-950/20 px-4 py-3">
            <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
              {data.caution}
            </p>
          </div>
        )}

      </CardContent>
    </Card>
  )
}
