"use client"

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import type { ChannelDnaData } from "../mock-data"

interface DnaVisualizationSectionProps {
  data: ChannelDnaData["visualization"]
  distribution: ChannelDnaData["structureSummary"]["performanceDistribution"]
}

export function DnaVisualizationSection({ data, distribution }: DnaVisualizationSectionProps) {
  const radarConfig = {
    value: {
      label: "점수",
      color: "hsl(var(--primary))",
    },
  }

  const barConfig = {
    strength: {
      label: "강도",
      color: "hsl(var(--primary))",
    },
  }

  const distributionConfig = {
    count: {
      label: "영상 수",
      color: "hsl(var(--primary))",
    },
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold">시각화</h2>
        <Badge variant="outline" className="text-xs">
          Visual Analytics
        </Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* 성과 구조 레이더 차트 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">성과 구조 레이더</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={radarConfig} className="mx-auto aspect-square h-[280px]">
              <RadarChart data={data.radarChart}>
                <PolarGrid strokeDasharray="3 3" />
                <PolarAngleAxis
                  dataKey="axis"
                  tick={{ fontSize: 11 }}
                  className="text-muted-foreground"
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 100]}
                  tick={{ fontSize: 10 }}
                  tickCount={5}
                />
                <Radar
                  name="점수"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
              </RadarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* 성과 분포 히스토그램 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">성과 분포</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={distributionConfig} className="h-[280px]">
              <BarChart data={distribution} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <XAxis
                  dataKey="range"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                  formatter={(value, name) => [`${value}개`, "영상 수"]}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {distribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={`hsl(var(--primary) / ${0.4 + index * 0.15})`}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* 강점 vs 약점 비교 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">강점 vs 약점</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-emerald-600">강점 점수</span>
                <span className="font-semibold">{data.strengthVsWeakness.strengths}</span>
              </div>
              <Progress
                value={data.strengthVsWeakness.strengths}
                className="h-3 [&>div]:bg-emerald-500"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-red-600">약점 점수</span>
                <span className="font-semibold">{data.strengthVsWeakness.weaknesses}</span>
              </div>
              <Progress
                value={data.strengthVsWeakness.weaknesses}
                className="h-3 [&>div]:bg-red-500"
              />
            </div>
            <div className="rounded-lg border bg-muted/30 p-3 text-center">
              <span className="text-2xl font-bold text-primary">
                +{data.strengthVsWeakness.strengths - data.strengthVsWeakness.weaknesses}
              </span>
              <p className="text-xs text-muted-foreground">강점 우위</p>
            </div>
          </CardContent>
        </Card>

        {/* 반복 패턴 강도 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">반복 패턴 강도</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.patternStrength.map((item) => (
              <div key={item.pattern} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>{item.pattern}</span>
                  <Badge
                    variant={item.strength >= 70 ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {item.strength}%
                  </Badge>
                </div>
                <Progress value={item.strength} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
