import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">페이지를 찾을 수 없습니다</h1>
        <p className="mt-3 text-sm leading-6 text-gray-600">
          요청한 경로가 없거나, 라우트가 아직 정상적으로 로드되지 않았습니다.
        </p>

        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-medium text-white"
          >
            홈으로
          </Link>
          <Link
            href="/channels"
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700"
          >
            내 채널
          </Link>
        </div>
      </div>
    </main>
  )
}