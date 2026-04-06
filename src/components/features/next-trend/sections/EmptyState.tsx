"use client"

import { useRouter } from "next/navigation"
import { TrendingUp, Lightbulb, Compass, Flame } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface NextTrendEmptyStateProps {
  channelId?: string
}

const previewItems = [
  { icon: Lightbulb, label: "다음 영상 주제 추천", desc: "내 채널 데이터 기반 시도할 만한 주제" },
  { icon: Compass, label: "콘텐츠 방향성 제안", desc: "알고리즘 흐름에 맞는 다음 방향" },
  { icon: Flame, label: "성장 가능성 높은 포맷", desc: "지금 내 채널에서 시도할 최적 형식" },
  { icon: TrendingUp, label: "내부 신호 기반 트렌드", desc: "외부가 아닌 내 채널 내 흐름에서 발견" },
]

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
    <div className="space-y-6">
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <h3 className="text-lg font-semibold mb-2">Next Trend 분석 결과가 없습니다</h3>
          <p className="text-muted-foreground max-w-md mb-6">
            채널 분석을 실행하면 내부 신호 기반 다음 시도 방향을 확인할 수 있습니다.
          </p>
          <Button variant="outline" onClick={handleNavigate}>
            채널 분석으로 이동
          </Button>
        </CardContent>
      </Card>

      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 px-1">
          분석 후 확인할 수 있는 내용
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {previewItems.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex items-start gap-3 rounded-lg border bg-muted/30 px-4 py-3">
              <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-background border">
                <Icon className="size-3.5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
