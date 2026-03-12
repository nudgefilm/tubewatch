import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { parseChannelUrl } from '@/lib/youtube/parseChannelUrl'
import { getChannelInfo } from '@/lib/youtube/getChannelInfo'
import { getChannelLimit } from '@/lib/admin/adminTools'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

function getAuthToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  return authHeader.replace('Bearer ', '').trim()
}

export async function POST(request: NextRequest) {
  try {
    console.log('--- /api/channels POST start ---')
    console.log('SUPABASE_URL exists:', !!SUPABASE_URL)
    console.log('SUPABASE_ANON_KEY exists:', !!SUPABASE_ANON_KEY)
    console.log(
      'SUPABASE_SERVICE_ROLE_KEY exists:',
      !!SUPABASE_SERVICE_ROLE_KEY
    )
    console.log(
      'SUPABASE_SERVICE_ROLE_KEY prefix:',
      SUPABASE_SERVICE_ROLE_KEY
        ? SUPABASE_SERVICE_ROLE_KEY.slice(0, 20)
        : 'MISSING'
    )

    const token = getAuthToken(request)

    if (!token) {
      return NextResponse.json(
        { error: '인증 토큰이 없습니다.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const channelUrl = String(body?.channel_url || '').trim()

    console.log('channelUrl:', channelUrl)

    if (!channelUrl) {
      return NextResponse.json(
        { error: 'channel_url이 필요합니다.' },
        { status: 400 }
      )
    }

    const parsed = parseChannelUrl(channelUrl)
    console.log('parsed:', parsed)

    if (!parsed) {
      return NextResponse.json(
        {
          error:
            '지원하지 않는 유튜브 채널 URL 형식입니다. /@handle 또는 /channel/UC... 형식을 사용해 주세요.',
        },
        { status: 400 }
      )
    }

    const userSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    const {
      data: { user },
      error: userError,
    } = await userSupabase.auth.getUser()

    console.log('userError:', userError)
    console.log('user exists:', !!user)
    console.log('user.id:', user?.id ?? null)

    if (userError || !user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.', detail: userError?.message ?? null },
        { status: 401 }
      )
    }

    const adminSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    console.log('adminSupabase created')

    // 1) 가장 단순한 연결 테스트
    const { data: pingRows, error: pingError } = await adminSupabase
      .from('user_channels')
      .select('id')
      .limit(1)

    console.log('pingError:', pingError)
    console.log('pingRows length:', pingRows?.length ?? 0)

    if (pingError) {
      return NextResponse.json(
        {
          error: 'user_channels 기본 조회에 실패했습니다.',
          detail: pingError.message ?? null,
          raw: pingError,
        },
        { status: 500 }
      )
    }

    // 2) count 대신 단순 select로 사용자 채널 수 계산
    const { data: userRows, error: countError } = await adminSupabase
      .from('user_channels')
      .select('id, user_id')
      .eq('user_id', user.id)

    console.log('countError:', countError)
    console.log('userRows length:', userRows?.length ?? 0)

    if (countError) {
      return NextResponse.json(
        {
          error: '채널 수 확인에 실패했습니다.',
          detail: countError.message ?? null,
          raw: countError,
        },
        { status: 500 }
      )
    }

    const count = userRows?.length ?? 0
    const maxChannels = getChannelLimit(user.email)

    if (count >= maxChannels) {
      return NextResponse.json(
        { error: `채널은 최대 ${maxChannels}개까지 등록할 수 있습니다.` },
        { status: 400 }
      )
    }

    const info = await getChannelInfo(parsed)
    console.log('channel info:', info)

    const { data: existingChannel, error: existingError } = await adminSupabase
      .from('user_channels')
      .select('id')
      .eq('user_id', user.id)
      .eq('channel_id', info.channelId)
      .maybeSingle()

    console.log('existingError:', existingError)
    console.log('existingChannel:', existingChannel)

    if (existingError) {
      return NextResponse.json(
        {
          error: '기존 채널 확인에 실패했습니다.',
          detail: existingError.message ?? null,
          raw: existingError,
        },
        { status: 500 }
      )
    }

    if (existingChannel) {
      return NextResponse.json(
        { error: '이미 등록된 채널입니다.' },
        { status: 409 }
      )
    }

    const { data, error: insertError } = await adminSupabase
      .from('user_channels')
      .insert({
        user_id: user.id,
        channel_url: channelUrl,
        channel_id: info.channelId,
        channel_title: info.title,
        thumbnail_url: info.thumbnailUrl,
        subscriber_count: info.subscriberCount,
      })
      .select(
        `
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
      `
      )
      .single()

    console.log('insertError:', insertError)
    console.log('inserted data:', data)

    if (insertError) {
      return NextResponse.json(
        {
          error: '채널 등록에 실패했습니다.',
          detail: insertError.message ?? null,
          raw: insertError,
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: '채널이 등록되었습니다.',
        data,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('channels POST fatal error:', error)

    const message = error instanceof Error ? error.message : 'UNKNOWN_ERROR'

    if (message === 'YOUTUBE_API_KEY_MISSING') {
      return NextResponse.json(
        { error: '서버에 YOUTUBE_API_KEY가 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    if (
      message === 'CHANNEL_NOT_FOUND' ||
      message === 'CHANNEL_NOT_FOUND_BY_HANDLE'
    ) {
      return NextResponse.json(
        { error: '채널 정보를 찾을 수 없습니다. URL을 다시 확인해 주세요.' },
        { status: 404 }
      )
    }

    if (message.startsWith('YOUTUBE_API_ERROR:')) {
      return NextResponse.json(
        {
          error: 'YouTube API 호출에 실패했습니다.',
          detail: message,
        },
        { status: 502 }
      )
    }

    return NextResponse.json(
      {
        error: '서버 오류가 발생했습니다.',
        detail: message,
      },
      { status: 500 }
    )
  }
}