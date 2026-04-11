"use client"

import { useState } from "react"
import { Sparkles } from "lucide-react"
import { IntegratedSummaryModal } from "@/components/channels/IntegratedSummaryModal"

interface Props {
  channelId: string
  channelTitle?: string | null
}

// ── sessionStorage 헬퍼 ───────────────────────────────────────────────────────
// 풀 페이지 리로드(메인 페이지 이동 등) 후에도 탭 세션 내 캐시를 유지한다.
// 탭 종료 시 자동 삭제.

function readSummaryFromSession(channelId: string): string | null {
  if (typeof window === "undefined") return null
  try { return sessionStorage.getItem(`tubewatch_summary_${channelId}`) } catch { return null }
}
function writeSummaryToSession(channelId: string, summary: string): void {
  if (typeof window === "undefined") return
  try { sessionStorage.setItem(`tubewatch_summary_${channelId}`, summary) } catch { /* ignore */ }
}
function readTitleFromSession(channelId: string): string | null {
  if (typeof window === "undefined") return null
  try { return sessionStorage.getItem(`tubewatch_title_${channelId}`) } catch { return null }
}
function writeTitleToSession(channelId: string, title: string): void {
  if (typeof window === "undefined") return
  try { sessionStorage.setItem(`tubewatch_title_${channelId}`, title) } catch { /* ignore */ }
}

// ── 모듈 레벨 메모리 캐시 (SPA 탐색 최적화 — sessionStorage 읽기 생략) ────────
const globalSummaryCache = new Map<string, string>()
const globalChannelTitleCache = new Map<string, string>()

/** 메모리 → sessionStorage 순으로 캐시 조회 */
function getCachedSummary(channelId: string): string | null {
  return globalSummaryCache.get(channelId) ?? readSummaryFromSession(channelId)
}
function getCachedTitle(channelId: string): string | null {
  return globalChannelTitleCache.get(channelId) ?? readTitleFromSession(channelId)
}

/**
 * 각 리포트 페이지 하단에 삽입하는 통합 요약 트리거 버튼.
 * 모든 인스턴스가 globalSummaryCache + sessionStorage를 공유 —
 * 어느 페이지에서 생성해도, 풀 리로드 후에도 재호출하지 않음.
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
          channel={{ id: channelId, channel_title: getCachedTitle(channelId) ?? channelTitle ?? null }}
          cachedSummary={getCachedSummary(channelId)}
          onSummaryCached={(id, summary, title) => {
            globalSummaryCache.set(id, summary)
            writeSummaryToSession(id, summary)
            if (title) {
              globalChannelTitleCache.set(id, title)
              writeTitleToSession(id, title)
            }
          }}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
