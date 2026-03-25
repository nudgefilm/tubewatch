"use client"

import { Zap } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export function ActionPlanEmptyState() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-16">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Zap className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">실행 전략 데이터 없음</h3>
        <p className="text-muted-foreground text-center max-w-md">
          채널 분석과 DNA 분석이 완료되면 맞춤형 실행 전략이 생성됩니다.
        </p>
      </CardContent>
    </Card>
  )
}
