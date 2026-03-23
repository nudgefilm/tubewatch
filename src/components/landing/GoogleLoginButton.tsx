"use client";

import { useState } from "react";

import {
  DEFAULT_POST_LOGIN_PATH,
  getSafeOAuthReturnPath,
} from "@/lib/auth/safe-return-path";
import { createClient } from "@/lib/supabase/client";

type GoogleLoginButtonProps = {
  className?: string;
  label?: string;
  /** 로그인 완료 후 이동할 내부 경로 (검증됨). */
  returnToPath?: string | null;
};

export function GoogleLoginButton({
  className = "",
  label = "Google로 계속하기",
  returnToPath = null,
}: GoogleLoginButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogin(): Promise<void> {
    if (isLoading) {
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const origin = window.location.origin;
      const safeNext = getSafeOAuthReturnPath(
        returnToPath,
        DEFAULT_POST_LOGIN_PATH
      );
      const callbackUrl = new URL("/auth/callback", origin);
      callbackUrl.searchParams.set("next", safeNext);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl.toString(),
          scopes: "openid email profile",
          queryParams: {
            access_type: "offline",
          },
        },
      });

      if (error) {
        setIsLoading(false);
        return;
      }

      if (data.url) {
        window.location.assign(data.url);
        return;
      }

      setIsLoading(false);
    } catch {
      setIsLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => {
        void handleLogin();
      }}
      disabled={isLoading}
      className={className}
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      </svg>
      <span className="group-hover:translate-x-0.5 transition-transform">
        {isLoading ? "연결 중…" : label}
      </span>
    </button>
  );
}
