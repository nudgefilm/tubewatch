"use client"

import { TrendingUp, Target, Shield, BarChart3 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import type { ChannelDnaData } from "./mock-data"

interface DnaStructureSummarySectionProps {
  data: ChannelDnaData["structureSummary"]
}

export function DnaStructureSummarySection({ data }: DnaStructureSummarySectionProps) {
  const getStabilityColor = (stability: string) => {
    switch (stability) {
      case "안정":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
      case "불안정":
        return "bg-amber-500/10 text-amber-600 border-amber-500/20"
      case "취약":
        return "bg-red-500/10 text-red-600 border-red-500/20"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold">성과 구조 요약</h2>
        <Badge variant="outline" className="text-xs">
          DNA Core
        </Badge>
      </div>

      {/* KPI Cards Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* 히트 영상 의존도 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              히트 영상 의존도
            </CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.hitDependency}%</div>
            <Progress value={data.hitDependency} className="mt-2 h-1.5" />
            <p className="mt-1 text-xs text-muted-foreground">
              {data.hitDependency < 50 ? "안정적 분산 구조" : "히트 의존 구조"}
            </p>
          </CardContent>
        </Card>

        {/* 성장 방식 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              성장 방식
            </CardTitle>
            <Target className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.growthType}</div>
            <div className="mt-2 flex flex-wrap gap-1">
              {data.growthAxis.map((axis) => (
                <Badge key={axis} variant="secondary" className="text-xs">
                  {axis}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 구조 안정성 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              구조 안정성
            </CardTitle>
            <Shield className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{data.structureStabilityScore}</span>
              <Badge className={getStabilityColor(data.structureStability)}>
                {data.structureStability}
              </Badge>
            </div>
            <Progress value={data.structureStabilityScore} className="mt-2 h-1.5" />
          </CardContent>
        </Card>

        {/* 성과 분포 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              성과 분포
            </CardTitle>
            <BarChart3 className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex h-12 items-end gap-1">
              {data.performanceDistribution.map((item) => (
                <div
                  key={item.range}
                  className="flex-1 rounded-t bg-primary/80 transition-all hover:bg-primary"
                  style={{ height: `${item.percentage * 1.2}%` }}
                  title={`${item.range}: ${item.count}개 (${item.percentage}%)`}
                />
              ))}
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
              <span>0</span>
              <span>50K+</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 요약 카드 */}
      <Card className="bg-muted/30">
        <CardContent className="py-4">
          <p className="text-sm leading-relaxed text-foreground/80">{data.summaryText}</p>
        </CardContent>
      </Card>
    </section>
  )
}
