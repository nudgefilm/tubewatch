import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LogoutButton from '@/components/LogoutButton'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const userName =
    user.user_metadata?.name ||
    user.user_metadata?.full_name ||
    user.email?.split('@')[0] ||
    'user'

  const nickname = user.email?.split('@')[0] || 'user'

  const userAvatar =
    user.user_metadata?.avatar_url ||
    user.user_metadata?.picture ||
    null

  const { data: existingUser, error: existingUserError } = await supabase
    .from('users')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (existingUserError) {
    console.error('users 조회 오류:', existingUserError)
  } else if (!existingUser) {
    const { error: insertError } = await supabase.from('users').insert({
      id: user.id,
      email: user.email,
      name: userName,
      nickname: nickname,
      password_hash: '',
      rank: 0,
      post_count: 0,
      comment_count: 0,
      like_count: 0,
      avatar_color: '#64748b',
      avatar_url: userAvatar,
      channel_url: null,
      role: 'user',
    })

    if (insertError) {
      console.error('users 생성 오류:', insertError)
    }
  } else {
    const { error: updateError } = await supabase
      .from('users')
      .update({
        email: user.email,
        name: userName,
        avatar_url: userAvatar,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('users 업데이트 오류:', updateError)
    }
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          대시보드
        </h1>
        <LogoutButton />
      </div>

      <p className="mb-6 text-slate-700 dark:text-slate-300">
        로그인 사용자: {user.email}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-sm text-slate-500 dark:text-slate-400">총 사용자</p>
          <p className="text-2xl font-semibold mt-1">—</p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-sm text-slate-500 dark:text-slate-400">이번 달 수익</p>
          <p className="text-2xl font-semibold mt-1">—</p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-sm text-slate-500 dark:text-slate-400">활성 구독</p>
          <p className="text-2xl font-semibold mt-1">—</p>
        </div>
      </div>
    </div>
  )
}