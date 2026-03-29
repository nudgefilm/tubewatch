"use client"

import { AlertCircle, BarChart3, FileQuestion } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface AnalysisEmptyStateProps {
  type: "no-data" | "insufficient-samples" | "limited-analysis"
  title?: string
  description?: string
}

const defaultContent = {
  "no-data": {
    icon: FileQuestion,
    title: "최근 데이터 부족",
    description: "분석에 필요한 최근 업로드 데이터가 충분하지 않습니다. 영상이 업로드되면 자동으로 분석이 시작됩니다.",
  },
  "insufficient-samples": {
    icon: BarChart3,
    title: "비교 가능한 표본이 부족합니다",
    description: "상위/하위 성과 비교를 위해 최소 10개 이상의 영상이 필요합니다.",
  },
  "limited-analysis": {
    icon: AlertCircle,
    title: "일부 해석이 제한됩니다",
    description: "최근 업로드 수가 적어 일부 지표의 신뢰도가 낮을 수 있습니다.",
  },
}

export function AnalysisEmptyState({
  type,
  title,
  description,
}: AnalysisEmptyStateProps) {
  const content = defaultContent[type]
  const Icon = content.icon

  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-8 text-center">
        <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-muted">
          <Icon className="size-5 text-muted-foreground" />
        </div>
        <h3 className="mb-1.5 text-sm font-medium text-foreground">
          {title || content.title}
        </h3>
        <p className="max-w-sm text-xs text-muted-foreground leading-relaxed">
          {description || content.description}
        </p>
      </CardContent>
    </Card>
  )
}
