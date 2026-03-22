import { redirect } from "next/navigation";

import { getSafeOAuthReturnPath } from "@/lib/auth/safe-return-path";
import { createClient } from "@/lib/supabase/server";

/**
 * 보호 라우트용 `next` 경로: URL에 `channel`이 있으면 로그인 유도·OAuth 복귀 시에도 동일하게 유지한다.
 * (클라이언트에서 재검사하지 않고 서버가 넘기는 경로만 사용)
 */
export function buildProtectedReturnPath(
  pathname: string,
  channelId: string | undefined
): string {
  if (channelId == null || channelId.trim() === "") {
    return pathname;
  }
  return `${pathname}?channel=${encodeURIComponent(channelId)}`;
}

/**
 * 앱 보호 라oute: 세션이 없으면 랜딩 `/?authModal=1&next=...` 로 보낸다.
 * OAuth 완료 후 `next`는 `auth/callback` → `getSafeOAuthReturnPath`와 동일 규칙으로 복귀한다.
 */
export async function redirectToLandingAuthUnlessSignedIn(
  postLoginPath: string
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (!error && session?.user) {
    return;
  }

  const safeNext = getSafeOAuthReturnPath(postLoginPath);
  const qs = new URLSearchParams({
    authModal: "1",
    next: safeNext,
  });

  redirect(`/?${qs.toString()}`);
}
