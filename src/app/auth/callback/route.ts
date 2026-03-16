import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('exchangeCodeForSession error:', error)
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  const rawNext = requestUrl.searchParams.get('next')

  const allowedPrefixes: string[] = [
    '/channels',
    '/analysis',
    '/action-plan',
    '/seo-lab',
    '/benchmark',
    '/next-trend',
    '/',
  ]

  let nextPath = '/channels'

  if (rawNext && rawNext.startsWith('/')) {
    const isUnsafeDoubleSlash = rawNext.startsWith('//')
    const isUnsafeProtocolLike =
      rawNext.startsWith('/http:') || rawNext.startsWith('/https:')

    if (!isUnsafeDoubleSlash && !isUnsafeProtocolLike) {
      const isAllowed = allowedPrefixes.some(
        (prefix) =>
          rawNext === prefix || (prefix !== '/' && rawNext.startsWith(`${prefix}/`)),
      )

      if (isAllowed) {
        nextPath = rawNext
      }
    }
  }

  return NextResponse.redirect(new URL(nextPath, request.url))
}