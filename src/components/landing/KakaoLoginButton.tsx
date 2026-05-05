"use client";

import { useState } from "react";

import {
  DEFAULT_POST_LOGIN_PATH,
  getSafeOAuthReturnPath,
} from "@/lib/auth/safe-return-path";
import { createClient } from "@/lib/supabase/client";

type KakaoLoginButtonProps = {
  className?: string;
  label?: string;
  returnToPath?: string | null;
};

export function KakaoLoginButton({
  className = "",
  label = "카카오로 계속하기",
  returnToPath = null,
}: KakaoLoginButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(): Promise<void> {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
      const origin = siteUrl
        ? siteUrl.replace(/\/$/, "")
        : window.location.origin;
      const safeNext = getSafeOAuthReturnPath(
        returnToPath,
        DEFAULT_POST_LOGIN_PATH
      );
      const callbackUrl = new URL("/auth/callback", origin);
      callbackUrl.searchParams.set("next", safeNext);

      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "kakao",
        options: {
          redirectTo: callbackUrl.toString(),
        },
      });

      if (oauthError) {
        setError("카카오 로그인을 시작할 수 없습니다. 잠시 후 다시 시도해주세요.");
        setIsLoading(false);
        return;
      }

      if (data.url) {
        window.location.assign(data.url);
        return;
      }

      setIsLoading(false);
    } catch {
      setError("네트워크 오류가 발생했습니다. 다시 시도해주세요.");
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full space-y-2">
      <button
        type="button"
        onClick={() => { void handleLogin(); }}
        disabled={isLoading}
        className={className}
      >
        {/* Kakao logo */}
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12 3C6.477 3 2 6.477 2 10.8c0 2.717 1.711 5.11 4.32 6.498-.19.707-.688 2.56-.788 2.957-.124.492.182.486.383.354.158-.105 2.506-1.704 3.518-2.393.515.073 1.045.111 1.567.111 5.523 0 10-3.477 10-7.727C21 6.477 17.523 3 12 3z" />
        </svg>
        <span>
          {isLoading ? "연결 중…" : label}
        </span>
      </button>
      {error && (
        <p className="text-sm text-red-500 text-center">{error}</p>
      )}
    </div>
  );
}
