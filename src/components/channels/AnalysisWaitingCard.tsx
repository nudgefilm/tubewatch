"use client"

import { useState, useEffect, useRef } from "react"
import { Loader2, Clock } from "lucide-react"

interface AnalysisWaitingCardProps {
  channel: {
    title: string | null
    thumbnailUrl: string | null
    subscriberCount: number | null
    videoCount: number | null
  }
  progressStep: string | null
  isOverloadQueued: boolean
  retryAfterSec: number
  onRetry: () => void
}

const STEP_LABELS: Record<string, { text: string; sub: string }> = {
  queued:          { text: "분석 대기 중",               sub: "잠시 후 자동으로 시작됩니다" },
  fetching_yt:     { text: "유튜브 데이터 수집 중",       sub: "최근 영상 목록을 불러오는 중입니다" },
  processing_data: { text: "영상 데이터 분석 중",         sub: "업로드 패턴과 성과 지표를 계산하고 있습니다" },
  generating_ai:   { text: "AI가 채널을 분석하고 있습니다", sub: "채널 DNA와 성장 전략을 설계 중입니다 (30~60초 소요)" },
  saving_results:  { text: "결과를 저장하는 중",          sub: "거의 다 됐습니다!" },
}

function fmtSubscribers(n: number | null): string {
  if (n == null) return "-"
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return new Intl.NumberFormat("ko-KR").format(n)
}

export function AnalysisWaitingCard({
  channel,
  progressStep,
  isOverloadQueued,
  retryAfterSec,
  onRetry,
}: AnalysisWaitingCardProps) {
  const [sec, setSec] = useState(isOverloadQueued ? retryAfterSec : 0)
  const firedRef = useRef(false)

  // 과부하 대기 카운트다운
  useEffect(() => {
    if (!isOverloadQueued) { setSec(0); return }
    firedRef.current = false
    setSec(retryAfterSec)
    const id = setInterval(() => {
      setSec((prev) => {
        if (prev <= 1) {
          clearInterval(id)
          if (!firedRef.current) { firedRef.current = true; onRetry() }
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOverloadQueued, retryAfterSec])

  const stepInfo = progressStep ? (STEP_LABELS[progressStep] ?? null) : null

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* 채널 프리뷰 헤더 */}
      <div className="flex items-center gap-3 px-4 py-3.5 border-b bg-muted/20">
        {channel.thumbnailUrl ? (
          <img
            src={channel.thumbnailUrl}
            alt={channel.title ?? "채널"}
            className="h-10 w-10 rounded-full border border-border object-cover shrink-0"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary shrink-0">
            {(channel.title ?? "Ch").slice(0, 2)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground leading-tight">
            {channel.title ?? "채널"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            구독자 {fmtSubscribers(channel.subscriberCount)}
            {channel.videoCount != null && (
              <> · 영상 {new Intl.NumberFormat("ko-KR").format(channel.videoCount)}개</>
            )}
          </p>
        </div>
        <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full shrink-0">
          분석 중
        </span>
      </div>

      {/* 진행 상태 / 과부하 대기 */}
      <div className="px-4 py-4 space-y-1">
        {isOverloadQueued ? (
          <>
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-amber-500 shrink-0" />
              <span className="text-sm font-medium text-foreground">
                AI 서버 일시 과부하 — 자동 재시도 대기 중
              </span>
            </div>
            <p className="text-xs text-muted-foreground pl-6">
              {sec > 0
                ? `${sec}초 후 자동으로 재시도합니다`
                : "재시도 중…"}
            </p>
            <div className="pl-6 pt-1">
              <button
                onClick={() => { firedRef.current = true; onRetry() }}
                disabled={sec === 0}
                className="text-xs font-semibold text-amber-600 underline underline-offset-2 hover:text-amber-800 disabled:opacity-40"
              >
                지금 재시도
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <Loader2 className="size-4 animate-spin text-primary shrink-0" />
              <span className="text-sm font-medium text-foreground">
                {stepInfo?.text ?? "분석을 시작하는 중…"}
              </span>
            </div>
            {stepInfo?.sub && (
              <p className="text-xs text-muted-foreground pl-6">{stepInfo.sub}</p>
            )}
          </>
        )}
      </div>

      {/* 하단 진행 바 */}
      {!isOverloadQueued && (
        <div className="h-0.5 bg-muted overflow-hidden">
          <div className="h-full bg-primary/50 animate-pulse w-2/3" />
        </div>
      )}
    </div>
  )
}
