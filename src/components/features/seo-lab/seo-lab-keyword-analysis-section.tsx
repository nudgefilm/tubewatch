"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, TrendingDown, Sparkles, AlertCircle } from "lucide-react"
import { keywordAnalysisData } from "./mock-data"

type Performance = "high" | "medium" | "low"

const performanceConfig: Record<Performance, { label: string; color: string; bg: string }> = {
  high: { label: "고성과", color: "text-emerald-600", bg: "bg-emerald-50" },
  medium: { label: "보통", color: "text-amber-600", bg: "bg-amber-50" },
  low: { label: "저성과", color: "text-red-600", bg: "bg-red-50" }
}

interface SeoLabKeywordAnalysisSectionProps {
  data?: typeof keywordAnalysisData
}

export function SeoLabKeywordAnalysisSection({ data = keywordAnalysisData }: SeoLabKeywordAnalysisSectionProps) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">키워드 분석</h2>
        <p className="text-sm text-muted-foreground">성과 기반 키워드 구조 분석</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* 상위 키워드 */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="size-4 text-emerald-600" />
              <CardTitle className="text-base">상위 성과 키워드</CardTitle>
            </div>
            <CardDescription>높은 조회수를 기록한 핵심 키워드</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.topKeywords.map((kw) => {
                const config = performanceConfig[kw.performance]
                return (
                  <div key={kw.keyword} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <Badge className={`${config.bg} ${config.color} border-0`}>
                        {kw.frequency}회
                      </Badge>
                      <span className="font-medium">{kw.keyword}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{(kw.avgViews / 1000).toFixed(0)}K</p>
                      <p className="text-xs text-muted-foreground">평균 조회</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* 저성과 반복 키워드 */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <TrendingDown className="size-4 text-red-600" />
              <CardTitle className="text-base">저성과 반복 키워드</CardTitle>
            </div>
            <CardDescription>사용 빈도 대비 성과가 낮은 키워드</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.lowPerformanceKeywords.map((kw) => (
                <div key={kw.keyword} className="flex items-center justify-between rounded-lg border border-red-100 bg-red-50/50 p-3">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="border-red-200 text-red-600">
                      {kw.frequency}회
                    </Badge>
                    <span className="font-medium">{kw.keyword}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-red-600">{(kw.avgViews / 1000).toFixed(0)}K</p>
                    <p className="text-xs text-muted-foreground">평균 조회</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 미활용 키워드 */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-blue-600" />
              <CardTitle className="text-base">미활용 키워드</CardTitle>
            </div>
            <CardDescription>채널에 적합하지만 아직 사용하지 않은 키워드</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.unusedKeywords.map((kw) => (
                <div key={kw.keyword} className="flex items-center justify-between rounded-lg border border-blue-100 bg-blue-50/50 p-3">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="border-blue-200 text-blue-600">
                      {kw.potential === "high" ? "높음" : "보통"}
                    </Badge>
                    <span className="font-medium">{kw.keyword}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{kw.reason}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 키워드 공백 영역 */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="size-4 text-amber-600" />
              <CardTitle className="text-base">키워드 공백 영역</CardTitle>
            </div>
            <CardDescription>커버리지가 부족한 주제 영역</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.keywordGaps.map((gap) => (
                <div key={gap.area} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{gap.area}</span>
                    <span className="text-xs text-muted-foreground">
                      {gap.currentCoverage}% → {gap.recommendedCoverage}% 권장
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <Progress value={gap.currentCoverage} className="h-2 flex-1" />
                    <div className="h-2 w-px bg-amber-500" style={{ marginLeft: `${gap.recommendedCoverage - gap.currentCoverage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 브랜드 vs 일반 키워드 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">브랜드 vs 일반 키워드</CardTitle>
          <CardDescription>키워드 유형별 분포</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="mb-2 flex justify-between text-sm">
                <span>브랜드 키워드</span>
                <span className="font-medium">{data.brandVsGeneral.ratio.brand}%</span>
              </div>
              <Progress value={data.brandVsGeneral.ratio.brand} className="h-3" />
              <div className="mt-2 flex flex-wrap gap-2">
                {data.brandVsGeneral.brand.map((kw) => (
                  <Badge key={kw.keyword} variant="secondary">{kw.keyword}</Badge>
                ))}
              </div>
            </div>
            <div className="h-24 w-px bg-border" />
            <div className="flex-1">
              <div className="mb-2 flex justify-between text-sm">
                <span>일반 키워드</span>
                <span className="font-medium">{data.brandVsGeneral.ratio.general}%</span>
              </div>
              <Progress value={data.brandVsGeneral.ratio.general} className="h-3" />
              <div className="mt-2 flex flex-wrap gap-2">
                {data.brandVsGeneral.general.map((kw) => (
                  <Badge key={kw.keyword} variant="outline">{kw.keyword}</Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
