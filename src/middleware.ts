import { type NextRequest, NextResponse } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

/**
 * OAuth 콜백(`/auth/*`)은 미들웨어에서 Supabase를 돌리지 않는다.
 * PKCE·세션 교환과 쿠키 경합·중복 getUser로 인한 지연/abort를 막기 위함.
 *
 * `matcher`의 `auth/` 제외로 `/auth/callback` 등은 미들웨어 미실행.
 * `/auth` 단독 경로는 matcher가 잡을 수 있어 `startsWith("/auth")`로 동일하게 통과 처리.
 */
export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/auth")) {
    return NextResponse.next()
  }
  return updateSession(request)
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|auth/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
