"use client"

import { useRouter } from "next/navigation"
import { Zap } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface ActionPlanEmptyStateProps {
  channelId?: string
}

export function ActionPlanEmptyState({ channelId }: ActionPlanEmptyStateProps) {
  const router = useRouter()

  const handleNavigate = () => {
    if (channelId) {
      router.push(`/analysis?channel=${channelId}`)
    } else {
      router.push("/channels")
    }
  }

  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Zap className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">실행 전략 데이터가 없습니다</h3>
        <p className="text-muted-foreground max-w-md mb-6">
          채널 분석을 실행하면 맞춤형 실행 전략과 우선순위 액션 플랜을 확인할 수 있습니다.
        </p>
        <Button variant="outline" onClick={handleNavigate}>
          채널 분석으로 이동
        </Button>
      </CardContent>
    </Card>
  )
}
