"use client"

import { TrendingUp, Clock, Link2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SegmentGauge } from "@/components/ui/SegmentGauge"

interface TrackingKPI {
  id: string
  name: string
  baseline: number
  target: number
  current: number
  unit: string
  period: string
  linkedAction: string
}

interface ActionPlanTrackingProps {
  data: TrackingKPI[]
}

export function ActionPlanTrackingSection({ data }: ActionPlanTrackingProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">성과 추적</h2>
        <p className="text-sm text-muted-foreground">
          실험 기간 동안 KPI 변화 모니터링
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {data.map((kpi) => {
          const progress = ((kpi.current - kpi.baseline) / (kpi.target - kpi.baseline)) * 100
          const progressValue = Math.max(0, Math.min(100, progress))
          const changeValue = kpi.current - kpi.baseline
          const changePercent = ((changeValue / kpi.baseline) * 100).toFixed(1)
          const isPositive = changeValue >= 0

          return (
            <Card key={kpi.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{kpi.name}</CardTitle>
                  <Badge variant="outline" className="gap-1 text-xs">
                    <Link2 className="h-3 w-3" />
                    {kpi.linkedAction}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 현재 값 */}
                <div className="text-center">
                  <p className="text-3xl font-bold">
                    {Math.round(kpi.current).toLocaleString()}
                    <span className="text-lg text-muted-foreground ml-1">{kpi.unit}</span>
                  </p>
                  <p className={`text-sm ${isPositive ? "text-emerald-600" : "text-destructive"}`}>
                    {isPositive ? "+" : ""}{changePercent}% from baseline
                  </p>
                </div>

                {/* 진행률 */}
                <div className="space-y-2">
                  <SegmentGauge score={progressValue} />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>기준: {Math.round(kpi.baseline).toLocaleString()}{kpi.unit}</span>
                    <span>목표: {Math.round(kpi.target).toLocaleString()}{kpi.unit}</span>
                  </div>
                </div>

                {/* 관찰 기간 */}
                <div className="flex items-center justify-between pt-2 border-t text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>관찰 기간</span>
                  </div>
                  <span className="font-medium">{kpi.period}</span>
                </div>

                {/* 메모 영역 (placeholder) */}
                <div className="p-2 bg-muted/50 rounded text-xs text-muted-foreground">
                  실험 결과 메모 영역
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </section>
  )
}
