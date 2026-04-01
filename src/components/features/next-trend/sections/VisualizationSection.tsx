"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BarChart3, TrendingUp, Home, ExternalLink } from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import type { VisualizationData } from "../mock-data"

type PriorityStatus = VisualizationData["priorityList"][number]["status"]

interface NextTrendVisualizationSectionProps {
  data: VisualizationData
}

const statusColors = {
  executable: "#22c55e",
  observe: "#3b82f6",
  hold: "#9ca3af",
}

const statusLabels = {
  executable: "실행 가능",
  observe: "관찰 필요",
  hold: "보류",
}

export function NextTrendVisualizationSection({ data }: NextTrendVisualizationSectionProps) {
  const chartData: {
    name: string
    fullName: string
    score: number
    status: PriorityStatus
  }[] = data.priorityList.map((item) => ({
    name: item.topic.length > 10 ? item.topic.substring(0, 10) + "..." : item.topic,
    fullName: item.topic,
    score: item.score,
    status: item.status,
  }))

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Priority Bar Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <CardTitle>우선순위 후보 점수</CardTitle>
          </div>
          <CardDescription>
            내부 신호 기반 종합 점수
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] overflow-hidden">
            <ResponsiveContainer width="99%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 5, right: 15, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value) => [`${Number(value)}점`, "점수"]}
                  labelFormatter={(label) => {
                    const item = chartData.find((d) => d.name === label)
                    return item?.fullName || label
                  }}
                />
                <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={statusColors[entry.status]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex items-center justify-center gap-4">
            {Object.entries(statusLabels).map(([key, label]) => (
              <div key={key} className="flex items-center gap-2 text-sm">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: statusColors[key as keyof typeof statusColors] }}
                />
                <span className="text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Internal vs Expansion Comparison */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <CardTitle>내부 vs 확장 비교</CardTitle>
          </div>
          <CardDescription>
            추천 방향 신뢰도 비교
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Internal */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-md bg-green-100 p-1.5 dark:bg-green-900/30">
                  <Home className="h-4 w-4 text-green-700 dark:text-green-400" />
                </div>
                <span className="font-medium">내부 흐름</span>
              </div>
              <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                {data.internalVsExpansion.internal}%
              </span>
            </div>
            <Progress value={data.internalVsExpansion.internal} className="h-3" />
            <p className="text-sm text-muted-foreground">
              기존 성공 패턴 기반의 안정적인 시도 방향
            </p>
          </div>

          {/* Expansion */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-md bg-blue-100 p-1.5 dark:bg-blue-900/30">
                  <ExternalLink className="h-4 w-4 text-blue-700 dark:text-blue-400" />
                </div>
                <span className="font-medium">인접 확장</span>
              </div>
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {data.internalVsExpansion.expansion}%
              </span>
            </div>
            <Progress value={data.internalVsExpansion.expansion} className="h-3" />
            <p className="text-sm text-muted-foreground">
              새로운 시청자 유입 가능성, 보수적 접근 권장
            </p>
          </div>

          {/* Summary Badge */}
          <div className="rounded-lg bg-muted p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">TubeWatch 엔진 분석 결과</span>
              <Badge variant="outline" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                내부 흐름 우선 권장
              </Badge>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              현재 채널 상태에서는 내부 흐름 기반 시도가 더 높은 성공 가능성을 보입니다.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
