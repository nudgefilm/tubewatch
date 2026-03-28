"use client"

import { useRouter } from "next/navigation"
import { Dna } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface DnaEmptyStateProps {
  channelId?: string
}

export function DnaEmptyState({ channelId }: DnaEmptyStateProps) {
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
        <div className="mb-4 rounded-full bg-muted p-4">
          <Dna className="size-8 text-muted-foreground" />
        </div>
        <h3 className="mb-2 text-lg font-semibold">Channel DNA 분석 결과가 없습니다</h3>
        <p className="mb-6 max-w-md text-sm text-muted-foreground">
          채널 분석을 실행하면 성과 구조와 반복 패턴을 확인할 수 있습니다.
        </p>
        <Button variant="outline" onClick={handleNavigate}>
          채널 분석으로 이동
        </Button>
      </CardContent>
    </Card>
  )
}
