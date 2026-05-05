"use client";

import { useState, useEffect } from "react";

import {
  DEFAULT_POST_LOGIN_PATH,
  getSafeOAuthReturnPath,
} from "@/lib/auth/safe-return-path";
import { createClient } from "@/lib/supabase/client";
import { KakaoLoginButton } from "./KakaoLoginButton";

function detectInAppBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /KAKAOTALK|kakaotalk|Instagram|FBAN|FBAV|Line\/|NAVER|DaumApps|Twitter|MicroMessenger|Snapchat/i.test(ua);
}

type GoogleLoginButtonProps = {
  className?: string;
  label?: string;
  /** 로그인 완료 후 이동할 내부 경로 (검증됨). */
  returnToPath?: string | null;
  /** 이전 OAuth 시도 실패 여부 — 모달에서 전달 */
  hasError?: boolean;
};

export function GoogleLoginButton({
  className = "",
  label = "Google로 계속하기",
  returnToPath = null,
  hasError = false,
}: GoogleLoginButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(hasError ? "로그인에 실패했습니다. 다시 시도해주세요." : null);
  const [isInApp, setIsInApp] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setIsInApp(detectInAppBrowser());
  }, []);

  function handleCopyUrl() {
    void navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

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
        provider: "google",
        options: {
          redirectTo: callbackUrl.toString(),
          scopes: "openid email profile",
          queryParams: {
            access_type: "offline",
          },
        },
      });

      if (oauthError) {
        setError("Google 로그인을 시작할 수 없습니다. 잠시 후 다시 시도해주세요.");
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

  if (isInApp) {
    return (
      <div className="w-full space-y-3">
        <KakaoLoginButton
          returnToPath={returnToPath}
          label="카카오로 계속하기"
          className="w-full flex items-center justify-center gap-3 bg-[#FEE500] text-[#191919] font-medium py-4 px-6 rounded-xl hover:bg-[#FEE500]/90 transition-all duration-300 cursor-pointer disabled:opacity-70 disabled:pointer-events-none"
        />
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 space-y-2 dark:border-amber-800 dark:bg-amber-950/30">
          <p className="text-xs text-amber-700 dark:text-amber-400">
            앱 내 브라우저에서는 Google 로그인이 차단됩니다. Google로 가입하려면 주소를 복사해 <strong>Chrome</strong> 또는 <strong>Safari</strong>에서 열어주세요.
          </p>
          <button
            type="button"
            onClick={handleCopyUrl}
            className="flex items-center gap-2 rounded-lg border border-amber-400 bg-white px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-100 transition-colors dark:bg-amber-950 dark:text-amber-300"
          >
            {copied ? "복사됐습니다 ✓" : "주소 복사하기"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-2">
      <button
        type="button"
        onClick={() => { void handleLogin(); }}
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
      {error && (
        <p className="text-sm text-red-500 text-center">{error}</p>
      )}
    </div>
  );
}
