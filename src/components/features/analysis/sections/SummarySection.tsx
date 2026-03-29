"use client"

import { CheckCircle2, AlertCircle, FileText, AlertTriangle, ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { SummaryData } from "../mock-data"

interface AnalysisSummarySectionProps {
  data: SummaryData
}

export function AnalysisSummarySection({ data }: AnalysisSummarySectionProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">종합 해석</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Strengths */}
          <div className="rounded-lg border p-4">
            <div className="mb-1.5 flex items-center gap-2">
              <div className="flex size-6 items-center justify-center rounded-md bg-emerald-100">
                <CheckCircle2 className="size-4 text-emerald-600" />
              </div>
              <h4 className="text-xs font-semibold">강점</h4>
            </div>
            <p className="mb-2.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              반복적으로 성과를 만들어내고 있는 핵심 패턴입니다
            </p>
            <ul className="space-y-1.5">
              {data.strengths.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <span className="mt-1.5 size-1 shrink-0 rounded-full bg-emerald-500" />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Improvements */}
          <div className="rounded-lg border p-4">
            <div className="mb-1.5 flex items-center gap-2">
              <div className="flex size-6 items-center justify-center rounded-md bg-amber-100">
                <AlertCircle className="size-4 text-amber-600" />
              </div>
              <h4 className="text-xs font-semibold">개선 포인트</h4>
            </div>
            <p className="mb-2.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              현재 성과에 영향을 주고 있는 구조적 취약점입니다
            </p>
            <ul className="space-y-1.5">
              {data.improvements.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <span className="mt-1.5 size-1 shrink-0 rounded-full bg-amber-500" />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Evidence & Bottleneck — flex-col h-full so both panels share height */}
          <div className="flex flex-col gap-3">
            {/* Evidence Summary */}
            <div className="flex-1 rounded-lg border p-4">
              <div className="mb-1.5 flex items-center gap-2">
                <div className="flex size-6 items-center justify-center rounded-md bg-blue-100">
                  <FileText className="size-4 text-blue-600" />
                </div>
                <h4 className="text-xs font-semibold">근거 요약</h4>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {data.evidenceSummary}
              </p>
            </div>

            {/* Key Bottleneck */}
            <div className="flex-1 rounded-lg border border-rose-200 bg-rose-50/50 p-4">
              <div className="mb-1.5 flex items-center gap-2">
                <div className="flex size-6 items-center justify-center rounded-md bg-rose-100">
                  <AlertTriangle className="size-4 text-rose-600" />
                </div>
                <h4 className="text-xs font-semibold text-rose-700">핵심 병목</h4>
              </div>
              <p className="text-xs leading-relaxed text-rose-600">
                {data.keyBottleneck}
              </p>
            </div>
          </div>

          {/* Next Steps */}
          <div className="rounded-lg border p-4">
            <div className="mb-1.5 flex items-center gap-2">
              <div className="flex size-6 items-center justify-center rounded-md bg-muted">
                <ArrowRight className="size-4 text-foreground" />
              </div>
              <h4 className="text-xs font-semibold">다음 단계</h4>
            </div>
            <p className="mb-2.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              현재 채널 구조를 더 깊이 파악할 수 있는 분석 페이지입니다
            </p>
            <ul className="space-y-2">
              {data.nextStepLinks.map((link, i) => (
                <li key={i} className="rounded-md bg-muted/50 px-3 py-2">
                  <span className="block text-xs font-semibold">{link.label}</span>
                  <span className="text-xs leading-relaxed text-muted-foreground">
                    {link.description}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
