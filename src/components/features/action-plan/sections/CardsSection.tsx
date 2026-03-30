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
  evidenceData?: {
    current: string
    benchmark: string
    sampleSize: number
  } | null
  whyNeeded: string
  howToExecute: string[]
  expectedEffect: string
  applicationScope?: string | null
  experimentPeriod?: string | null
  caution?: string | null
  confidence?: number | null
  dnaConnection?: string | null
  analysisConnection?: string | null
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
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        총 {data.length}개 실행 항목 · 카드를 펼쳐 실행 방법을 확인하세요
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      {action.analysisConnection && (
                        <Badge variant="outline" className="gap-1">
                          <BarChart3 className="h-3 w-3" />
                          {action.analysisConnection}
                        </Badge>
                      )}
                      {action.dnaConnection && (
                        <Badge variant="outline" className="gap-1">
                          <Dna className="h-3 w-3" />
                          {action.dnaConnection}
                        </Badge>
                      )}
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

                {/* 현재 진단 — 항상 표시 */}
                <div className="flex items-start gap-2 mt-3 p-3 bg-muted/50 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-destructive mb-0.5">현재 진단</p>
                    <p className="text-sm">{action.problemSummary}</p>
                  </div>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="pt-0 space-y-6">
                  {/* 진단 근거 */}
                  {action.evidenceData && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Database className="h-4 w-4 text-primary" />
                        진단 근거
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-xs text-muted-foreground">현재 상태</p>
                          <p className="font-medium">{action.evidenceData.current}</p>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-xs text-muted-foreground">기준점</p>
                          <p className="font-medium">{action.evidenceData.benchmark}</p>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-xs text-muted-foreground">분석 표본</p>
                          <p className="font-medium">{action.evidenceData.sampleSize}개</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 실행이 필요한 이유 */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Lightbulb className="h-4 w-4 text-amber-500" />
                      실행이 필요한 이유
                    </div>
                    <p className="text-sm text-muted-foreground pl-6">
                      {action.whyNeeded}
                    </p>
                  </div>

                  {/* 지금 실행하세요 */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <ListChecks className="h-4 w-4 text-emerald-500" />
                      지금 실행하세요
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

                  {/* 실행 후 변화 시나리오 & 적용 범위 */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                        실행 후 변화 시나리오
                      </div>
                      <p className="text-sm text-muted-foreground pl-6">
                        {action.expectedEffect}
                      </p>
                    </div>
                    {action.applicationScope && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Target className="h-4 w-4 text-primary" />
                          적용 범위
                        </div>
                        <p className="text-sm text-muted-foreground pl-6">
                          {action.applicationScope}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* 확인 기간 & 주의사항 */}
                  {(action.experimentPeriod || action.caution) && (
                    <div className="grid gap-4 md:grid-cols-2">
                      {action.experimentPeriod && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            확인 기간
                          </div>
                          <p className="text-sm text-muted-foreground pl-6">
                            {action.experimentPeriod}
                          </p>
                        </div>
                      )}
                      {action.caution && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                            주의사항
                          </div>
                          <p className="text-sm text-muted-foreground pl-6">
                            {action.caution}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 데이터 신뢰도 */}
                  {action.confidence != null && (
                    <div className="pt-4 border-t">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Shield className="h-4 w-4" />
                          <span>데이터 신뢰도</span>
                        </div>
                        <span className="text-sm font-medium">{action.confidence}%</span>
                      </div>
                      <Progress value={action.confidence} className="h-2" />
                      {action.evidenceData && (
                        <p className="text-xs text-muted-foreground mt-1">
                          표본 {action.evidenceData.sampleSize}개 기준 · 패턴 일관성 분석
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
