'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Channel = {
  id: string
  channel_url: string | null
  channel_id: string | null
  channel_title: string | null
  thumbnail_url: string | null
  subscriber_count: number | null
  last_analysis_requested_at: string | null
  last_analyzed_at: string | null
  created_at?: string | null
  updated_at?: string | null
}

type ChannelCardProps = {
  channel: Channel
  onRefresh?: () => Promise<void> | void
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

function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined) return '-'
  return new Intl.NumberFormat('ko-KR').format(value)
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return '-'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return '-'

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function getRemainingCooldownHours(lastAnalyzedAt: string | null | undefined) {
  if (!lastAnalyzedAt) return 0

  const last = new Date(lastAnalyzedAt)
  if (Number.isNaN(last.getTime())) return 0

  const now = new Date()
  const diffMs = now.getTime() - last.getTime()
  const diffHours = diffMs / (1000 * 60 * 60)

  if (diffHours >= COOLDOWN_HOURS) return 0

  return Math.ceil(COOLDOWN_HOURS - diffHours)
}

export default function ChannelCard({
  channel,
  onRefresh,
}: ChannelCardProps) {
  const router = useRouter()

  const [isRequesting, setIsRequesting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const remainingCooldownHours = getRemainingCooldownHours(
    channel.last_analyzed_at
  )
  const isCooldownActive = remainingCooldownHours > 0

  async function handleRequestAnalysis() {
    console.log('handleRequestAnalysis clicked', {
      channelId: channel.id,
      channelTitle: channel.channel_title,
      isCooldownActive,
      remainingCooldownHours,
    })

    try {
      setIsRequesting(true)
      setMessage(null)
      setErrorMessage(null)

      const response = await fetch('/api/analysis/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          user_channel_id: channel.id,
        }),
      })

      const result: AnalysisResponse = await response.json()

      console.log('analysis request response:', {
        status: response.status,
        ok: response.ok,
        result,
      })

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
            result.error ||
              '이미 진행 중이거나 대기 중인 분석 요청이 있습니다.'
          )
          return
        }

        setErrorMessage(result.error || '분석 요청에 실패했습니다.')
        return
      }

      setMessage('분석 요청이 접수되었습니다. 자동으로 분석을 진행합니다.')

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
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-4">
        {channel.thumbnail_url ? (
          <img
            src={channel.thumbnail_url}
            alt={channel.channel_title ?? '채널 썸네일'}
            className="h-16 w-16 rounded-full border border-gray-200 object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-sm text-gray-500">
            No Img
          </div>
        )}

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-semibold text-gray-900">
            {channel.channel_title || '제목 없는 채널'}
          </h3>

          <p className="mt-1 truncate text-sm text-gray-600">
            {channel.channel_url || '-'}
          </p>

          <div className="mt-3 grid gap-2 text-sm text-gray-700">
            <div>
              <span className="font-medium">채널 ID:</span>{' '}
              {channel.channel_id || '-'}
            </div>
            <div>
              <span className="font-medium">구독자 수:</span>{' '}
              {formatNumber(channel.subscriber_count)}
            </div>
            <div>
              <span className="font-medium">최근 분석 요청:</span>{' '}
              {formatDateTime(channel.last_analysis_requested_at)}
            </div>
            <div>
              <span className="font-medium">최근 분석 완료:</span>{' '}
              {formatDateTime(channel.last_analyzed_at)}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
        {isCooldownActive ? (
          <p>
            현재 쿨다운이 적용 중입니다. 약{' '}
            <span className="font-semibold">{remainingCooldownHours}시간</span>{' '}
            후 다시 요청할 수 있습니다.
          </p>
        ) : (
          <p>지금 분석 요청이 가능합니다.</p>
        )}
      </div>

      {message && (
        <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          {message}
        </div>
      )}

      {errorMessage && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <div className="mt-5 flex items-center gap-3">
        <button
          type="button"
          onClick={handleRequestAnalysis}
          disabled={isRequesting || isCooldownActive}
          className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isRequesting ? '분석 요청 중...' : '분석 요청'}
        </button>
      </div>
    </div>
  )
}