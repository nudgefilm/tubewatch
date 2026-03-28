"use client"

import { ArrowRight, Shield } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

interface PriorityAction {
  id: string
  level: string
  title: string
  impact?: string[]
  reason: string
  order: number
  confidence?: number | null
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

const difficultyColors: Record<string, string> = {
  상: "text-destructive",
  중: "text-amber-600",
  하: "text-emerald-600",
}

export function ActionPlanPrioritySection({ data }: ActionPlanPriorityProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">실행 우선순위</h2>
        <p className="text-sm text-muted-foreground">
          영향도 x 실행 가능성 x 신뢰도 기반 산출
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {data.map((action, index) => (
          <Card key={action.id} className="relative overflow-hidden">
            {/* 우선순위 배지 */}
            <div className={`absolute top-0 right-0 px-3 py-1 text-sm font-bold ${priorityColors[action.level]}`}>
              {action.level}
            </div>

            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <span>STEP {action.order}</span>
                {index < data.length - 1 && (
                  <ArrowRight className="h-3 w-3" />
                )}
              </div>
              <CardTitle className="text-lg">{action.title}</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* 영향 영역 */}
              {action.impact && action.impact.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {action.impact.map((item) => (
                    <Badge key={item} variant="secondary" className="text-xs">
                      {item}
                    </Badge>
                  ))}
                </div>
              )}

              {/* 우선 적용 이유 */}
              <p className="text-sm text-muted-foreground leading-relaxed">
                {action.reason}
              </p>

              {/* 신뢰도 & 난이도 */}
              <div className="space-y-2 pt-2 border-t">
                {action.confidence != null && (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        <span>신뢰도</span>
                      </div>
                      <span className="font-medium">{action.confidence}%</span>
                    </div>
                    <Progress value={action.confidence} className="h-1.5" />
                  </>
                )}

                <div className="flex items-center justify-between text-sm pt-1">
                  <span>실행 난이도</span>
                  <span className={`font-medium ${difficultyColors[action.difficulty]}`}>
                    {action.difficulty}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
