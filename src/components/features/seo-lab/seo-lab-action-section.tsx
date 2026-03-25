"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Video, FileText, CheckSquare, ThumbsUp, ThumbsDown } from "lucide-react"
import { seoActionsData } from "./mock-data"

type Performance = "high" | "medium" | "low"

const performanceConfig: Record<Performance, { label: string; color: string; bg: string }> = {
  high: { label: "높음", color: "text-emerald-600", bg: "bg-emerald-50" },
  medium: { label: "보통", color: "text-amber-600", bg: "bg-amber-50" },
  low: { label: "낮음", color: "text-red-600", bg: "bg-red-50" }
}

interface SeoLabActionSectionProps {
  data?: typeof seoActionsData
}

export function SeoLabActionSection({ data = seoActionsData }: SeoLabActionSectionProps) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">실행 액션</h2>
        <p className="text-sm text-muted-foreground">SEO 최적화를 위한 구체적 실행 가이드</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* 키워드 기반 영상 아이디어 */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Video className="size-4 text-primary" />
              <CardTitle className="text-base">키워드 기반 영상 아이디어</CardTitle>
            </div>
            <CardDescription>분석 데이터 기반 추천 영상 주제</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.videoIdeas.map((idea, index) => {
                const config = performanceConfig[idea.expectedPerformance]
                return (
                  <div key={index} className="rounded-lg border p-4">
                    <div className="mb-2 flex items-start justify-between">
                      <h4 className="font-medium leading-tight">{idea.title}</h4>
                      <Badge className={`${config.bg} ${config.color} border-0 ml-2 shrink-0`}>
                        예상 {config.label}
                      </Badge>
                    </div>
                    <div className="mb-2 flex flex-wrap gap-1">
                      {idea.keywords.map((kw) => (
                        <Badge key={kw} variant="secondary" className="text-xs">
                          {kw}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">{idea.basis}</p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* 제목 템플릿 */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <FileText className="size-4 text-primary" />
              <CardTitle className="text-base">제목 자동 생성 템플릿</CardTitle>
            </div>
            <CardDescription>검증된 구조 기반 제목 공식</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.titleTemplates.map((template, index) => (
                <div key={index} className="rounded-lg border p-4">
                  <div className="mb-2 rounded bg-muted/50 p-2">
                    <code className="text-sm">{template.template}</code>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">적용 예:</span>
                    <span className="font-medium">{template.filledExample}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 적용 체크리스트 */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CheckSquare className="size-4 text-primary" />
              <CardTitle className="text-base">제목 작성 체크리스트</CardTitle>
            </div>
            <CardDescription>영상 업로드 전 확인 사항</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.checklistItems.map((item, index) => (
                <div key={index} className="flex items-center gap-3 rounded-lg border p-3">
                  <Checkbox id={`check-${index}`} />
                  <label htmlFor={`check-${index}`} className="flex-1 text-sm cursor-pointer">
                    {item.item}
                  </label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 키워드 추천/비추천 */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <ThumbsUp className="size-4 text-emerald-600" />
                <CardTitle className="text-base">사용 권장 키워드</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.recommendedKeywords.map((kw) => (
                  <div key={kw.keyword} className="flex items-center justify-between rounded-lg border border-emerald-100 bg-emerald-50/30 p-3">
                    <span className="font-medium">{kw.keyword}</span>
                    <span className="text-xs text-muted-foreground">{kw.reason}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <ThumbsDown className="size-4 text-red-600" />
                <CardTitle className="text-base">사용 자제 키워드</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.avoidKeywords.map((kw) => (
                  <div key={kw.keyword} className="flex items-center justify-between rounded-lg border border-red-100 bg-red-50/30 p-3">
                    <span className="font-medium">{kw.keyword}</span>
                    <span className="text-xs text-muted-foreground">{kw.reason}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
