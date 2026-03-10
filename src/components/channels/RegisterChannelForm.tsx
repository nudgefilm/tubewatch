'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type RegisterChannelFormProps = {
  currentCount?: number
  maxCount?: number
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
}: RegisterChannelFormProps) {
  const supabase = createClient()

  const [channelUrl, setChannelUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const isLimitReached = currentCount >= maxCount

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
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
        body: JSON.stringify({
          channel_url: channelUrl.trim(),
        }),
      })

      const result: RegisterChannelResponse = await response.json()

      if (!response.ok) {
        setErrorMessage(result.error || '채널 등록에 실패했습니다.')
        return
      }

      setMessage(result.message || '채널이 등록되었습니다.')
      setChannelUrl('')

      // 가장 단순하고 확실한 방식: 목록 새로고침
      window.location.reload()
    } catch (error) {
      console.error('RegisterChannelForm error:', error)
      setErrorMessage('채널 등록 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-bold text-gray-900">채널 등록</h2>

      <p className="mt-3 text-base text-gray-600">
        유튜브 채널 URL을 등록하세요. 최대 {maxCount}개까지 등록할 수 있습니다.
      </p>

      <p className="mt-2 text-sm text-gray-500">
        현재 등록 수: {currentCount}/{maxCount}
      </p>

      <form onSubmit={handleSubmit} className="mt-6">
        <input
          type="url"
          value={channelUrl}
          onChange={(e) => setChannelUrl(e.target.value)}
          placeholder="https://www.youtube.com/@채널명"
          className="w-full rounded-xl border border-gray-300 px-4 py-4 text-base text-gray-900 outline-none transition focus:border-gray-500"
          disabled={isSubmitting || isLimitReached}
        />

        {message && (
          <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {message}
          </div>
        )}

        {errorMessage && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || isLimitReached}
          className="mt-5 inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-base font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? '채널 등록 중...' : '채널 등록'}
        </button>
      </form>
    </div>
  )
}