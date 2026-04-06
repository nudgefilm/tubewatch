import { NextResponse } from "next/server";

import {
  DEFAULT_POST_LOGIN_PATH,
  getSafeOAuthReturnPath,
} from "@/lib/auth/safe-return-path";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const oauthError = url.searchParams.get("error");
  const oauthErrorDesc = url.searchParams.get("error_description");
  const nextRaw = url.searchParams.get("next");
  const safeNext = getSafeOAuthReturnPath(nextRaw, DEFAULT_POST_LOGIN_PATH);

  // Google/Supabase가 code 대신 error를 보낸 경우
  if (oauthError) {
    console.error("[auth/callback] OAuth provider error:", oauthError, oauthErrorDesc);
    return NextResponse.redirect(new URL(`/?authModal=1&authError=1`, url.origin));
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(safeNext, url.origin));
    }

    console.error("[auth/callback] exchangeCodeForSession failed:", error.message, "| code:", error.code, "| status:", error.status);
  } else {
    console.error("[auth/callback] No code in callback URL. params:", url.searchParams.toString());
  }

  // 콜백 실패 시 로그인 모달을 다시 열어 사용자가 재시도할 수 있게 한다
  return NextResponse.redirect(new URL(`/?authModal=1&authError=1`, url.origin));
}
