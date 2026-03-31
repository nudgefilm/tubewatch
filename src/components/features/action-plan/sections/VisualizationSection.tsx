"use client"

import { ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface PriorityMatrixItem {
  action: string
  impact: number
  difficulty: number
  priority: string
}

interface ExecutionFlowItem {
  step: number
  action: string
  duration: string
}

interface VisualizationData {
  priorityMatrix: PriorityMatrixItem[]
  executionFlow: ExecutionFlowItem[]
}

interface ActionPlanVisualizationProps {
  data: VisualizationData
}

const priorityColors: Record<string, string> = {
  P1: "hsl(var(--destructive))",
  P2: "#f59e0b",
  P3: "#3b82f6",
}

const chartConfig = {
  impact: {
    label: "영향도",
  },
  difficulty: {
    label: "난이도",
  },
}

export function ActionPlanVisualization({ data }: ActionPlanVisualizationProps) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold">전략 시각화</h2>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* 영향도 vs 난이도 매트릭스 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">영향도 vs 난이도 매트릭스</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] w-full overflow-hidden">
              <ResponsiveContainer width="99%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    type="number" 
                    dataKey="difficulty" 
                    name="난이도" 
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                    className="text-xs"
                    label={{ value: '난이도', position: 'bottom', offset: 0 }}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="impact" 
                    name="영향도" 
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                    className="text-xs"
                    label={{ value: '영향도', angle: -90, position: 'left', offset: 10 }}
                  />
                  <ChartTooltip
                    content={((props: { active?: boolean; payload?: unknown[] }) => {
                      const { active, payload } = props
                      if (active && payload && payload.length) {
                        const data = (payload[0] as { payload: PriorityMatrixItem })
                          .payload as PriorityMatrixItem
                        return (
                          <div className="rounded-lg border bg-background p-2 shadow-sm">
                            <div className="font-medium">{data.action}</div>
                            <div className="text-xs text-muted-foreground">
                              영향도: {data.impact}% / 난이도: {data.difficulty}%
                            </div>
                            <Badge className="mt-1" variant="secondary">{data.priority}</Badge>
                          </div>
                        )
                      }
                      return null
                    }) as any}
                  />
                  <Scatter data={data.priorityMatrix} fill="#8884d8">
                    {data.priorityMatrix.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={priorityColors[entry.priority]}
                        r={8}
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </ChartContainer>

            {/* 범례 */}
            <div className="flex justify-center gap-4 mt-2">
              {Object.entries(priorityColors).map(([priority, color]) => (
                <div key={priority} className="flex items-center gap-1 text-xs">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: color }}
                  />
                  <span>{priority}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 실행 흐름 다이어그램 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">실행 흐름</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {data.executionFlow.map((item, index) => (
                <div key={item.step} className="flex items-center gap-3">
                  {/* Step 번호 */}
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">
                    {item.step}
                  </div>

                  {/* 액션 카드 */}
                  <div className="flex-1 p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{item.action}</p>
                      <Badge variant="outline" className="text-xs">
                        {item.duration}
                      </Badge>
                    </div>
                  </div>

                  {/* 화살표 (마지막 제외) */}
                  {index < data.executionFlow.length - 1 && (
                    <div className="absolute left-4 mt-12">
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* 타임라인 요약 */}
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">총 실행 기간</span>
                <span className="font-medium">4주</span>
              </div>
              <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-destructive via-amber-500 to-blue-500" style={{ width: '100%' }} />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>1주차</span>
                <span>2주차</span>
                <span>3주차</span>
                <span>4주차</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
