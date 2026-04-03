"use client"

import { useState } from "react"
import {
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Database,
  ListChecks,
  TrendingUp,
  Target,
  Clock,
  AlertTriangle,
  Shield,
  Dna,
  BarChart3,
  ArrowRight,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SegmentGauge } from "@/components/ui/SegmentGauge"

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
  scenarioBlocks?: string[]
  applicationScope?: string | null
  experimentPeriod?: string | null
  caution?: string | null
  confidence?: number | null
  dnaConnection?: string | null
  analysisConnection?: string | null
  signalTag?: string | null
  priority: string
  performancePrediction?: {
    current: string
    targetRange: string
    expectedChanges: string[]
    predictionBasis?: string
  } | null
  executionSpec?: {
    videoCount: string
    targetElement: string
    comparisonBasis: string
  } | null
}

interface ActionPlanCardsProps {
  data: ActionCard[]
}

const priorityColors: Record<string, string> = {
  P1: "bg-destructive text-destructive-foreground",
  P2: "bg-amber-500 text-white",
  P3: "bg-blue-500 text-white",
}

const SCENARIO_STEP_LABELS = [
  "1단계: 테스트 (1~2개 영상)",
  "2단계: 반응 확인",
  "3단계: 전체 확장",
] as const

export function ActionPlanCardsSection({ data }: ActionPlanCardsProps) {
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({})

  const toggleCard = (id: string) => {
    setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const fullCount = data.filter((a) => {
    const blocks = (a.scenarioBlocks ?? []).filter(b => b.trim().length > 0)
    const changes = a.performancePrediction?.expectedChanges.filter(c => c.trim().length > 0) ?? []
    return (
      blocks.length === 3 &&
      a.performancePrediction?.current.trim() &&
      a.performancePrediction?.targetRange.trim() &&
      changes.length > 0
    )
  }).length

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        총 {data.length}개 실행 항목
        {fullCount > 0 && ` · 전체 분석 ${fullCount}개`}
        {" · 지금 바꾸지 않으면 결과가 달라집니다"}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.map((action) => {
          const isExpanded = expandedCards[action.id]

          const validScenarioBlocks = (action.scenarioBlocks ?? []).filter(b => b.trim().length > 0)
          const hasFullScenario = validScenarioBlocks.length === 3
          const validExpectedChanges = action.performancePrediction?.expectedChanges.filter(c => c.trim().length > 0) ?? []
          const showPerfPrediction = !!(
            action.performancePrediction &&
            action.performancePrediction.current.trim() &&
            action.performancePrediction.targetRange.trim() &&
            validExpectedChanges.length > 0
          )
          const isFullInsight = showPerfPrediction && hasFullScenario

          return (
            <Card key={action.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={priorityColors[action.priority]}>
                        {action.priority}
                      </Badge>
                      {isFullInsight && (
                        <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-200">
                          전체 분석
                        </Badge>
                      )}
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
                      {action.signalTag && (
                        <Badge variant="secondary" className="text-xs">
                          {action.signalTag}
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

                {/* 문제 상황 — 항상 표시 */}
                <div className="flex items-start gap-2 mt-3 p-3 bg-muted/50 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-destructive mb-0.5">문제 상황</p>
                    <p className="text-sm">{action.problemSummary}</p>
                  </div>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="pt-0 space-y-6">
                  {isFullInsight ? (
                    /* ── Full Insight: 진단 근거 + 실행 + 성과 예측 + 단계별 시나리오 + 보조 정보 ── */
                    <>
                      {action.evidenceData && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <Database className="h-4 w-4 text-primary" />
                            원인 (데이터 기반)
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            <div className="p-3 bg-muted/50 rounded-lg">
                              <p className="text-xs text-muted-foreground">현재 수치</p>
                              <p className="font-medium">{action.evidenceData.current}</p>
                            </div>
                            <div className="p-3 bg-muted/50 rounded-lg">
                              <p className="text-xs text-muted-foreground">기준점</p>
                              <p className="font-medium">{action.evidenceData.benchmark}</p>
                            </div>
                            <div className="p-3 bg-muted/50 rounded-lg">
                              <p className="text-xs text-muted-foreground">표본</p>
                              <p className="font-medium">{action.evidenceData.sampleSize}개</p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <ListChecks className="h-4 w-4 text-emerald-500" />
                          실행 액션
                        </div>
                        {action.executionSpec && (
                          <div className="flex flex-wrap gap-2 pl-6 mb-1">
                            {action.executionSpec.videoCount.trim() && (
                              <Badge variant="secondary" className="text-xs">
                                영상 {action.executionSpec.videoCount}
                              </Badge>
                            )}
                            {action.executionSpec.targetElement.trim() && (
                              <Badge variant="secondary" className="text-xs">
                                변경: {action.executionSpec.targetElement}
                              </Badge>
                            )}
                            {action.executionSpec.comparisonBasis.trim() && (
                              <Badge variant="secondary" className="text-xs">
                                기준: {action.executionSpec.comparisonBasis}
                              </Badge>
                            )}
                          </div>
                        )}
                        <ul className="space-y-1 pl-6">
                          {action.howToExecute.map((step, index) => (
                            <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                              <span className="text-primary font-medium">{index + 1}.</span>
                              {step}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Target className="h-4 w-4 text-primary" />
                          예상 변화
                        </div>
                        <div className="pl-6 space-y-2">
                          <div className="flex items-center gap-2 text-sm flex-wrap">
                            <span className="text-muted-foreground">{action.performancePrediction!.current}</span>
                            <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span className="font-medium">{action.performancePrediction!.targetRange}</span>
                          </div>
                          {action.performancePrediction!.predictionBasis && (
                            <p className="text-xs text-muted-foreground">
                              근거 — {action.performancePrediction!.predictionBasis}
                            </p>
                          )}
                          <ul className="space-y-1">
                            {validExpectedChanges.map((change, i) => (
                              <li key={i} className="text-sm text-muted-foreground flex items-center gap-1.5">
                                <TrendingUp className="h-3 w-3 text-emerald-500 shrink-0" />
                                {change}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <TrendingUp className="h-4 w-4 text-emerald-500" />
                            단계별 시나리오
                          </div>
                          <div className="pl-6 space-y-2">
                            {SCENARIO_STEP_LABELS.map((label, i) => (
                              <div key={label}>
                                <p className="text-xs font-semibold text-muted-foreground mb-0.5">{label}</p>
                                <p className="text-sm text-muted-foreground leading-relaxed">{validScenarioBlocks[i]}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                        {action.applicationScope && (
                          <div className="space-y-3">
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

                      {(action.experimentPeriod || action.caution) && (
                        <div className="grid gap-4 md:grid-cols-2">
                          {action.experimentPeriod && (
                            <div className="space-y-3">
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
                            <div className="space-y-3">
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

                      {action.confidence != null && (
                        <div className="pt-4 border-t">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 text-sm">
                              <Shield className="h-4 w-4" />
                              <span>데이터 신뢰도</span>
                            </div>
                            <span className="text-sm font-medium">{action.confidence}%</span>
                          </div>
                          <SegmentGauge score={action.confidence} label={false} />
                          {action.evidenceData && (
                            <p className="text-xs text-muted-foreground mt-1">
                              표본 {action.evidenceData.sampleSize}개 · 패턴 일관성 분석
                            </p>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    /* ── Quick Action: 실행 항목 + 적용 범위만 ── */
                    <>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <ListChecks className="h-4 w-4 text-emerald-500" />
                          실행 액션
                        </div>
                        {action.executionSpec && (
                          <div className="flex flex-wrap gap-2 pl-6 mb-1">
                            {action.executionSpec.videoCount.trim() && (
                              <Badge variant="secondary" className="text-xs">
                                영상 {action.executionSpec.videoCount}
                              </Badge>
                            )}
                            {action.executionSpec.targetElement.trim() && (
                              <Badge variant="secondary" className="text-xs">
                                변경: {action.executionSpec.targetElement}
                              </Badge>
                            )}
                            {action.executionSpec.comparisonBasis.trim() && (
                              <Badge variant="secondary" className="text-xs">
                                기준: {action.executionSpec.comparisonBasis}
                              </Badge>
                            )}
                          </div>
                        )}
                        <ul className="space-y-1 pl-6">
                          {action.howToExecute.map((step, index) => (
                            <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                              <span className="text-primary font-medium">{index + 1}.</span>
                              {step}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {action.expectedEffect && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <TrendingUp className="h-4 w-4 text-emerald-500" />
                            예상 변화
                          </div>
                          <p className="text-sm text-muted-foreground pl-6">
                            {action.expectedEffect}
                          </p>
                        </div>
                      )}

                      {action.applicationScope && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <Target className="h-4 w-4 text-primary" />
                            적용 범위
                          </div>
                          <p className="text-sm text-muted-foreground pl-6">
                            {action.applicationScope}
                          </p>
                        </div>
                      )}
                    </>
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
