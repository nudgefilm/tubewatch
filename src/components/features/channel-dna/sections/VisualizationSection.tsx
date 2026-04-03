"use client"

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SegmentGauge } from "@/components/ui/SegmentGauge"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import type { ChannelDnaData } from "../mock-data"

interface DnaVisualizationSectionProps {
  data: ChannelDnaData["visualization"]
}

export function DnaVisualizationSection({ data }: DnaVisualizationSectionProps) {
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
              <SegmentGauge score={data.strengthVsWeakness.strengths} label={false} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-red-600">약점 점수</span>
                <span className="font-semibold">{data.strengthVsWeakness.weaknesses}</span>
              </div>
              <SegmentGauge score={data.strengthVsWeakness.weaknesses} variant="destructive" label={false} />
            </div>
            <div className={`rounded-lg border p-3 text-center ${data.strengthVsWeakness.strengths > data.strengthVsWeakness.weaknesses ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20" : "border-rose-200 bg-rose-50/50 dark:border-rose-800 dark:bg-rose-950/20"}`}>
              <span className={`text-2xl font-bold ${data.strengthVsWeakness.strengths > data.strengthVsWeakness.weaknesses ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"}`}>
                {data.strengthVsWeakness.strengths > data.strengthVsWeakness.weaknesses ? "+" : ""}
                {data.strengthVsWeakness.strengths - data.strengthVsWeakness.weaknesses}
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
                <SegmentGauge score={item.strength} label={false} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
