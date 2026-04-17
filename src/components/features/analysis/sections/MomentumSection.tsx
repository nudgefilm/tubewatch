"use client"

import { Card, CardContent } from "@/components/ui/card"

interface MomentumSectionProps {
  uploadDates: string[]
}

function toLocalDateStr(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function buildDotGrid(uploadDates: string[]): boolean[] {
  const today = new Date()
  const dateSet = new Set(
    uploadDates.filter(d => d && d.length >= 10).map(d => d.slice(0, 10))
  )
  return Array.from({ length: 84 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (83 - i))
    return dateSet.has(toLocalDateStr(d))
  })
}

export function MomentumSection({ uploadDates }: MomentumSectionProps) {
  const dots = buildDotGrid(uploadDates)
  const uploadCount = dots.filter(Boolean).length

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-6">
        <div className="mb-2.5 flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">최근 12주 업로드 활동</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
              <span className="inline-block w-2 h-2 rounded-[2px] bg-primary/70" />
              업로드 있음
            </span>
            <span className="text-xs text-muted-foreground">{uploadCount}개 영상</span>
          </div>
        </div>

        {/* 행우선 12열 그리드 — aspect-ratio:1 로 정사각 dot */}
        <div
          className="w-full"
          style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "3px" }}
        >
          {dots.map((active, idx) => (
            <div
              key={idx}
              className={`h-2.5 w-full rounded-[2px] transition-colors ${active ? "bg-primary/70" : "bg-muted/60"}`}
            />
          ))}
        </div>

        {/* 시간 방향 안내 */}
        <div className="mt-1 flex justify-between text-[10px] text-muted-foreground/40">
          <span>← 12주 전</span>
          <span>오늘 →</span>
        </div>
      </CardContent>
    </Card>
  )
}
