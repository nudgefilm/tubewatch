"use client"

import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SeoLabEmptyStateProps {
  channelId?: string
}

export function SeoLabEmptyState({ channelId }: SeoLabEmptyStateProps) {
  const router = useRouter()

  const handleNavigate = () => {
    if (channelId) {
      router.push(`/analysis?channel=${channelId}`)
    } else {
      router.push("/channels")
    }
  }

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
      <Search className="mb-4 size-12 text-muted-foreground" />
      <h3 className="mb-2 text-lg font-medium">SEO 분석 결과가 아직 없습니다</h3>
      <p className="mb-6 text-sm text-muted-foreground">
        채널 분석을 실행하면 제목, 키워드, 반복 패턴 기반의 SEO 인사이트를 확인할 수 있습니다.
      </p>
      <Button variant="outline" onClick={handleNavigate}>
        채널 분석으로 이동
      </Button>
    </div>
  )
}
