"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Layers, TrendingUp, AlertCircle, ArrowUpRight } from "lucide-react"
import { topicClusterData } from "../mock-data"

type Strength = "high" | "medium" | "low"

const strengthConfig: Record<Strength, { label: string; color: string; bg: string }> = {
  high: { label: "강함", color: "text-emerald-600", bg: "bg-emerald-50" },
  medium: { label: "보통", color: "text-amber-600", bg: "bg-amber-50" },
  low: { label: "약함", color: "text-red-600", bg: "bg-red-50" }
}

interface SeoLabTopicClusterSectionProps {
  data?: typeof topicClusterData
}

export function SeoLabTopicClusterSection({ data = topicClusterData }: SeoLabTopicClusterSectionProps) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">주제 클러스터</h2>
        <p className="text-sm text-muted-foreground">채널 주제 구조와 확장 방향 분석</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* 강한 클러스터 */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Layers className="size-4 text-emerald-600" />
              <CardTitle className="text-base">강한 주제 클러스터</CardTitle>
            </div>
            <CardDescription>채널의 핵심 주제 영역</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.strongClusters.map((cluster) => {
                const config = strengthConfig[cluster.strength]
                return (
                  <div key={cluster.topic} className="rounded-lg border border-emerald-100 bg-emerald-50/30 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{cluster.topic}</h4>
                        <Badge className={`${config.bg} ${config.color} border-0`}>
                          {config.label}
                        </Badge>
                      </div>
                      <div className="text-right text-sm">
                        <p className="font-medium">{cluster.videoCount}개 영상</p>
                        <p className="text-xs text-muted-foreground">{(cluster.avgViews / 1000).toFixed(0)}K 평균</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {cluster.relatedTopics.map((topic) => (
                        <Badge key={topic} variant="secondary" className="text-xs">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* 확장 가능 클러스터 */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="size-4 text-blue-600" />
              <CardTitle className="text-base">확장 가능 클러스터</CardTitle>
            </div>
            <CardDescription>성장 잠재력이 높은 주제 영역</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.expandableClusters.map((cluster) => (
                <div key={cluster.topic} className="rounded-lg border border-blue-100 bg-blue-50/30 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{cluster.topic}</h4>
                      <Badge variant="outline" className="border-blue-200 text-blue-600">
                        {cluster.potential === "high" ? "높은 잠재력" : "보통"}
                      </Badge>
                    </div>
                    <ArrowUpRight className="size-4 text-blue-600" />
                  </div>
                  <p className="mb-2 text-sm text-muted-foreground">{cluster.reason}</p>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">현재 {cluster.currentVideos}개</span>
                    <span className="text-blue-600">→</span>
                    <span className="font-medium text-blue-600">{cluster.suggestedVideos}개 권장</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 혼선 클러스터 */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="size-4 text-amber-600" />
              <CardTitle className="text-base">혼선 주제</CardTitle>
            </div>
            <CardDescription>채널 정체성과 맞지 않는 주제</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.confusedClusters.map((cluster) => (
                <div key={cluster.topic} className="rounded-lg border border-amber-100 bg-amber-50/30 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="font-medium">{cluster.topic}</h4>
                    <span className="text-sm text-muted-foreground">{cluster.videoCount}개 영상</span>
                  </div>
                  <p className="mb-2 text-sm text-red-600">{cluster.issue}</p>
                  <Badge variant="outline" className="border-amber-200 text-amber-600 text-xs">
                    권장: {cluster.recommendation}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 정리 우선순위 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">주제 정리 우선순위</CardTitle>
            <CardDescription>주제별 전략적 액션</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.priorityOrder.map((item) => (
                <div key={item.topic} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
                      {item.rank}
                    </div>
                    <span className="font-medium">{item.topic}</span>
                  </div>
                  <Badge variant={
                    item.action === "유지 강화" ? "default" :
                    item.action === "확장" ? "secondary" : "outline"
                  }>
                    {item.action}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
