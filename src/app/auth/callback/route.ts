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

  console.log("[Auth/callback] code:", code ? "present" : "MISSING");
  console.log("[Auth/callback] nextRaw:", nextRaw, "→ safeNext:", safeNext);

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("[Auth/callback] exchangeCodeForSession FAILED:", error.message, "status:", error.status);
    } else {
      // 세션 교환 성공 — 실제 user를 확인해 로그
      const { data: { user }, error: userErr } = await supabase.auth.getUser();
      console.log("[Auth/callback] session exchanged OK. userId:", user?.id ?? null, "userErr:", userErr?.message ?? null);
      console.log("[Auth/callback] redirecting to:", safeNext);
      return NextResponse.redirect(new URL(safeNext, url.origin));
    }
  } else {
    console.error("[Auth/callback] REJECTED: no code in query params");
  }

  return NextResponse.redirect(
    new URL(`/?error=${encodeURIComponent("auth")}`, url.origin)
  );
}
