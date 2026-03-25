"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Sparkles, TrendingUp, Search, Zap } from "lucide-react"
import type { TrendCandidate } from "./mock-data"

interface NextTrendCandidatesSectionProps {
  data: TrendCandidate[]
}

const priorityConfig = {
  high: { label: "높음", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  medium: { label: "중간", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  low: { label: "낮음", className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400" },
}

const statusConfig = {
  executable: { label: "실행 가능", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  observe: { label: "관찰 필요", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  hold: { label: "보류", className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400" },
}

const sourceConfig = {
  dna: { icon: Sparkles, label: "DNA 기반" },
  seo: { icon: Search, label: "SEO 기반" },
  action: { icon: Zap, label: "Action 기반" },
}

export function NextTrendCandidatesSection({ data }: NextTrendCandidatesSectionProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <CardTitle>다음 시도 후보</CardTitle>
        </div>
        <CardDescription>
          내부 데이터 신호 기반으로 도출된 시도 가능 주제 (최대 5개)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((candidate, index) => {
            const SourceIcon = sourceConfig[candidate.source].icon
            return (
              <div
                key={candidate.id}
                className="rounded-lg border bg-card p-4 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {index + 1}
                      </span>
                      <h4 className="font-semibold">{candidate.topic}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">{candidate.reason}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <SourceIcon className="h-3.5 w-3.5" />
                      <span>{candidate.signal}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex gap-2">
                      <Badge variant="outline" className={priorityConfig[candidate.priority].className}>
                        우선순위: {priorityConfig[candidate.priority].label}
                      </Badge>
                      <Badge variant="outline" className={statusConfig[candidate.status].className}>
                        {statusConfig[candidate.status].label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">실행 가능성</span>
                      <Progress value={candidate.feasibility} className="h-2 w-20" />
                      <span className="font-medium">{candidate.feasibility}%</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
