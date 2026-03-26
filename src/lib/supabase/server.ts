import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

type CookieToSet = {
  name: string
  value: string
  options: CookieOptions
}

function getRequiredEnv(name: string) {
  const value = process.env[name]

  if (!value) {
    throw new Error(`${name} is not defined`)
  }

  return value
}

export async function createClient() {
  const cookieStore = await cookies()

  const supabaseUrl = getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL')
  const supabaseAnonKey = getRequiredEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            if (value) {
              cookieStore.set(name, value, {
                ...(options ?? {}),
                path: options?.path ?? "/",
              })
            } else {
              cookieStore.delete(name)
            }
          })
        } catch {
          // Server Component 렌더 중 set이 불가할 수 있음 — 미들웨어에서 세션을 갱신합니다.
        }
      },
    },
  })
}
