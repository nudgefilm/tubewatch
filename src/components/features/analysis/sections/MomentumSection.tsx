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
  const dateSet = new Set(
    uploadDates.filter(d => d && d.length >= 10).map(d => d.slice(0, 10))
  )
  const today = new Date()
  // Align to Monday of current week (Mon=0 … Sun=6)
  const dayFromMonday = (today.getDay() + 6) % 7
  const thisMonday = new Date(today)
  thisMonday.setDate(today.getDate() - dayFromMonday)
  // Start = Monday 11 weeks back (77 days before this Monday)
  const start = new Date(thisMonday)
  start.setDate(thisMonday.getDate() - 77)
  // 84 items ordered column-major: idx 0-6 = week1 Mon-Sun, 7-13 = week2 Mon-Sun …
  return Array.from({ length: 84 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return dateSet.has(toLocalDateStr(d))
  })
}

const DAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"]

export function MomentumSection({ uploadDates }: MomentumSectionProps) {
  const dots = buildDotGrid(uploadDates)
  const uploadDayCount = dots.filter(Boolean).length

  return (
    <Card className="shadow-sm">
      <CardContent className="p-6">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-muted-foreground">최근 12주 업로드 활동</span>
            <p className="text-[10px] text-muted-foreground/50 mt-0.5">열(가로) = 주차 · 행(세로) = 요일(월~일)</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
              <span className="inline-block w-2 h-2 rounded-[2px] bg-primary" />
              업로드
            </span>
            <span className="text-xs text-muted-foreground">{uploadDayCount}일</span>
          </div>
        </div>

        <div className="flex gap-2 items-start">
          {/* Day-of-week labels — same gap/height as grid rows */}
          <div className="flex flex-col" style={{ gap: "3px" }}>
            {DAY_LABELS.map(day => (
              <div key={day} style={{ height: "10px" }} className="flex items-center justify-end w-4">
                <span className="text-[9px] text-muted-foreground/50">{day}</span>
              </div>
            ))}
          </div>

          {/* Column-major grid: each column = 1 week, each row = day of week */}
          <div
            className="flex-1"
            style={{
              display: "grid",
              gridTemplateRows: "repeat(7, 10px)",
              gridTemplateColumns: "repeat(12, 1fr)",
              gridAutoFlow: "column",
              gap: "3px",
            }}
          >
            {dots.map((active, idx) => (
              <div
                key={idx}
                className={`rounded-[2px] transition-colors ${active ? "bg-primary" : "bg-slate-200 dark:bg-slate-700"}`}
              />
            ))}
          </div>
        </div>

        <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground/40 pl-6">
          <span>← 12주 전</span>
          <span>이번 주 →</span>
        </div>
      </CardContent>
    </Card>
  )
}
