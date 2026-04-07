"use client"

import { useRouter } from "next/navigation"
import { BarChart3, TrendingUp, Activity, Gauge } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AnalysisEmptyStateProps {
  channelId?: string
  type?: "no-data" | "insufficient-samples" | "limited-analysis"
  title?: string
  description?: string
}

const previewItems = [
  { icon: BarChart3, label: "채널 종합 성과 점수", desc: "조회수·구독·참여율을 하나의 점수로" },
  { icon: TrendingUp, label: "상위 vs 하위 영상 비교", desc: "잘된 영상과 아닌 영상의 차이 분석" },
  { icon: Activity, label: "업로드 패턴 분석", desc: "최적 업로드 요일·시간대 파악" },
  { icon: Gauge, label: "썸네일·제목 효과 분석", desc: "클릭률에 영향을 주는 요소 확인" },
]

export function AnalysisEmptyState({ channelId, title, description }: AnalysisEmptyStateProps) {
  const router = useRouter()

  const handleNavigate = () => {
    router.push("/channels")
  }

  return (
    <div className="space-y-6">
      <div className="flex min-h-[260px] flex-col items-center justify-center rounded-lg border border-dashed p-10 text-center">
        <h3 className="text-lg font-semibold mb-2">
          {title ?? "채널 분석 결과가 없습니다"}
        </h3>
        <p className="text-muted-foreground max-w-md mb-6">
          {description ?? "채널을 등록하고 분석을 실행하면 채널 성과 리포트를 확인할 수 있습니다."}
        </p>
        <Button variant="outline" onClick={handleNavigate}>
          {channelId ? "채널 분석 시작하기" : "채널 등록하기"}
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
