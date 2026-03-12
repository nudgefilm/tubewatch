'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type RegisterChannelFormProps = {
  currentCount?: number
  maxCount?: number
  isAdmin?: boolean
}

type RegisterChannelResponse = {
  success?: boolean
  message?: string
  error?: string
  data?: {
    id: string
    user_id: string
    channel_url: string
    channel_id: string | null
    channel_title: string | null
    thumbnail_url: string | null
    subscriber_count: number | null
    last_analysis_requested_at: string | null
    last_analyzed_at: string | null
    created_at: string
    updated_at: string
  }
}

export default function RegisterChannelForm({
  currentCount = 0,
  maxCount = 3,
  isAdmin = false,
}: RegisterChannelFormProps): JSX.Element {
  const supabase = createClient()

  const [channelUrl, setChannelUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const isLimitReached = !isAdmin && currentCount >= maxCount

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault()

    if (isLimitReached) {
      setErrorMessage(`채널은 최대 ${maxCount}개까지 등록할 수 있습니다.`)
      return
    }

    if (!channelUrl.trim()) {
      setErrorMessage('유튜브 채널 URL을 입력해 주세요.')
      return
    }

    try {
      setIsSubmitting(true)
      setMessage(null)
      setErrorMessage(null)

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError) {
        setErrorMessage('세션 정보를 불러오지 못했습니다.')
        return
      }

      const accessToken = session?.access_token

      if (!accessToken) {
        setErrorMessage('로그인이 만료되었습니다. 다시 로그인해 주세요.')
        return
      }

      const response = await fetch('/api/channels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ channel_url: channelUrl.trim() }),
      })

      const result: RegisterChannelResponse = await response.json()

      if (!response.ok) {
        setErrorMessage(result.error || '채널 등록에 실패했습니다.')
        return
      }

      setMessage(result.message || '채널이 등록되었습니다.')
      setChannelUrl('')

      window.location.reload()
    } catch (error) {
      console.error('RegisterChannelForm error:', error)
      setErrorMessage('채널 등록 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLimitReached) {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100">
            <svg className="h-4 w-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m0 0v2m0-2h2m-2 0H10m-4.93 2.07A10 10 0 1121.07 5.93 10 10 0 015.07 18.07z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              채널 등록 슬롯을 모두 사용했습니다
            </p>
            <p className="mt-0.5 text-xs text-gray-500">
              최대 {maxCount}개 채널까지 등록할 수 있습니다. 등록된 채널에서 분석을 진행하세요.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <form onSubmit={handleSubmit}>
        <div className="flex gap-2">
          <input
            type="url"
            value={channelUrl}
            onChange={(e) => setChannelUrl(e.target.value)}
            placeholder="https://www.youtube.com/@채널명"
            className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            disabled={isSubmitting}
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-shrink-0 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? '등록 중...' : '채널 등록'}
          </button>
        </div>

        <p className="mt-2.5 text-xs text-gray-400">
          {isAdmin
            ? "관리자 계정 — 제한 없이 채널을 등록할 수 있습니다."
            : `유튜브 채널 URL을 입력하세요. ${maxCount}개 중 ${maxCount - currentCount}개 슬롯 남음.`}
        </p>

        {message ? (
          <div className="mt-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
            {message}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {errorMessage}
          </div>
        ) : null}
      </form>
    </div>
  )
}
