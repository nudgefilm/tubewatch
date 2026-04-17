"use client"

import { CheckCircle2, AlertCircle, FileText, AlertTriangle, ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { SummaryData } from "@/mocks/analysis"

interface AnalysisSummarySectionProps {
  data: SummaryData
}

export function AnalysisSummarySection({ data }: AnalysisSummarySectionProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">튜브워치 진단 요약</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">

        {/* 1행: 강점 + 개선 포인트 */}
        <div className="grid gap-3 sm:grid-cols-2">

          {/* 강점 */}
          <div className="rounded-lg border p-4">
            <div className="mb-2.5 flex items-center gap-2">
              <div className="flex size-6 items-center justify-center rounded-md bg-emerald-100">
                <CheckCircle2 className="size-4 text-emerald-600" />
              </div>
              <h4 className="text-sm font-semibold">강점</h4>
            </div>
            <ul className="space-y-2">
              {data.strengths.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="mt-2 size-1 shrink-0 rounded-full bg-emerald-500" />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 개선 포인트 */}
          <div className="rounded-lg border p-4">
            <div className="mb-2.5 flex items-center gap-2">
              <div className="flex size-6 items-center justify-center rounded-md bg-amber-100">
                <AlertCircle className="size-4 text-amber-600" />
              </div>
              <h4 className="text-sm font-semibold">개선 포인트</h4>
            </div>
            <ul className="space-y-2">
              {data.improvements.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="mt-2 size-1 shrink-0 rounded-full bg-amber-500" />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* 2행: 근거 요약 + 핵심 병목 */}
        <div className="grid gap-3 sm:grid-cols-2">

          {/* 근거 요약 */}
          <div className="rounded-lg border p-4">
            <div className="mb-2.5 flex items-center gap-2">
              <div className="flex size-6 items-center justify-center rounded-md bg-blue-100">
                <FileText className="size-4 text-blue-600" />
              </div>
              <h4 className="text-sm font-semibold">근거 요약</h4>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {data.evidenceSummary}
            </p>
          </div>

          {/* 핵심 병목 */}
          <div className="rounded-lg border border-rose-200 bg-rose-50/50 p-4">
            <div className="mb-2.5 flex items-center gap-2">
              <div className="flex size-6 items-center justify-center rounded-md bg-rose-100">
                <AlertTriangle className="size-4 text-rose-600" />
              </div>
              <h4 className="text-sm font-semibold text-rose-700">핵심 병목</h4>
            </div>
            <p className="text-sm leading-relaxed text-rose-600">
              {data.keyBottleneck}
            </p>
          </div>

        </div>

        {/* 3행: 다음 단계 (보조 카드) */}
        <div className="rounded-lg border bg-muted/20 p-4">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex size-6 items-center justify-center rounded-md bg-muted">
              <ArrowRight className="size-4 text-foreground" />
            </div>
            <h4 className="text-sm font-semibold">다음 단계</h4>
          </div>
          <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
            분석에서 확인된 신호가 각 기능에서 어떻게 해석되는지 확인하세요
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {data.nextStepLinks.map((link, i) => (
              <div key={i} className="rounded-md bg-background px-3 py-2.5 shadow-sm">
                <span className="block text-sm font-semibold">{link.label}</span>
                <span className="text-sm leading-relaxed text-muted-foreground">
                  {link.description}
                </span>
              </div>
            ))}
          </div>
        </div>

      </CardContent>
    </Card>
  )
}
