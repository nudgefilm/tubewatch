'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('App error:', error)
  }, [error])

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-lg rounded-xl border border-red-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-900">페이지 오류가 발생했습니다</h1>
        <p className="mt-3 text-sm leading-6 text-gray-600">
          렌더링 중 문제가 발생했습니다. 다시 시도해 주세요.
        </p>

        <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error?.message || '알 수 없는 오류'}
        </div>

        <button
          type="button"
          onClick={() => reset()}
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-medium text-white"
        >
          다시 시도
        </button>
      </div>
    </main>
  )
}