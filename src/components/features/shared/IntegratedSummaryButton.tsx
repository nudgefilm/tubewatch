"use client"

import { useState } from "react"
import { Sparkles } from "lucide-react"
import { IntegratedSummaryModal } from "@/components/channels/IntegratedSummaryModal"

interface Props {
  channelId: string
  channelTitle?: string | null
}

/**
 * 모듈 레벨 싱글톤 캐시.
 * 4개 리포트 페이지 어디서든 한 번 생성하면 다른 페이지에서 재생성하지 않음.
 */
const globalSummaryCache = new Map<string, string>()
const globalChannelTitleCache = new Map<string, string>()

/**
 * 각 리포트 페이지 하단에 삽입하는 통합 요약 트리거 버튼.
 * 모든 인스턴스가 globalSummaryCache를 공유 — 어느 페이지에서 생성해도 재호출 없음.
 */
export function IntegratedSummaryButton({ channelId, channelTitle }: Props) {
  const [isOpen, setIsOpen] = useState(false)

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
          channel={{ id: channelId, channel_title: globalChannelTitleCache.get(channelId) ?? channelTitle ?? null }}
          cachedSummary={globalSummaryCache.get(channelId) ?? null}
          onSummaryCached={(id, summary, title) => {
            globalSummaryCache.set(id, summary)
            if (title) globalChannelTitleCache.set(id, title)
          }}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
