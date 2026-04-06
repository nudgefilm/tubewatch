import { NextResponse } from "next/server";

import {
  DEFAULT_POST_LOGIN_PATH,
  getSafeOAuthReturnPath,
} from "@/lib/auth/safe-return-path";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const nextRaw = url.searchParams.get("next");
  const safeNext = getSafeOAuthReturnPath(nextRaw, DEFAULT_POST_LOGIN_PATH);

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(safeNext, url.origin));
    }
  }

  // 콜백 실패 시 로그인 모달을 다시 열어 사용자가 재시도할 수 있게 한다
  return NextResponse.redirect(
    new URL(`/?authModal=1&authError=1`, url.origin)
  );
}
