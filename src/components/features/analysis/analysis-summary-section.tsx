"use client"

import { CheckCircle2, AlertCircle, FileText, AlertTriangle, ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { SummaryData } from "./mock-data"

interface AnalysisSummarySectionProps {
  data: SummaryData
}

export function AnalysisSummarySection({ data }: AnalysisSummarySectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">종합 해석</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Strengths */}
          <div className="rounded-lg border p-4">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-md bg-emerald-100">
                <CheckCircle2 className="size-4 text-emerald-600" />
              </div>
              <h4 className="text-sm font-medium">강점</h4>
            </div>
            <ul className="space-y-2">
              {data.strengths.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="mt-1.5 size-1 shrink-0 rounded-full bg-emerald-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Improvements */}
          <div className="rounded-lg border p-4">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-md bg-amber-100">
                <AlertCircle className="size-4 text-amber-600" />
              </div>
              <h4 className="text-sm font-medium">개선 포인트</h4>
            </div>
            <ul className="space-y-2">
              {data.improvements.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="mt-1.5 size-1 shrink-0 rounded-full bg-amber-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Evidence & Bottleneck */}
          <div className="space-y-4">
            {/* Evidence Summary */}
            <div className="rounded-lg border p-4">
              <div className="mb-2 flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-md bg-blue-100">
                  <FileText className="size-4 text-blue-600" />
                </div>
                <h4 className="text-sm font-medium">근거 요약</h4>
              </div>
              <p className="text-sm text-muted-foreground">{data.evidenceSummary}</p>
            </div>

            {/* Key Bottleneck */}
            <div className="rounded-lg border border-rose-200 bg-rose-50/50 p-4">
              <div className="mb-2 flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-md bg-rose-100">
                  <AlertTriangle className="size-4 text-rose-600" />
                </div>
                <h4 className="text-sm font-medium text-rose-700">핵심 병목</h4>
              </div>
              <p className="text-sm text-rose-600">{data.keyBottleneck}</p>
            </div>
          </div>

          {/* Next Steps */}
          <div className="rounded-lg border p-4">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-md bg-muted">
                <ArrowRight className="size-4 text-foreground" />
              </div>
              <h4 className="text-sm font-medium">다음 단계</h4>
            </div>
            <ul className="space-y-3">
              {data.nextStepLinks.map((link, i) => (
                <li key={i} className="rounded-md bg-muted/50 p-2">
                  <span className="block text-sm font-medium">{link.label}</span>
                  <span className="text-xs text-muted-foreground">{link.description}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
