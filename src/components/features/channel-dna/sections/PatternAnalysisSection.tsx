"use client"

import { TrendingUp, TrendingDown, FileText, Layout, FolderTree, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import type { ChannelDnaData } from "../mock-data"

interface DnaPatternAnalysisSectionProps {
  data: ChannelDnaData["patternAnalysis"]
}

export function DnaPatternAnalysisSection({ data }: DnaPatternAnalysisSectionProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold">반복 패턴 분석</h2>
        <Badge variant="outline" className="text-xs">
          Pattern Detection
        </Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* 고성과 반복 패턴 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="size-4 text-emerald-500" />
              고성과 공통점
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.highPerformancePatterns.map((pattern) => (
              <div
                key={pattern.pattern}
                className="rounded-lg border bg-emerald-500/5 p-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{pattern.pattern}</span>
                  <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600">
                    {pattern.frequency}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{pattern.description}</p>
                {pattern.examples.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {pattern.examples.map((ex) => (
                      <Badge key={ex} variant="outline" className="text-xs">
                        {ex}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 저성과 반복 패턴 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingDown className="size-4 text-red-500" />
              저성과 반복 요소
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.lowPerformancePatterns.map((pattern) => (
              <div
                key={pattern.pattern}
                className="rounded-lg border bg-red-500/5 p-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{pattern.pattern}</span>
                  <Badge variant="secondary" className="bg-red-500/10 text-red-600">
                    {pattern.frequency}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{pattern.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* 구조적 패턴 상세 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* 반복 제목 구조 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <FileText className="size-4" />
              반복 제목 구조
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.titleStructure.dominant !== "-" ? (
              <>
                <p className="text-sm font-medium">{data.titleStructure.dominant}</p>
                {data.titleStructure.consistency > 0 && (
                  <div className="mt-2 flex items-center gap-2">
                    <Progress value={data.titleStructure.consistency} className="h-1.5 flex-1" />
                    <span className="text-xs text-muted-foreground">
                      {data.titleStructure.consistency}%
                    </span>
                  </div>
                )}
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-muted-foreground">미산출</p>
                <p className="mt-1 text-xs text-muted-foreground">제목 패턴 데이터가 없습니다</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* 포맷 반복성 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Layout className="size-4" />
              포맷 반복성
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.formatRepetition.dominant !== "-" ? (
              <>
                <p className="text-sm font-medium">{data.formatRepetition.dominant}</p>
                {data.formatRepetition.consistency > 0 ? (
                  <div className="mt-2 flex items-center gap-2">
                    <Progress value={data.formatRepetition.consistency} className="h-1.5 flex-1" />
                    <span className="text-xs text-muted-foreground">
                      {data.formatRepetition.consistency}%
                    </span>
                  </div>
                ) : (
                  <p className="mt-1 text-xs text-muted-foreground">일관성 데이터 미산출</p>
                )}
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-muted-foreground">미산출</p>
                <p className="mt-1 text-xs text-muted-foreground">포맷 반복 데이터가 없습니다</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* 주제 클러스터 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <FolderTree className="size-4" />
              주제 클러스터
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {data.topicClusters.length > 0 ? (
              data.topicClusters.slice(0, 3).map((cluster) => (
                <div key={cluster.topic} className="flex items-center justify-between text-sm">
                  <span className="truncate">{cluster.topic}</span>
                  <Badge variant="outline" className="ml-2 text-xs">
                    {cluster.weight}%
                  </Badge>
                </div>
              ))
            ) : (
              <>
                <p className="text-sm font-medium text-muted-foreground">미산출</p>
                <p className="text-xs text-muted-foreground">주제 분류 데이터가 없습니다</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* 업로드 주기 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Clock className="size-4" />
              업로드 주기
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.uploadCycleImpact.currentCycle !== "-" ? (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium">{data.uploadCycleImpact.currentCycle}</span>
                  <span className="text-xs text-muted-foreground">
                    (최적: {data.uploadCycleImpact.optimalCycle})
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{data.uploadCycleImpact.note}</p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-muted-foreground">미산출</p>
                <p className="mt-1 text-xs text-muted-foreground">{data.uploadCycleImpact.note}</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
