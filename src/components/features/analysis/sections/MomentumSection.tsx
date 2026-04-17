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
  const dayFromMonday = (today.getDay() + 6) % 7
  const thisMonday = new Date(today)
  thisMonday.setDate(today.getDate() - dayFromMonday)
  const start = new Date(thisMonday)
  start.setDate(thisMonday.getDate() - 77)
  return Array.from({ length: 84 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return dateSet.has(toLocalDateStr(d))
  })
}

// 빨주노초파남보 — pastel rainbow per day of week (Mon=0 … Sun=6)
const DAY_ACTIVE_CLS = [
  "bg-rose-300",    // 월 빨
  "bg-orange-300",  // 화 주
  "bg-yellow-300",  // 수 노
  "bg-green-300",   // 목 초
  "bg-sky-300",     // 금 파
  "bg-indigo-300",  // 토 남
  "bg-violet-300",  // 일 보
]

const DAY_LABEL_CLS = [
  "text-rose-400",
  "text-orange-400",
  "text-yellow-500",
  "text-green-500",
  "text-sky-500",
  "text-indigo-400",
  "text-violet-400",
]

const DAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"]

export function MomentumSection({ uploadDates }: MomentumSectionProps) {
  const dots = buildDotGrid(uploadDates)
  const uploadDayCount = dots.filter(Boolean).length

  return (
    <Card className="shadow-sm">
      <CardContent className="p-6 pt-6">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-muted-foreground">최근 12주 업로드 활동</span>
            <p className="text-[10px] text-muted-foreground/50 mt-0.5">열(가로) = 주차 · 행(세로) = 요일(월~일)</p>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-0.5">
              {DAY_ACTIVE_CLS.map((cls, i) => (
                <span key={i} className={`inline-block w-2 h-2 rounded-[2px] ${cls}`} />
              ))}
            </div>
            <span className="text-[10px] text-muted-foreground/60">업로드</span>
            <span className="text-xs text-muted-foreground ml-1">{uploadDayCount}일</span>
          </div>
        </div>

        <div className="flex gap-2 items-start">
          {/* Day labels — colored to match dot color */}
          <div className="flex flex-col" style={{ gap: "3px" }}>
            {DAY_LABELS.map((day, i) => (
              <div key={day} style={{ height: "10px" }} className="flex items-center justify-end w-4">
                <span className={`text-[9px] font-medium ${DAY_LABEL_CLS[i]}`}>{day}</span>
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
            {dots.map((active, idx) => {
              const dayIdx = idx % 7
              return (
                <div
                  key={idx}
                  className={`rounded-[2px] transition-colors ${active ? DAY_ACTIVE_CLS[dayIdx] : "bg-slate-200 dark:bg-slate-700"}`}
                />
              )
            })}
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
