"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { BarChart2, Tag, RefreshCw, Loader2 } from "lucide-react"
import type { ExecutionAction, ViewingPointGauge } from "@/mocks/next-trend"
import { OnePagerCard } from "@/components/features/shared/OnePagerCard"

interface NextTrendActionSectionProps {
  data: ExecutionAction[]
  channelId?: string
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

/**
 * 영상 기획안 마크다운 정규화
 * - **N. 섹션 제목** 전체 볼드 라인 → ## N. 섹션 제목 (섹션 헤딩으로 승격)
 * - ###Title (공백 없음) → ### Title
 * - 나머지 inline **bold** 마커 스트립
 */
function normalizeVideoPlan(md: string): string {
  return md
    .split("\n")
    .map((line) => {
      const trimmed = line.trim()
      // **N. 섹션 제목** 전체 볼드 라인 → ## 헤딩
      const sectionMatch = trimmed.match(/^\*\*(\d+\.\s+.+?)\*\*[：:：]?\s*$/)
      if (sectionMatch) return `## ${sectionMatch[1]}`
      // ## / ### 뒤 공백 없으면 추가
      if (/^#{2,3}[^\s#]/.test(trimmed)) {
        return line.replace(/^(\s*)(#{2,3})([^\s#])/, "$1$2 $3")
      }
      // 나머지 **...** 스트립
      return line.replace(/\*\*([^*]+)\*\*/g, "$1")
    })
    .join("\n")
}

const ShellHeader = () => (
  <div className="flex items-center gap-2 px-5 py-3 border-b bg-muted/30">
    <span className="font-heading font-medium text-sm leading-none tracking-[-0.01em]">TubeWatch™</span>
    <span className="text-muted-foreground/40 text-sm">|</span>
    <span className="text-sm font-semibold text-foreground">영상 기획안</span>
    <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-200">튜브워치 엔진</Badge>
  </div>
)

/** 기획안 카드 1장 */
function ActionCard({ action, channelId }: { action: ExecutionAction; channelId?: string }) {
  const router = useRouter()
  const [isRetrying, setIsRetrying] = useState(false)
  const [retryError, setRetryError] = useState<string | null>(null)
  const [retryDone, setRetryDone] = useState(false)

  // router.refresh() 후 데이터가 여전히 없으면 재시도 버튼 복원
  useEffect(() => {
    if (!retryDone || action.videoPlanDocument) return
    const id = setTimeout(() => setRetryDone(false), 8000)
    return () => clearTimeout(id)
  }, [retryDone, action.videoPlanDocument])

  async function handleRetry() {
    if (!channelId) return
    setIsRetrying(true)
    setRetryError(null)
    try {
      const res = await fetch("/api/analysis/regenerate-module", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId, moduleKey: "next_trend" }),
      })
      const data = await res.json() as { ok?: boolean; error?: string }
      if (data.ok) {
        setRetryDone(true)
        router.refresh()
      } else if (data.error === "GEMINI_OVERLOADED") {
        setRetryError("현재 외부 API 접속량이 몰려 사용량이 증가하고 있습니다. 채널진단 데이터 컨설팅 > 내 채널 > '월간 리포트 신청'을 통해 종합 진단 리포트를 먼저 받아보세요.")
      } else {
        setRetryError(data.error ?? "재생성에 실패했습니다. 잠시 후 다시 시도해주세요.")
      }
    } catch {
      setRetryError("네트워크 오류가 발생했습니다.")
    } finally {
      setIsRetrying(false)
    }
  }

  if (!action.videoPlanDocument) {
    return (
      <div className="rounded-xl border bg-card overflow-hidden">
        <ShellHeader />
        <div className="px-5 py-5 space-y-3">
          <p className="text-sm text-muted-foreground">
            {retryDone
              ? "재생성 요청이 완료됐습니다. 페이지를 업데이트 중입니다…"
              : "영상 기획안이 아직 생성되지 않았습니다. 아래 버튼으로 이 섹션만 재생성할 수 있습니다."}
          </p>
          {!retryDone && (
            <button
              type="button"
              onClick={() => { void handleRetry() }}
              disabled={isRetrying || !channelId}
              className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 transition-colors disabled:opacity-50 disabled:pointer-events-none"
            >
              {isRetrying
                ? <><Loader2 className="size-3.5 animate-spin" /><span>재생성 중…</span></>
                : <><RefreshCw className="size-3.5" /><span>이 섹션 다시 생성하기</span></>
              }
            </button>
          )}
          {retryError && <p className="text-xs text-red-500">{retryError}</p>}
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
      markdown={normalizeVideoPlan(action.videoPlanDocument)}
      downloadFilename="영상기획안.png"
      extra={extra}
    />
  )
}

export function NextTrendActionSection({ data, channelId }: NextTrendActionSectionProps) {
  return (
    <div className="space-y-4">
      {data.map((action) => (
        <ActionCard key={action.id} action={action} channelId={channelId} />
      ))}
    </div>
  )
}
