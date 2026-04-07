"use client"

import { Badge } from "@/components/ui/badge"
import { BarChart2, Tag } from "lucide-react"
import type { ExecutionAction, ViewingPointGauge } from "@/mocks/next-trend"
import { OnePagerCard } from "@/components/features/shared/OnePagerCard"

interface NextTrendActionSectionProps {
  data: ExecutionAction[]
}

/** 1–5 점수 게이지 (●●●●○) */
function ViewingGauge({ points }: { points: ViewingPointGauge[] }) {
  if (!points || points.length === 0) return null
  return (
    <div className="space-y-2">
      {points.map(({ label, score }) => (
        <div key={label} className="flex items-center gap-3">
          <span className="w-16 text-xs text-muted-foreground shrink-0">{label}</span>
          <div className="flex gap-1">
            {Array.from({ length: 5 }, (_, i) => (
              <span key={i} className={`w-3 h-3 rounded-full ${i < score ? "bg-primary" : "bg-muted"}`} />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">{score}/5</span>
        </div>
      ))}
    </div>
  )
}

/** 섹션 행 공통 레이아웃 */
function SectionRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 px-5 py-4">
      <div className="mt-0.5 h-4 w-4 shrink-0 text-primary">{icon}</div>
      <div className="space-y-1.5 min-w-0 w-full">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        {children}
      </div>
    </div>
  )
}

/** 기획안 카드 1장 */
function ActionCard({ action }: { action: ExecutionAction }) {
  if (!action.videoPlanDocument) {
    return (
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3 border-b bg-muted/30">
          <span className="font-heading font-medium text-sm leading-none tracking-[-0.01em]">TubeWatch™</span>
          <span className="text-muted-foreground/40 text-sm">|</span>
          <span className="text-sm font-semibold text-foreground">영상 기획안</span>
          <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-200">튜브워치 엔진</Badge>
        </div>
        <div className="px-5 py-5">
          <p className="text-sm text-muted-foreground">튜브워치 엔진이 채널의 잠재력 분석을 통해 6가지 핵심 섹션을 설계하고 있습니다. 작업이 완료되면 전략 리포트가 자동 노출되니 잠시 후 확인 바랍니다.</p>
        </div>
      </div>
    )
  }

  const extra = (
    <>
      {action.viewingPoints && action.viewingPoints.length > 0 && (
        <SectionRow icon={<BarChart2 className="h-4 w-4" />} label="시청 포인트 게이지">
          <ViewingGauge points={action.viewingPoints} />
        </SectionRow>
      )}
      {action.recommendedTags && action.recommendedTags.length > 0 && (
        <SectionRow icon={<Tag className="h-4 w-4" />} label="추천 태그">
          <div className="flex flex-wrap gap-1.5">
            {action.recommendedTags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs font-normal">#{tag}</Badge>
            ))}
          </div>
        </SectionRow>
      )}
    </>
  )

  return (
    <OnePagerCard
      title="영상 기획안"
      markdown={action.videoPlanDocument}
      downloadFilename="영상기획안.png"
      extra={extra}
    />
  )
}

export function NextTrendActionSection({ data }: NextTrendActionSectionProps) {
  return (
    <div className="space-y-4">
      {data.map((action) => (
        <ActionCard key={action.id} action={action} />
      ))}
    </div>
  )
}
