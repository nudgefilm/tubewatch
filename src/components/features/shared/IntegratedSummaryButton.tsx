"use client"

import { useState } from "react"
import { Sparkles } from "lucide-react"
import { IntegratedSummaryModal } from "@/components/channels/IntegratedSummaryModal"

interface Props {
  channelId: string
  channelTitle?: string | null
}

// ── sessionStorage 헬퍼 ───────────────────────────────────────────────────────
// 캐시 키는 analysis_results.id(snapshotId) 기준 — 채널 재분석 시 자동 무효화.
// tubewatch_snap_{channelId}  → 해당 채널의 최신 snapshotId
// tubewatch_summary_{snapId}  → snapshotId에 대응하는 통합요약 텍스트
// tubewatch_title_{channelId} → 채널명 (UI 표시용)

function ssGet(key: string): string | null {
  if (typeof window === "undefined") return null
  try { return sessionStorage.getItem(key) } catch { return null }
}
function ssSet(key: string, value: string): void {
  if (typeof window === "undefined") return
  try { sessionStorage.setItem(key, value) } catch { /* ignore */ }
}

// ── 모듈 레벨 메모리 캐시 (SPA 탐색 최적화 — sessionStorage 읽기 생략) ────────
const memSnap    = new Map<string, string>()  // channelId → snapshotId
const memSummary = new Map<string, string>()  // snapshotId → summary
const memTitle   = new Map<string, string>()  // channelId → channelTitle

/** 캐시 조회: 메모리 → sessionStorage 순. 캐시 미스 시 null 반환. */
function getCachedSummary(channelId: string): string | null {
  const snapId = memSnap.get(channelId) ?? ssGet(`tubewatch_snap_${channelId}`)
  if (!snapId) return null
  return memSummary.get(snapId) ?? ssGet(`tubewatch_summary_${snapId}`)
}
function getCachedTitle(channelId: string): string | null {
  return memTitle.get(channelId) ?? ssGet(`tubewatch_title_${channelId}`)
}

/**
 * 각 리포트 페이지 하단에 삽입하는 통합 요약 트리거 버튼.
 *
 * 캐시 계층:
 *   1. 모듈 메모리 Map  (SPA 탐색, 즉시)
 *   2. sessionStorage   (풀 리로드·로그아웃 후 재로그인, 탭 세션 내)
 *   3. DB 캐시 (API)    (타 기기·새 탭·탭 재오픈 — Gemini 재호출 없음)
 *   4. Gemini 신규 생성 (최초 1회 또는 재분석 후 첫 요청)
 *
 * 캐시 키는 analysis_results.id(snapshotId) 기준이므로
 * 채널 재분석 시 snapshotId가 바뀌어 이전 캐시가 자동으로 무효화된다.
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
          onSummaryCached={(id, summary, title, snapshotId) => {
            if (snapshotId) {
              memSnap.set(id, snapshotId)
              ssSet(`tubewatch_snap_${id}`, snapshotId)
              memSummary.set(snapshotId, summary)
              ssSet(`tubewatch_summary_${snapshotId}`, summary)
            }
            if (title) {
              memTitle.set(id, title)
              ssSet(`tubewatch_title_${id}`, title)
            }
          }}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
