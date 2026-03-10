import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-bold mb-4">TubeWatch</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        SaaS 대시보드에 오신 것을 환영합니다.
      </p>

      <Link
        href="/login"
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
      >
        로그인하러 가기
      </Link>
    </main>
  )
}