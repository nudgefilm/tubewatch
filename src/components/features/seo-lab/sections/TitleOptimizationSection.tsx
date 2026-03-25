"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowRight, AlertTriangle, CheckCircle2, XCircle, Lightbulb } from "lucide-react"
import { titleOptimizationData } from "../mock-data"

interface SeoLabTitleOptimizationSectionProps {
  data?: typeof titleOptimizationData
}

export function SeoLabTitleOptimizationSection({ data = titleOptimizationData }: SeoLabTitleOptimizationSectionProps) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">제목 구조 개선</h2>
        <p className="text-sm text-muted-foreground">이 채널에서 효과적인 제목 구조 분석</p>
      </div>

      {/* Before / After 카드 */}
      <div className="space-y-4">
        <h3 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <AlertTriangle className="size-4" />
          문제 제목 구조 및 개선안
        </h3>
        <div className="grid gap-4">
          {data.problemTitles.map((item, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="grid gap-4 lg:grid-cols-2">
                  {/* Before */}
                  <div className="rounded-lg border border-red-100 bg-red-50/50 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <XCircle className="size-4 text-red-600" />
                      <span className="text-xs font-medium text-red-600">Before</span>
                    </div>
                    <p className="mb-3 font-medium">{item.original}</p>
                    <div className="flex flex-wrap gap-1">
                      {item.issues.map((issue) => (
                        <Badge key={issue} variant="outline" className="border-red-200 text-red-600 text-xs">
                          {issue}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* After */}
                  <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-emerald-600" />
                      <span className="text-xs font-medium text-emerald-600">After</span>
                    </div>
                    <p className="mb-3 font-medium">{item.improved}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">개선 점수</span>
                      <Progress value={item.improvementScore} className="h-2 w-20" />
                      <span className="text-xs font-medium text-emerald-600">+{item.improvementScore}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* 제목 구조 공식 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="size-4 text-amber-600" />
            <CardTitle className="text-base">검증된 제목 구조 공식</CardTitle>
          </div>
          <CardDescription>이 채널에서 높은 성과를 보인 제목 패턴</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {data.titleFormulas.map((formula) => (
              <div key={formula.name} className="rounded-lg border p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="font-medium">{formula.name}</h4>
                  <Badge variant="secondary">{formula.effectiveness}% 효과</Badge>
                </div>
                <div className="mb-3 rounded bg-muted/50 p-2">
                  <code className="text-sm text-muted-foreground">{formula.formula}</code>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <ArrowRight className="size-3 text-muted-foreground" />
                  <span className="text-muted-foreground">예시:</span>
                  <span className="font-medium">{formula.example}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 피해야 할 구조 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <XCircle className="size-4 text-red-600" />
            <CardTitle className="text-base">피해야 할 제목 구조</CardTitle>
          </div>
          <CardDescription>이 채널에서 성과가 낮았던 제목 패턴</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            {data.avoidStructures.map((item) => (
              <div key={item.structure} className="rounded-lg border border-red-100 bg-red-50/30 p-4">
                <p className="mb-1 text-sm font-medium text-red-700">{item.structure}</p>
                <p className="mb-2 text-xs text-muted-foreground">예: {item.example}</p>
                <Badge variant="outline" className="border-red-200 text-red-600 text-xs">
                  {item.reason}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
