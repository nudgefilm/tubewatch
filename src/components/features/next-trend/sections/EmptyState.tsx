"use client"

import { Lightbulb } from "lucide-react"

export function NextTrendEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Lightbulb className="h-12 w-12 text-muted-foreground/50" />
      <h3 className="mt-4 text-lg font-medium">다음 시도 후보가 없습니다</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        채널 분석이 완료되면 내부 신호 기반 추천이 표시됩니다.
      </p>
    </div>
  )
}
