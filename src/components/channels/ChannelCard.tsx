'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatDateTime } from '@/lib/format/formatDateTime'

type Channel = {
  id: string
  channel_url: string | null
  channel_id: string | null
  channel_title: string | null
  thumbnail_url: string | null
  subscriber_count: number | null
  video_count: number | null
  last_analysis_requested_at: string | null
  last_analyzed_at: string | null
  created_at?: string | null
  updated_at?: string | null
}

type ChannelCardProps = {
  channel: Channel
  onRefresh?: () => Promise<void> | void
  isAdmin?: boolean
}

type AnalysisResponse = {
  success?: boolean
  message?: string
  error?: string
  code?: string
  remaining_hours?: number
  active_job_id?: string
  active_status?: string
  data?: {
    job_id: string | null
    queue_id: string | null
    request_id: string | null
    trace_id: string | null
    user_channel_id: string
    channel_title: string | null
    status: string
  }
}

const COOLDOWN_HOURS = 72

function formatSubscribers(value: number | null | undefined): string {
  if (value == null) return '-'
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return new Intl.NumberFormat('ko-KR').format(value)
}

function getRemainingCooldownHours(lastAnalyzedAt: string | null | undefined): number {
  if (!lastAnalyzedAt) return 0
  const last = new Date(lastAnalyzedAt)
  if (Number.isNaN(last.getTime())) return 0
  const diffMs = Date.now() - last.getTime()
  const diffHours = diffMs / (1000 * 60 * 60)
  if (diffHours >= COOLDOWN_HOURS) return 0
  return Math.ceil(COOLDOWN_HOURS - diffHours)
}

export default function ChannelCard({
  channel,
  onRefresh,
  isAdmin = false,
}: ChannelCardProps): JSX.Element {
  const router = useRouter()

  const [isRequesting, setIsRequesting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const remainingCooldownHours = getRemainingCooldownHours(channel.last_analyzed_at)
  const isCooldownActive = !isAdmin && remainingCooldownHours > 0
  const hasAnalysis = !!channel.last_analyzed_at

  async function handleRequestAnalysis(): Promise<void> {
    try {
      setIsRequesting(true)
      setMessage(null)
      setErrorMessage(null)

      const response = await fetch('/api/analysis/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ user_channel_id: channel.id }),
      })

      const result: AnalysisResponse = await response.json()

      if (!response.ok) {
        if (result.code === 'COOLDOWN_ACTIVE') {
          setErrorMessage(
            result.error ||
              `분석 요청은 72시간마다 가능합니다. 약 ${result.remaining_hours ?? '-'}시간 후 다시 시도해 주세요.`
          )
          return
        }
        if (result.code === 'ANALYSIS_ALREADY_ACTIVE') {
          setErrorMessage(
            result.error || '이미 진행 중이거나 대기 중인 분석 요청이 있습니다.'
          )
          return
        }
        setErrorMessage(result.error || '분석 요청에 실패했습니다.')
        return
      }

      setMessage('분석 요청이 접수되었습니다.')

      setTimeout(() => {
        if (onRefresh) {
          void onRefresh()
        } else {
          router.refresh()
        }
      }, 3000)
    } catch (error) {
      console.error('handleRequestAnalysis error:', error)
      setErrorMessage('분석 요청 중 오류가 발생했습니다.')
    } finally {
      setIsRequesting(false)
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm transition hover:border-gray-300">
      <div className="flex items-start gap-4 p-5">
        {/* Thumbnail */}
        {channel.thumbnail_url ? (
          <img
            src={channel.thumbnail_url}
            alt={channel.channel_title ?? '채널 썸네일'}
            className="h-12 w-12 flex-shrink-0 rounded-full border border-gray-100 object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs text-gray-400">
            Ch
          </div>
        )}

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-base font-semibold text-gray-900">
              {channel.channel_title || '제목 없는 채널'}
            </h3>
            {isAdmin ? (
              <span className="flex-shrink-0 rounded bg-slate-900 px-2 py-1 text-xs font-medium text-white">
                Admin
              </span>
            ) : null}
            {hasAnalysis ? (
              <span className="flex-shrink-0 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                분석 완료
              </span>
            ) : (
              <span className="flex-shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-500">
                미분석
              </span>
            )}
          </div>

          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
            <span>구독자 {formatSubscribers(channel.subscriber_count)}</span>
            <span>영상 {channel.video_count != null ? new Intl.NumberFormat('ko-KR').format(channel.video_count) : '-'}개</span>
            <span>최근 분석 {formatDateTime(channel.last_analyzed_at)}</span>
          </div>
        </div>
      </div>

      {/* Cooldown notice */}
      {isAdmin && remainingCooldownHours > 0 ? (
        <div className="border-t border-gray-100 px-5 py-2.5 text-xs text-indigo-600">
          관리자: 쿨다운 바이패스 활성
          <span className="ml-1 text-indigo-400">(일반 기준 {remainingCooldownHours}h 남음)</span>
        </div>
      ) : isCooldownActive ? (
        <div className="border-t border-gray-100 px-5 py-2.5 text-xs text-amber-600">
          쿨다운 중 — 약 {remainingCooldownHours}시간 후 재요청 가능
        </div>
      ) : null}

      {/* Messages */}
      {message ? (
        <div className="mx-5 mb-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
          {message}
        </div>
      ) : null}
      {errorMessage ? (
        <div className="mx-5 mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {errorMessage}
        </div>
      ) : null}

      {/* Actions */}
      <div className="flex items-center gap-2 border-t border-gray-100 px-5 py-3">
        <button
          type="button"
          onClick={handleRequestAnalysis}
          disabled={isRequesting || isCooldownActive}
          className="inline-flex items-center rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isRequesting ? '요청 중...' : '분석 요청'}
        </button>

        {hasAnalysis ? (
          <Link
            href={`/analysis/${channel.id}`}
            className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            분석 결과 보기
          </Link>
        ) : (
          <Link
            href={`/analysis/${channel.id}`}
            className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-xs font-semibold text-gray-400 transition hover:bg-gray-50"
          >
            분석 페이지
          </Link>
        )}
      </div>
    </div>
  )
}
