"use client"

import { useState } from "react"
import { 
  ChevronDown, 
  ChevronUp, 
  AlertCircle, 
  Database, 
  Lightbulb, 
  ListChecks,
  TrendingUp,
  Target,
  Clock,
  AlertTriangle,
  Shield,
  Dna,
  BarChart3
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

interface ActionCard {
  id: string
  title: string
  problemSummary: string
  evidenceData: {
    current: string
    benchmark: string
    sampleSize: number
  }
  whyNeeded: string
  howToExecute: string[]
  expectedEffect: string
  applicationScope: string
  experimentPeriod: string
  caution: string
  confidence: number
  dnaConnection: string
  analysisConnection: string
  priority: string
}

interface ActionPlanCardsProps {
  data: ActionCard[]
}

const priorityColors: Record<string, string> = {
  P1: "bg-destructive text-destructive-foreground",
  P2: "bg-amber-500 text-white",
  P3: "bg-blue-500 text-white",
}

export function ActionPlanCardsSection({ data }: ActionPlanCardsProps) {
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({})

  const toggleCard = (id: string) => {
    setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">액션 카드</h2>
        <p className="text-sm text-muted-foreground">
          총 {data.length}개 액션
        </p>
      </div>

      <div className="space-y-4">
        {data.map((action) => {
          const isExpanded = expandedCards[action.id]

          return (
            <Card key={action.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={priorityColors[action.priority]}>
                        {action.priority}
                      </Badge>
                      <Badge variant="outline" className="gap-1">
                        <BarChart3 className="h-3 w-3" />
                        {action.analysisConnection}
                      </Badge>
                      <Badge variant="outline" className="gap-1">
                        <Dna className="h-3 w-3" />
                        {action.dnaConnection}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{action.title}</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleCard(action.id)}
                    className="shrink-0"
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {/* 문제 요약 - 항상 표시 */}
                <div className="flex items-start gap-2 mt-3 p-3 bg-muted/50 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                  <p className="text-sm">{action.problemSummary}</p>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="pt-0 space-y-6">
                  {/* 근거 데이터 */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Database className="h-4 w-4 text-primary" />
                      근거 데이터
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground">현재</p>
                        <p className="font-medium">{action.evidenceData.current}</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground">벤치마크</p>
                        <p className="font-medium">{action.evidenceData.benchmark}</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground">표본 수</p>
                        <p className="font-medium">{action.evidenceData.sampleSize}개</p>
                      </div>
                    </div>
                  </div>

                  {/* 왜 필요한지 */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Lightbulb className="h-4 w-4 text-amber-500" />
                      왜 필요한지
                    </div>
                    <p className="text-sm text-muted-foreground pl-6">
                      {action.whyNeeded}
                    </p>
                  </div>

                  {/* 실행 방법 */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <ListChecks className="h-4 w-4 text-emerald-500" />
                      실행 방법
                    </div>
                    <ul className="space-y-1 pl-6">
                      {action.howToExecute.map((step, index) => (
                        <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-primary font-medium">{index + 1}.</span>
                          {step}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* 예상 효과 & 적용 범위 */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                        예상 효과
                      </div>
                      <p className="text-sm text-muted-foreground pl-6">
                        {action.expectedEffect}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Target className="h-4 w-4 text-primary" />
                        적용 범위
                      </div>
                      <p className="text-sm text-muted-foreground pl-6">
                        {action.applicationScope}
                      </p>
                    </div>
                  </div>

                  {/* 실험 기간 & 주의사항 */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        실험 기간
                      </div>
                      <p className="text-sm text-muted-foreground pl-6">
                        {action.experimentPeriod}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        주의사항
                      </div>
                      <p className="text-sm text-muted-foreground pl-6">
                        {action.caution}
                      </p>
                    </div>
                  </div>

                  {/* 신뢰도 */}
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Shield className="h-4 w-4" />
                        <span>데이터 신뢰도</span>
                      </div>
                      <span className="text-sm font-medium">{action.confidence}%</span>
                    </div>
                    <Progress value={action.confidence} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      표본 {action.evidenceData.sampleSize}개 기준, 패턴 일관성 분석 결과
                    </p>
                  </div>
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>
    </section>
  )
}
