"use client"

import { useState, useMemo } from "react"
import {
  ChevronDown, ChevronUp, AlertCircle, Database, ListChecks, TrendingUp,
  Target, Clock, AlertTriangle, Shield, Dna, ArrowRight, Zap, Check,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SegmentGauge } from "@/components/ui/SegmentGauge"

interface ActionCard {
  id: string
  title: string
  problemSummary: string
  evidenceData?: { current: string; benchmark: string; sampleSize: number } | null
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

const SCENARIO_STEP_LABELS = [
  "1단계: 테스트 (1~2개 영상)",
  "2단계: 반응 확인",
  "3단계: 전체 확장",
] as const

// ── Priority color system ────────────────────────────────────────────────
const PRIORITY_COLORS: Record<string, {
  text: string; border: string; badge: string; muted: string; bar: string; dot: string; stroke: string
}> = {
  P1: {
    text: "text-rose-600 dark:text-rose-400",
    border: "border-l-rose-400 dark:border-l-rose-500",
    badge: "bg-rose-500 text-white",
    muted: "bg-rose-50 dark:bg-rose-950/30",
    bar: "bg-rose-300 dark:bg-rose-600/50",
    dot: "bg-rose-400 dark:bg-rose-500",
    stroke: "stroke-rose-400 dark:stroke-rose-500",
  },
  P2: {
    text: "text-amber-600 dark:text-amber-400",
    border: "border-l-amber-400 dark:border-l-amber-500",
    badge: "bg-amber-500 text-white",
    muted: "bg-amber-50 dark:bg-amber-950/30",
    bar: "bg-amber-300 dark:bg-amber-600/50",
    dot: "bg-amber-400 dark:bg-amber-500",
    stroke: "stroke-amber-400 dark:stroke-amber-500",
  },
  P3: {
    text: "text-sky-600 dark:text-sky-400",
    border: "border-l-sky-400 dark:border-l-sky-500",
    badge: "bg-sky-500 text-white",
    muted: "bg-sky-50 dark:bg-sky-950/30",
    bar: "bg-sky-300 dark:bg-sky-600/50",
    dot: "bg-sky-400 dark:bg-sky-500",
    stroke: "stroke-sky-400 dark:stroke-sky-500",
  },
}

// ── Category system ──────────────────────────────────────────────────────
type Category = "structure" | "seo" | "activity" | "engagement"

const CATEGORY_LABELS: Record<Category, string> = {
  structure: "구조",
  seo: "SEO",
  activity: "활동",
  engagement: "반응",
}

const CATEGORY_COLORS: Record<Category, string> = {
  structure: "bg-violet-300 dark:bg-violet-600/50",
  seo: "bg-emerald-300 dark:bg-emerald-600/50",
  activity: "bg-sky-300 dark:bg-sky-600/50",
  engagement: "bg-amber-300 dark:bg-amber-600/50",
}

function deriveCategory(action: ActionCard): Category {
  const id = action.id.toLowerCase()
  if (/activity|upload/.test(id)) return "activity"
  if (/audience|subscription/.test(id)) return "engagement"
  if (/tags|keyword|title/.test(id)) return "seo"
  if (/duration|growth|structure|dna/.test(id)) return "structure"
  const text = (action.title + " " + (action.signalTag ?? "")).toLowerCase()
  if (/업로드|주기|간격|빈도/.test(text)) return "activity"
  if (/반응|좋아요|댓글|참여|구독/.test(text)) return "engagement"
  if (/태그|키워드|제목|검색/.test(text)) return "seo"
  return "structure"
}

// ── Donut Chart ──────────────────────────────────────────────────────────
const CIRCUMFERENCE = 2 * Math.PI * 42

function DonutChart({ counts, total }: { counts: Record<string, number>; total: number }) {
  const arcs = useMemo(() => {
    let cumulative = 0
    return ["P1", "P2", "P3"].map((p) => {
      const count = counts[p] ?? 0
      const arcLength = total > 0 ? (count / total) * CIRCUMFERENCE : 0
      const dashOffset = -cumulative
      cumulative += arcLength
      return { priority: p, arcLength, dashOffset }
    })
  }, [counts, total])

  return (
    <div className="flex flex-col items-center gap-3">
      <svg viewBox="0 0 110 110" className="w-20 h-20">
        <g transform="rotate(-90 55 55)">
          <circle cx="55" cy="55" r="42" fill="none" strokeWidth="10" className="stroke-muted/30" />
          {arcs.map(({ priority, arcLength, dashOffset }) => {
            if (arcLength < 1) return null
            return (
              <circle
                key={priority}
                cx="55" cy="55" r="42"
                fill="none"
                strokeWidth="10"
                strokeDasharray={`${arcLength} ${CIRCUMFERENCE - arcLength}`}
                strokeDashoffset={dashOffset}
                className={PRIORITY_COLORS[priority].stroke}
              />
            )
          })}
        </g>
        <text x="55" y="52" textAnchor="middle" fontSize="16" fontWeight="700" fill="currentColor">{total}</text>
        <text x="55" y="65" textAnchor="middle" fontSize="8" fill="currentColor" opacity="0.45">total</text>
      </svg>
      <div className="flex gap-3 text-xs">
        {["P1", "P2", "P3"].map((p) => (
          <div key={p} className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full shrink-0 ${PRIORITY_COLORS[p].dot}`} />
            <span className={PRIORITY_COLORS[p].text}>{p} {counts[p] ?? 0}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Plan Summary Block ───────────────────────────────────────────────────
function PlanSummaryBlock({ data }: { data: ActionCard[] }) {
  const total = data.length

  const priorityCounts = useMemo(() =>
    data.reduce((acc, card) => {
      acc[card.priority] = (acc[card.priority] ?? 0) + 1
      return acc
    }, {} as Record<string, number>), [data])

  const categoryCounts = useMemo(() =>
    data.reduce((acc, card) => {
      const cat = deriveCategory(card)
      acc[cat] = (acc[cat] ?? 0) + 1
      return acc
    }, {} as Partial<Record<Category, number>>), [data])

  const totalActions = useMemo(() => data.reduce((s, c) => s + c.howToExecute.length, 0), [data])
  const totalBenefits = useMemo(() =>
    data.reduce((s, c) => s + (c.performancePrediction?.expectedChanges.filter(e => e.trim()).length ?? 0), 0), [data])
  const p1Pct = total > 0 ? Math.round(((priorityCounts["P1"] ?? 0) / total) * 100) : 0

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="grid grid-cols-12 divide-x divide-border">
        {/* 도넛 차트 */}
        <div className="col-span-3 p-4 flex items-center justify-center">
          <DonutChart counts={priorityCounts} total={total} />
        </div>

        {/* 카테고리 막대 */}
        <div className="col-span-5 p-4">
          <p className="text-xs font-medium text-muted-foreground mb-3">카테고리 분포</p>
          <div className="space-y-2.5">
            {(Object.keys(CATEGORY_LABELS) as Category[]).map((cat) => {
              const count = categoryCounts[cat] ?? 0
              const pct = total > 0 ? (count / total) * 100 : 0
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{CATEGORY_LABELS[cat]}</span>
                    <span className="tabular-nums font-medium">{count}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted/20 overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${CATEGORY_COLORS[cat]}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 지표 그리드 2×2 */}
        <div className="col-span-4 p-4 grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-muted/30 p-3 text-center">
            <p className="text-lg font-bold tabular-nums">{totalActions}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">실행 액션</p>
          </div>
          <div className="rounded-lg bg-emerald-50/60 dark:bg-emerald-950/20 p-3 text-center">
            <p className="text-lg font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{totalBenefits}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">개선 효과</p>
          </div>
          <div className="rounded-lg bg-violet-50/60 dark:bg-violet-950/20 p-3 text-center">
            <p className="text-lg font-bold tabular-nums text-violet-600 dark:text-violet-400">{total * 3}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">실행 단계</p>
          </div>
          <div className="rounded-lg bg-rose-50/60 dark:bg-rose-950/20 p-3 text-center">
            <p className="text-lg font-bold tabular-nums text-rose-600 dark:text-rose-400">{p1Pct}%</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">P1 비중</p>
          </div>
        </div>
      </div>

      {/* 영향도 진행 바 */}
      <div className="px-4 pb-3 pt-2 border-t">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1.5">
          <span>영향도 가중 분포</span>
          <span>P1 · 50%  P2 · 35%  P3 · 15%</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted/20 overflow-hidden flex gap-px">
          {["P1", "P2", "P3"].map((p) => {
            const weight = p === "P1" ? 50 : p === "P2" ? 35 : 15
            const count = priorityCounts[p] ?? 0
            const width = total > 0 ? (count / total) * weight : 0
            if (width < 0.5) return null
            return <div key={p} className={`h-full rounded-full ${PRIORITY_COLORS[p].bar}`} style={{ width: `${width}%` }} />
          })}
        </div>
      </div>
    </div>
  )
}

// ── Tab ──────────────────────────────────────────────────────────────────
type TabId = "all" | "p1" | "dna"

// ── Main Component ────────────────────────────────────────────────────────
export function ActionPlanCardsSection({ data }: ActionPlanCardsProps) {
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({})
  const [activeTab, setActiveTab] = useState<TabId>("all")

  const toggleCard = (id: string) => {
    setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const hasDnaCards = data.some(c => c.dnaConnection != null)

  const tabs: { id: TabId; label: string }[] = [
    { id: "all", label: "전체" },
    { id: "p1", label: "P1" },
    ...(hasDnaCards ? [{ id: "dna" as TabId, label: "DNA 기반" }] : []),
  ]

  const filteredData = useMemo(() => {
    if (activeTab === "p1") return data.filter(c => c.priority === "P1")
    if (activeTab === "dna") return data.filter(c => c.dnaConnection != null)
    return data
  }, [data, activeTab])

  const fullCount = data.filter((a) => {
    const blocks = (a.scenarioBlocks ?? []).filter(b => b.trim())
    const changes = a.performancePrediction?.expectedChanges.filter(c => c.trim()) ?? []
    return blocks.length === 3 && a.performancePrediction?.current.trim() && a.performancePrediction?.targetRange.trim() && changes.length > 0
  }).length

  return (
    <div className="space-y-4">
      {data.length > 0 && <PlanSummaryBlock data={data} />}

      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm text-muted-foreground">
          총 {filteredData.length}개{activeTab !== "all" && ` (전체 ${data.length}개)`}
          {fullCount > 0 && ` · 전체 분석 ${fullCount}개`}
          {" · 지금 바꾸지 않으면 결과가 달라집니다"}
        </p>
        <div className="flex gap-1 rounded-lg border p-0.5 bg-muted/30">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredData.map((action) => {
          const isExpanded = expandedCards[action.id]
          const colors = PRIORITY_COLORS[action.priority] ?? PRIORITY_COLORS["P3"]

          const validScenarioBlocks = (action.scenarioBlocks ?? []).filter(b => b.trim())
          const hasFullScenario = validScenarioBlocks.length === 3
          const validExpectedChanges = action.performancePrediction?.expectedChanges.filter(c => c.trim()) ?? []
          const showPerfPrediction = !!(
            action.performancePrediction?.current.trim() &&
            action.performancePrediction?.targetRange.trim() &&
            validExpectedChanges.length > 0
          )
          const isFullInsight = showPerfPrediction && hasFullScenario

          return (
            <Card key={action.id} className={`overflow-hidden border-l-4 ${colors.border}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold ${colors.badge}`}>
                        {action.priority}
                      </span>
                      {isFullInsight && (
                        <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-200">
                          전체 분석
                        </Badge>
                      )}
                      {action.dnaConnection && (
                        <Badge variant="outline" className="gap-1 text-xs">
                          <Dna className="h-3 w-3" />
                          {action.dnaConnection}
                        </Badge>
                      )}
                      {action.signalTag && (
                        <Badge variant="secondary" className="text-xs">{action.signalTag}</Badge>
                      )}
                    </div>
                    <CardTitle className="text-base leading-snug">{action.title}</CardTitle>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => toggleCard(action.id)} className="shrink-0 mt-1">
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>

                {/* 문제 상황 — 항상 표시 */}
                <div className={`flex items-start gap-2 mt-3 p-3 rounded-lg ${colors.muted}`}>
                  <AlertCircle className={`h-4 w-4 mt-0.5 shrink-0 ${colors.text}`} />
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-0.5">문제 상황</p>
                    <p className="text-sm">{action.problemSummary}</p>
                  </div>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="pt-0 space-y-6">
                  {isFullInsight ? (
                    <>
                      {/* 원인 (데이터 기반) */}
                      {action.evidenceData && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <Database className="h-4 w-4 text-primary" />
                            원인 (데이터 기반)
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            <div className="p-3 bg-muted/50 rounded-lg">
                              <p className="text-xs text-muted-foreground">현재 수치</p>
                              <p className="font-semibold text-sky-600 dark:text-sky-400">{action.evidenceData.current}</p>
                            </div>
                            <div className="p-3 bg-muted/50 rounded-lg">
                              <p className="text-xs text-muted-foreground">기준점</p>
                              <p className="font-semibold text-amber-600 dark:text-amber-400">{action.evidenceData.benchmark}</p>
                            </div>
                            <div className="p-3 bg-muted/50 rounded-lg">
                              <p className="text-xs text-muted-foreground">표본</p>
                              <p className="font-medium">{action.evidenceData.sampleSize}개</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 실행 액션 */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <ListChecks className="h-4 w-4 text-emerald-500" />
                          실행 액션
                        </div>
                        {action.executionSpec && (
                          <div className="flex flex-wrap gap-2 pl-6 mb-1">
                            {action.executionSpec.videoCount.trim() && (
                              <Badge variant="secondary" className="text-xs">영상 {action.executionSpec.videoCount}</Badge>
                            )}
                            {action.executionSpec.targetElement.trim() && (
                              <Badge variant="secondary" className="text-xs">변경: {action.executionSpec.targetElement}</Badge>
                            )}
                            {action.executionSpec.comparisonBasis.trim() && (
                              <Badge variant="secondary" className="text-xs">기준: {action.executionSpec.comparisonBasis}</Badge>
                            )}
                          </div>
                        )}
                        <ul className="space-y-1 pl-6">
                          {action.howToExecute.map((step, index) => (
                            <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                              <span className={`font-semibold shrink-0 ${colors.text}`}>{index + 1}.</span>
                              {step}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* 예상 변화 */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Target className="h-4 w-4 text-primary" />
                          예상 변화
                        </div>
                        <div className="pl-6 space-y-2">
                          <div className="flex items-center gap-2 text-sm flex-wrap">
                            <span className="text-muted-foreground">{action.performancePrediction!.current}</span>
                            <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">{action.performancePrediction!.targetRange}</span>
                          </div>
                          {action.performancePrediction!.predictionBasis && (
                            <p className="text-xs text-muted-foreground">근거 — {action.performancePrediction!.predictionBasis}</p>
                          )}
                          <ul className="space-y-1">
                            {validExpectedChanges.map((change, i) => (
                              <li key={i} className="text-sm text-muted-foreground flex items-center gap-1.5">
                                <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                                {change}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* 단계별 시나리오 — Timeline */}
                      <div className={`grid gap-4 ${action.applicationScope ? "md:grid-cols-2" : ""}`}>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <Zap className="h-4 w-4 text-amber-500" />
                            단계별 시나리오
                          </div>
                          <div className="pl-6">
                            {SCENARIO_STEP_LABELS.map((label, i) => (
                              <div key={label} className="flex gap-3">
                                <div className="flex flex-col items-center">
                                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${colors.dot}`} />
                                  {i < 2 && <div className="w-0.5 flex-1 bg-border my-1 min-h-[16px]" />}
                                </div>
                                <div className={i < 2 ? "pb-3 flex-1" : "flex-1"}>
                                  <p className="text-xs font-semibold text-muted-foreground mb-0.5">{label}</p>
                                  <p className="text-sm text-muted-foreground leading-relaxed">{validScenarioBlocks[i]}</p>
                                </div>
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
                            <p className="text-sm text-muted-foreground pl-6">{action.applicationScope}</p>
                          </div>
                        )}
                      </div>

                      {/* 확인 기간 + 주의사항 */}
                      {(action.experimentPeriod || action.caution) && (
                        <div className={`grid gap-4 ${action.experimentPeriod && action.caution ? "md:grid-cols-2" : ""}`}>
                          {action.experimentPeriod && (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 text-sm font-medium">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                확인 기간
                              </div>
                              <p className="text-sm text-muted-foreground pl-6">{action.experimentPeriod}</p>
                            </div>
                          )}
                          {action.caution && (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 text-sm font-medium">
                                <AlertTriangle className="h-4 w-4 text-amber-500" />
                                주의사항
                              </div>
                              <p className="text-sm text-muted-foreground pl-6">{action.caution}</p>
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
                    /* Quick Action */
                    <>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <ListChecks className="h-4 w-4 text-emerald-500" />
                          실행 액션
                        </div>
                        {action.executionSpec && (
                          <div className="flex flex-wrap gap-2 pl-6 mb-1">
                            {action.executionSpec.videoCount.trim() && (
                              <Badge variant="secondary" className="text-xs">영상 {action.executionSpec.videoCount}</Badge>
                            )}
                            {action.executionSpec.targetElement.trim() && (
                              <Badge variant="secondary" className="text-xs">변경: {action.executionSpec.targetElement}</Badge>
                            )}
                            {action.executionSpec.comparisonBasis.trim() && (
                              <Badge variant="secondary" className="text-xs">기준: {action.executionSpec.comparisonBasis}</Badge>
                            )}
                          </div>
                        )}
                        <ul className="space-y-1 pl-6">
                          {action.howToExecute.map((step, index) => (
                            <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                              <span className={`font-semibold shrink-0 ${colors.text}`}>{index + 1}.</span>
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
                          <p className="text-sm text-muted-foreground pl-6">{action.expectedEffect}</p>
                        </div>
                      )}

                      {action.applicationScope && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <Target className="h-4 w-4 text-primary" />
                            적용 범위
                          </div>
                          <p className="text-sm text-muted-foreground pl-6">{action.applicationScope}</p>
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
