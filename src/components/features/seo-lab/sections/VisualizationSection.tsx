"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
} from "recharts"
import { seoVisualizationData } from "../mock-data"

type Category = "strong" | "medium" | "weak"

const categoryConfig: Record<Category, { color: string; bg: string }> = {
  strong: { color: "hsl(var(--chart-1))", bg: "bg-emerald-500" },
  medium: { color: "hsl(var(--chart-2))", bg: "bg-amber-500" },
  weak: { color: "hsl(var(--chart-3))", bg: "bg-red-500" }
}

interface SeoLabVisualizationSectionProps {
  data?: typeof seoVisualizationData
}

export function SeoLabVisualizationSection({ data = seoVisualizationData }: SeoLabVisualizationSectionProps) {
  const chartConfig = {
    score: {
      label: "점수",
      color: "hsl(var(--chart-1))",
    },
    performance: {
      label: "성과",
      color: "hsl(var(--chart-2))",
    },
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">SEO 시각화</h2>
        <p className="text-sm text-muted-foreground">키워드 및 제목 구조 시각적 분석</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* 키워드 강도 맵 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">키워드 강도 맵</CardTitle>
            <CardDescription>키워드별 성과 강도 분포</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.keywordStrengthMap.map((item) => {
                const config = categoryConfig[item.category]
                return (
                  <div key={item.keyword} className="flex items-center gap-3">
                    <span className="w-24 text-sm font-medium truncate">{item.keyword}</span>
                    <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${config.bg} rounded-full transition-all`}
                        style={{ width: `${item.strength}%` }}
                      />
                    </div>
                    <span className="w-12 text-right text-sm font-medium">{item.strength}%</span>
                  </div>
                )
              })}
            </div>
            <div className="mt-4 flex items-center justify-center gap-6">
              <div className="flex items-center gap-2">
                <div className="size-3 rounded-full bg-emerald-500" />
                <span className="text-xs text-muted-foreground">강함</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="size-3 rounded-full bg-amber-500" />
                <span className="text-xs text-muted-foreground">보통</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="size-3 rounded-full bg-red-500" />
                <span className="text-xs text-muted-foreground">약함</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 클러스터 성과 레이더 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">주제 클러스터 성과</CardTitle>
            <CardDescription>클러스터별 성과 점수 비교</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[280px] w-full">
              <RadarChart data={data.clusterPerformanceRadar}>
                <PolarGrid />
                <PolarAngleAxis dataKey="cluster" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Radar
                  name="점수"
                  dataKey="score"
                  stroke="hsl(var(--chart-1))"
                  fill="hsl(var(--chart-1))"
                  fillOpacity={0.5}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
              </RadarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* 제목 구조 분포 */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">제목 구조 분포 및 성과</CardTitle>
            <CardDescription>사용 빈도와 성과 비교</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[280px] w-full">
              <BarChart data={data.titleStructureDistribution} layout="vertical">
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                <YAxis dataKey="structure" type="category" width={100} tick={{ fontSize: 11 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="percentage" name="사용 비율" radius={[0, 4, 4, 0]}>
                  {data.titleStructureDistribution.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.performance >= 80 ? "hsl(var(--chart-1))" : 
                            entry.performance >= 60 ? "hsl(var(--chart-2))" : "hsl(var(--chart-3))"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
            <div className="mt-4 grid grid-cols-5 gap-2 text-center">
              {data.titleStructureDistribution.map((item) => (
                <div key={item.structure} className="rounded-lg border p-2">
                  <p className="text-xs text-muted-foreground">{item.structure}</p>
                  <p className="text-lg font-bold">{item.performance}%</p>
                  <p className="text-xs text-muted-foreground">성과</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
