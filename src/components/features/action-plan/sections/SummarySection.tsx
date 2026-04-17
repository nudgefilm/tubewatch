"use client"

import { AlertTriangle, Target, TrendingUp, Calendar, Dna, BarChart3 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface ActionPlanSummaryProps {
  data: {
    coreProblem: string
    recommendedStrategy: string
    expectedChange: string
    applicationPeriod: string
    dnaSource: string
    analysisSource: string
  }
}

export function ActionPlanSummarySection({ data }: ActionPlanSummaryProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">전략 요약</h2>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <BarChart3 className="h-3 w-3" />
            {data.analysisSource}
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Dna className="h-3 w-3" />
            {data.dnaSource}
          </Badge>
        </div>
      </div>

      <Card className="bg-gradient-to-br from-destructive/5 to-transparent border-destructive/20">
        <CardContent className="p-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* 핵심 문제 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">핵심 문제</span>
              </div>
              <p className="text-sm leading-relaxed text-rose-700 dark:text-rose-400">
                {data.coreProblem}
              </p>
            </div>

            {/* 권장 전략 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400">
                <Target className="h-4 w-4" />
                <span className="text-sm font-medium">권장 전략</span>
              </div>
              <p className="text-sm leading-relaxed text-sky-700 dark:text-sky-400">
                {data.recommendedStrategy}
              </p>
            </div>

            {/* 기대 변화 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">기대 변화</span>
              </div>
              <p className="text-sm leading-relaxed text-emerald-700 dark:text-emerald-400">
                {data.expectedChange}
              </p>
            </div>

            {/* 적용 기간 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span className="text-sm font-medium">적용 기간</span>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {data.applicationPeriod}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
