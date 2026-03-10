'use client'

import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const handleGoogleLogin = async () => {
    const supabase = createClient()

    const origin = window.location.origin

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${origin}/auth/callback`,
      },
    })

    if (error) {
      console.error('Google login error:', error)
      alert('로그인 중 오류가 발생했습니다.')
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-white text-black">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold mb-3">TubeWatch Login</h1>
        <button
          onClick={handleGoogleLogin}
          className="rounded-lg border px-6 py-3 text-lg"
        >
          Google로 로그인
        </button>
      </div>
    </main>
  )
}