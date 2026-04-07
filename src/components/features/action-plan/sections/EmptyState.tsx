"use client"

import { useRouter } from "next/navigation"
import { Zap, ListChecks, Target, ArrowUpRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ActionPlanEmptyStateProps {
  channelId?: string
}

const previewItems = [
  { icon: ListChecks, label: "오늘 바로 실행할 액션 리스트", desc: "데이터 기반 우선순위 행동 목록" },
  { icon: Target, label: "개선 포인트 집중 제안", desc: "지금 가장 먼저 손봐야 할 부분" },
  { icon: ArrowUpRight, label: "다음 영상 방향 가이드", desc: "성과를 높일 다음 콘텐츠 전략" },
  { icon: Zap, label: "빠른 성과를 위한 Quick Win", desc: "작은 변화로 큰 효과를 낼 수 있는 것들" },
]

export function ActionPlanEmptyState({ channelId }: ActionPlanEmptyStateProps) {
  const router = useRouter()

  const handleNavigate = () => {
    router.push("/channels")
  }

  return (
    <div className="space-y-6">
      <div className="flex min-h-[260px] flex-col items-center justify-center rounded-lg border border-dashed p-10 text-center">
        <h3 className="text-lg font-semibold mb-2">실행 전략 데이터가 없습니다</h3>
        <p className="text-muted-foreground max-w-md mb-6">
          채널 분석을 실행하면 맞춤형 실행 전략과 우선순위 액션 플랜을 확인할 수 있습니다.
        </p>
        <Button variant="outline" onClick={handleNavigate}>
          채널 분석으로 이동
        </Button>
      </div>

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
