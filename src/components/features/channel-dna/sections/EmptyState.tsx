"use client"

import { useRouter } from "next/navigation"
import { Dna, Repeat2, Layers, Trophy } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface DnaEmptyStateProps {
  channelId?: string
}

const previewItems = [
  { icon: Trophy, label: "성공 공식 추출", desc: "내 채널에서 반복되는 성과 패턴 발견" },
  { icon: Repeat2, label: "반복 요소 분석", desc: "잘되는 영상들의 공통점 정리" },
  { icon: Layers, label: "성과 구조 시각화", desc: "어떤 요소가 성과를 만드는지 한눈에" },
  { icon: Dna, label: "채널 고유 DNA 도출", desc: "내 채널만의 강점과 핵심 방향성 파악" },
]

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
    <div className="space-y-6">
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Dna className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Channel DNA 분석 결과가 없습니다</h3>
          <p className="text-muted-foreground max-w-md mb-6">
            채널 분석을 실행하면 성과 구조와 반복 패턴을 확인할 수 있습니다.
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
