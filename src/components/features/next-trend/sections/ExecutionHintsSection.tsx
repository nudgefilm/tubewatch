"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, RefreshCw } from "lucide-react"
import { PlanDocument } from "@/components/features/shared/OnePagerCard"

interface ExecutionHintDocumentProps {
  markdown: string | null
  channelId?: string
}

/** AI가 생성한 본문에서 **bold** 마커를 제거 — ## 섹션 제목은 유지 */
function stripBold(md: string): string {
  return md.replace(/\*\*([^*]+)\*\*/g, "$1")
}

export function ExecutionHintDocument({ markdown, channelId }: ExecutionHintDocumentProps) {
  const router = useRouter()
  const [isRetrying, setIsRetrying] = useState(false)
  const [retryError, setRetryError] = useState<string | null>(null)

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
      const data = await res.json() as { error?: string }
      if (!res.ok) {
        setRetryError(
          data.error === "GEMINI_OVERLOADED"
            ? "현재 외부 API 접속량이 몰려 사용량이 증가하고 있습니다. 채널진단 데이터 컨설팅 > 내 채널 > '월간 리포트 신청'을 통해 종합 진단 리포트를 먼저 받아보세요."
            : (data.error ?? "재생성 실패")
        )
        return
      }
      router.refresh()
    } catch {
      setRetryError("네트워크 오류가 발생했습니다.")
    } finally {
      setIsRetrying(false)
    }
  }

  if (!markdown) {
    if (!channelId) return null
    return (
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="px-5 py-5 space-y-3">
          <p className="text-sm text-muted-foreground">기획안을 불러오지 못했습니다. 아래 버튼으로 해당 섹션만 다시 생성할 수 있습니다.</p>
          <button
            type="button"
            onClick={() => { void handleRetry() }}
            disabled={isRetrying}
            className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 transition-colors disabled:opacity-50 disabled:pointer-events-none"
          >
            {isRetrying
              ? <><Loader2 className="size-3.5 animate-spin" /><span>재생성 중…</span></>
              : <><RefreshCw className="size-3.5" /><span>이 섹션 다시 생성하기</span></>
            }
          </button>
          {retryError && <p className="text-xs text-red-500">{retryError}</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="px-6 pt-6 pb-5">
        <PlanDocument markdown={stripBold(markdown)} />
      </div>
    </div>
  )
}
