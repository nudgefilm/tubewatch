import { redirect } from 'next/navigation'
import RegisterChannelForm from '@/components/channels/RegisterChannelForm'
import ChannelCard from '@/components/channels/ChannelCard'
import { createClient } from '@/lib/supabase/server'
import { isAdminUser, getChannelLimit } from '@/lib/admin/adminTools'

type UserChannel = {
  id: string
  user_id: string
  channel_url: string | null
  channel_id: string | null
  channel_title: string | null
  thumbnail_url: string | null
  subscriber_count: number | null
  last_analysis_requested_at: string | null
  last_analyzed_at: string | null
  created_at: string
  updated_at: string
}

export default async function ChannelsPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  const { data: channels, error: channelsError } = await supabase
    .from('user_channels')
    .select(`
      id,
      user_id,
      channel_url,
      channel_id,
      channel_title,
      thumbnail_url,
      subscriber_count,
      last_analysis_requested_at,
      last_analyzed_at,
      created_at,
      updated_at
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (channelsError) {
    console.error('channels page error:', channelsError)
  }

  const safeChannels: UserChannel[] = channels ?? []
  const currentCount = safeChannels.length
  const admin = isAdminUser(user.email)
  const maxCount = getChannelLimit(user.email)

  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-4xl font-bold text-gray-900">내 채널</h1>
          {admin ? (
            <span className="rounded-md bg-indigo-100 px-2 py-1 text-xs font-semibold text-indigo-700">
              Admin
            </span>
          ) : null}
        </div>
        <p className="mt-3 text-lg text-gray-600">
          등록된 채널을 관리하고 분석 요청을 진행할 수 있습니다.
        </p>
      </div>

      <section className="mb-10">
        <RegisterChannelForm currentCount={currentCount} maxCount={maxCount} isAdmin={admin} />
      </section>

      <section>
        {safeChannels.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500">
            아직 등록된 채널이 없습니다.
          </div>
        ) : (
          <div className="grid gap-6">
            {safeChannels.map((channel) => (
              <ChannelCard key={channel.id} channel={channel} isAdmin={admin} />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}