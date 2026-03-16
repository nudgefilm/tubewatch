'use client'

import GoogleLoginButton from '@/components/landing/GoogleLoginButton'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <GoogleLoginButton className="rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50" label="Google로 로그인" />
    </div>
  )
}