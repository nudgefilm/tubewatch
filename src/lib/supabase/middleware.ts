import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = {
  name: string;
  value: string;
  options: CookieOptions;
};

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            if (value) {
              response.cookies.set(name, value, options);
            } else {
              response.cookies.delete(name);
            }
          });
        },
      },
    }
  );

  /**
   * getUser()는 매 요청마다 Auth 서버 검증을 유발해 지연·"The user aborted a request" 로그를 키울 수 있다.
   * 세션 갱신은 Route Handler·Server Component에서 필요 시 처리하고, 미들웨어는 쿠키 동기화용 getSession만 유지한다.
   */
  await supabase.auth.getSession();

  return response;
}
