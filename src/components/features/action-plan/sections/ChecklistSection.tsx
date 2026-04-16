"use client"

import { useState, useEffect } from "react"
import { Check, Minus, X, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SegmentGauge } from "@/components/ui/SegmentGauge"

interface ChecklistItem {
  id: string
  text: string
  linked?: string
}

interface ChecklistData {
  changeFirst: ChecklistItem[]
  maintain: ChecklistItem[]
  avoid: ChecklistItem[]
  reviewAfter2Weeks: ChecklistItem[]
}

export interface FlatChecklistItem {
  id: string
  title: string
  description: string
  difficulty: "easy" | "medium" | "hard"
}

interface ActionPlanChecklistProps {
  data?: ChecklistData
  items?: FlatChecklistItem[]
  storageKey?: string
}

const difficultyLabel: Record<FlatChecklistItem["difficulty"], string> = {
  easy: "바로 가능",
  medium: "준비 필요",
  hard: "신중 접근",
}

const difficultyColor: Record<FlatChecklistItem["difficulty"], string> = {
  easy: "text-foreground",
  medium: "text-foreground/70",
  hard: "text-muted-foreground",
}

export function ActionPlanChecklistSection({ data, items, storageKey }: ActionPlanChecklistProps) {
  const lsKey = storageKey ? `ap_checklist_${storageKey}` : null
  const [checked, setChecked] = useState<Set<string>>(new Set())

  // localStorage에서 저장된 체크 상태 복원
  useEffect(() => {
    if (!lsKey) return
    try {
      const stored = localStorage.getItem(lsKey)
      if (stored) setChecked(new Set(JSON.parse(stored) as string[]))
    } catch {}
  }, [lsKey])

  function toggle(id: string) {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      if (lsKey) {
        try { localStorage.setItem(lsKey, JSON.stringify([...next])) } catch {}
      }
      return next
    })
  }

  if (items && items.length > 0) {
    const doneCount = items.filter((i) => checked.has(i.id)).length
    return (
      <div className="space-y-3">
        {/* 진행 카운터 */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>업로드 전 체크리스트</span>
          <span className={doneCount === items.length ? "font-semibold text-emerald-600" : ""}>
            {doneCount} / {items.length} 완료
          </span>
        </div>
        {/* 진행 게이지 */}
        <div className="flex justify-center">
          <SegmentGauge
            score={items.length > 0 ? (doneCount / items.length) * 100 : 0}
            segments={items.length * 2}
            label={false}
          />
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {items.map((item) => {
            const isDone = checked.has(item.id)
            return (
              <button
                key={item.id}
                onClick={() => toggle(item.id)}
                className={`flex gap-3 rounded-lg border p-4 text-left transition-colors ${
                  isDone
                    ? "border-foreground/20 bg-muted/50"
                    : "bg-card hover:bg-muted/40"
                }`}
              >
                {/* 체크 아이콘 */}
                <div
                  className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                    isDone
                      ? "border-foreground bg-foreground text-background"
                      : "border-muted-foreground/30"
                  }`}
                >
                  {isDone && <Check className="size-3 stroke-[3]" />}
                </div>
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm font-medium ${isDone ? "line-through text-muted-foreground" : ""}`}>
                      {item.title}
                    </p>
                    <span className={`shrink-0 text-xs font-medium ${isDone ? "text-muted-foreground" : difficultyColor[item.difficulty]}`}>
                      {difficultyLabel[item.difficulty]}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* 먼저 바꿀 것 */}
        <Card className="border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-emerald-700 dark:text-emerald-400">
              <div className="p-1 rounded-full bg-emerald-100 dark:bg-emerald-900">
                <Check className="h-4 w-4" />
              </div>
              먼저 바꿀 것
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {data.changeFirst.map((item) => (
                <li key={item.id} className="flex items-start gap-2">
                  <div className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm">{item.text}</p>
                    {item.linked && (
                      <Badge variant="outline" className="text-xs">
                        {item.linked}
                      </Badge>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* 유지할 것 */}
        <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-blue-700 dark:text-blue-400">
              <div className="p-1 rounded-full bg-blue-100 dark:bg-blue-900">
                <Minus className="h-4 w-4" />
              </div>
              유지할 것
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {data.maintain.map((item) => (
                <li key={item.id} className="flex items-start gap-2">
                  <div className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                  <p className="text-sm">{item.text}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* 하지 말 것 */}
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-destructive">
              <div className="p-1 rounded-full bg-destructive/10">
                <X className="h-4 w-4" />
              </div>
              하지 말 것
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {data.avoid.map((item) => (
                <li key={item.id} className="flex items-start gap-2">
                  <div className="mt-1 h-1.5 w-1.5 rounded-full bg-destructive shrink-0" />
                  <p className="text-sm">{item.text}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* 2주 후 확인 */}
        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-amber-700 dark:text-amber-400">
              <div className="p-1 rounded-full bg-amber-100 dark:bg-amber-900">
                <Clock className="h-4 w-4" />
              </div>
              2주 후 확인
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {data.reviewAfter2Weeks.map((item) => (
                <li key={item.id} className="flex items-start gap-2">
                  <div className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm">{item.text}</p>
                    {item.linked && (
                      <Badge variant="outline" className="text-xs">
                        {item.linked}
                      </Badge>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
