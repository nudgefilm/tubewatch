import { type NextRequest, NextResponse } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

/**
 * OAuth 콜백(`/auth/*`)은 미들웨어에서 Supabase를 돌리지 않는다.
 * PKCE·세션 교환과 쿠키 경합·중복 getUser로 인한 지연/abort를 막기 위함.
 *
 * `matcher`의 `auth/` 제외로 `/auth/callback` 등은 미들웨어 미실행.
 * `/auth` 단독 경로는 matcher가 잡을 수 있어 `startsWith("/auth")`로 동일하게 통과 처리.
 *
 * 검색 엔진·SNS 봇(facebookexternalhit, Googlebot 등)은 세션 쿠키가 없어
 * updateSession에서 불필요한 Supabase 호출이 발생하거나 503/403을 유발할 수 있다.
 * User-Agent에 봇 키워드가 포함된 요청은 세션 처리 없이 바로 통과시킨다.
 */
const BOT_UA_PATTERN =
  /bot|crawl|spider|facebookexternalhit|Twitterbot|LinkedInBot|Slackbot|WhatsApp|TelegramBot|Discordbot|Googlebot|Bingbot|Yandex|Baidu|DuckDuck/i;

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/auth")) {
    return NextResponse.next()
  }

  // channelreport.net → /channelreport/* 내부 라우트로 매핑
  const host = request.headers.get("host") ?? ""
  if (host.includes("channelreport")) {
    const pathname = request.nextUrl.pathname
    if (!pathname.startsWith("/channelreport") && !pathname.startsWith("/api")) {
      const url = request.nextUrl.clone()
      url.pathname = `/channelreport${pathname === "/" ? "" : pathname}`
      return NextResponse.rewrite(url)
    }
  }

  const ua = request.headers.get("user-agent") ?? ""
  if (BOT_UA_PATTERN.test(ua)) {
    return NextResponse.next()
  }

  return updateSession(request)
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|auth/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
