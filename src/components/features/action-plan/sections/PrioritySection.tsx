"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface PriorityAction {
  id: string
  level: string
  title: string
  reason: string
  expectedEffect: string
  executionSteps: string[]
  order: number
  difficulty: string
}

interface ActionPlanPriorityProps {
  data: PriorityAction[]
}

const priorityColors: Record<string, string> = {
  P1: "bg-destructive text-destructive-foreground",
  P2: "bg-amber-500 text-white",
  P3: "bg-blue-500 text-white",
}

const priorityActionLabel: Record<string, string> = {
  P1: "지금 바로 실행하세요",
  P2: "이번 주 안에 시도하세요",
  P3: "여유가 될 때 점검하세요",
}

const difficultyColors: Record<string, string> = {
  상: "text-destructive",
  중: "text-amber-600",
  하: "text-foreground",
}

export function ActionPlanPrioritySection({ data }: ActionPlanPriorityProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {data.map((action) => (
        <Card key={action.id} className="relative overflow-hidden">
          {/* 우선순위 배지 */}
          <div className={`absolute top-0 right-0 px-3 py-1 text-sm font-bold ${priorityColors[action.level]}`}>
            {action.level}
          </div>

          <CardHeader className="pb-2">
            <p className="text-xs font-semibold text-muted-foreground mb-1">
              {priorityActionLabel[action.level] ?? `STEP ${action.order}`}
            </p>
            {/* 1. 헤드라인 */}
            <CardTitle className="text-xl pr-10 leading-snug">{action.title}</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* 2. DNA 근거 */}
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">
                DNA 근거
              </p>
              <p className="text-sm text-foreground/80 leading-relaxed">{action.reason}</p>
            </div>

            {/* 3. 기대 효과 */}
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">
                기대 효과
              </p>
              <p className="text-sm text-foreground/80 leading-relaxed">{action.expectedEffect}</p>
            </div>

            {/* 4. 실행 방법 */}
            {action.executionSteps.length > 0 && (
              <div className="pt-2 border-t">
                <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                  실행 방법
                </p>
                <ol className="space-y-2">
                  {action.executionSteps.slice(0, 2).map((step, i) => (
                    <li key={i} className="flex gap-2 text-sm text-foreground/80 leading-relaxed">
                      <span className="shrink-0 font-semibold text-primary">{i + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* 실행 난이도 */}
            <div className="flex items-center justify-between text-xs pt-1 border-t">
              <span className="text-muted-foreground">실행 난이도</span>
              <span className={`font-medium ${difficultyColors[action.difficulty]}`}>
                {action.difficulty}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
