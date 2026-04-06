import { NextResponse } from "next/server";

import {
  DEFAULT_POST_LOGIN_PATH,
  getSafeOAuthReturnPath,
} from "@/lib/auth/safe-return-path";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

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

  if (!code) {
    console.error("[auth/callback] No code in callback URL. params:", url.searchParams.toString());
    return NextResponse.redirect(new URL(`/?authModal=1&authError=1`, url.origin));
  }

  const supabase = await createClient();
  const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);

  if (sessionError || !sessionData.user) {
    console.error("[auth/callback] exchangeCodeForSession failed:", sessionError?.message, "| code:", sessionError?.code);
    return NextResponse.redirect(new URL(`/?authModal=1&authError=1`, url.origin));
  }

  // 트리거 의존 없이 앱 레벨에서 직접 프로필 보장
  // service role로 upsert하므로 RLS·트리거 실패에 관계없이 항상 동작
  const userId = sessionData.user.id;
  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .upsert({ id: userId, role: "user" }, { onConflict: "id", ignoreDuplicates: true });

  if (profileError) {
    // 프로필 생성 실패는 로그로 남기되 로그인은 계속 진행
    console.error("[auth/callback] profile upsert failed:", profileError.message);
  }

  return NextResponse.redirect(new URL(safeNext, url.origin));
}
