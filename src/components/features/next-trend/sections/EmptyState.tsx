"use client"

import { useRouter } from "next/navigation"
import { Lightbulb } from "lucide-react"
import { Button } from "@/components/ui/button"

interface NextTrendEmptyStateProps {
  channelId?: string
}

export function NextTrendEmptyState({ channelId }: NextTrendEmptyStateProps) {
  const router = useRouter()

  const handleNavigate = () => {
    if (channelId) {
      router.push(`/analysis?channel=${channelId}`)
    } else {
      router.push("/channels")
    }
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Lightbulb className="h-12 w-12 text-muted-foreground/50" />
      <h3 className="mt-4 text-lg font-medium">Next Trend 분석 결과가 없습니다</h3>
      <p className="mt-2 mb-6 text-sm text-muted-foreground">
        채널 분석을 실행하면 내부 신호 기반 다음 시도 방향을 확인할 수 있습니다.
      </p>
      <Button variant="outline" onClick={handleNavigate}>
        채널 분석으로 이동
      </Button>
    </div>
  )
}
