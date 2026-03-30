"use client"

import { Lightbulb, ChevronRight, AlertTriangle } from "lucide-react"
import type { StrategicCommentVm } from "@/lib/shared/strategicCommentTypes"

export type { StrategicCommentVm }

interface StrategicCommentCardProps {
  data: StrategicCommentVm
}

export function StrategicCommentCard({ data }: StrategicCommentCardProps) {
  return (
    <div className="space-y-3 pt-2">

      {/*
        border-t-2 + border-t-primary/50 : 상단 강조 라인
        border-primary/40                : 나머지 3면 테두리 (일반 카드 /25 대비 강화)
        shadow-sm                        : 약간의 elevation
      */}
      <div className="rounded-xl border border-border bg-slate-100 dark:bg-slate-800 shadow-sm" style={{ borderTopWidth: "3px", borderTopColor: "var(--primary)" }}>
        <div className="p-6 space-y-4">

          {/* ── 배지 ── */}
          <div className="flex items-center gap-2">
            <Lightbulb className="size-4 text-primary-foreground shrink-0" style={{ color: "var(--primary)" }} />
            <span
              className="inline-flex items-center rounded-md px-2.5 py-1 text-[11px] font-semibold tracking-wide text-primary-foreground"
              style={{ backgroundColor: "var(--primary)" }}
            >
              TubeWatch 전략 코멘트
            </span>
          </div>

          {/* ── 핵심 결론 — headline 강조 ── */}
          <h3 className="text-lg font-bold leading-snug">{data.headline}</h3>

          {/* ── 보조 설명 ── */}
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
            <div className="flex items-start gap-3 rounded-lg border border-primary/25 bg-primary/[0.08] px-4 py-3">
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

        </div>
      </div>
    </div>
  )
}
