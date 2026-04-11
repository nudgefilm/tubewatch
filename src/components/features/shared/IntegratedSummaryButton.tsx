"use client"

import { useRef, useState } from "react"
import { Sparkles } from "lucide-react"
import { IntegratedSummaryModal } from "@/components/channels/IntegratedSummaryModal"

interface Props {
  channelId: string
}

/**
 * 각 리포트 페이지 하단에 삽입하는 통합 요약 트리거 버튼.
 * 자기완결형 — 모달 상태와 세션 캐시를 내부에서 관리.
 */
export function IntegratedSummaryButton({ channelId }: Props) {
  const [isOpen, setIsOpen]   = useState(false)
  const cacheRef = useRef<Map<string, string>>(new Map())

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-primary/25 bg-primary/5 px-4 py-3 text-sm font-semibold text-primary hover:bg-primary/10 active:scale-[0.99] transition-all"
      >
        <Sparkles className="size-4 shrink-0" />
        튜브워치 4개 리포트 통합 요약
      </button>

      {isOpen && (
        <IntegratedSummaryModal
          isOpen={isOpen}
          channel={{ id: channelId, channel_title: null }}
          cachedSummary={cacheRef.current.get(channelId) ?? null}
          onSummaryCached={(id, summary) => { cacheRef.current.set(id, summary) }}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
