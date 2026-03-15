"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";

export type AuthMode = "signin" | "signup";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: AuthMode;
}

export function AuthModal({
  open,
  onOpenChange,
  mode,
}: AuthModalProps): JSX.Element {
  const [isLoading, setIsLoading] = useState(false);

  async function handleGoogleAuth(): Promise<void> {
    if (isLoading) return;

    setIsLoading(true);
    const supabase = createClient();
    const origin = window.location.origin;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback`,
      },
    });

    if (error) {
      console.error("Google login error:", error);
      setIsLoading(false);
    }
  }

  const isSignUp = mode === "signup";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isSignUp ? "회원가입" : "로그인"}</DialogTitle>
          <DialogDescription>
            {isSignUp
              ? "Google 계정으로 1분 안에 TubeWatch를 시작하세요."
              : "기존 계정으로 TubeWatch에 로그인하세요."}
          </DialogDescription>
        </DialogHeader>

        {isSignUp && (
          <ul className="flex flex-col gap-2 text-[13px] text-[#5f6158]">
            <li className="flex items-center gap-2">
              <CheckIcon />
              <span>Google 계정만 사용합니다</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckIcon />
              <span>비밀번호 생성이 필요 없습니다</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckIcon />
              <span>가입 후 바로 채널 분석을 시작할 수 있습니다</span>
            </li>
          </ul>
        )}

        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={isLoading}
          className="mt-2 flex w-full items-center justify-center gap-2.5 rounded-[10px] bg-[#161616] px-5 py-3 text-[14px] font-semibold text-white transition hover:bg-[#2a2a2a] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <GoogleIcon />
          {isLoading
            ? "로그인 중..."
            : isSignUp
              ? "Google로 시작하기"
              : "Google로 로그인"}
        </button>
      </DialogContent>
    </Dialog>
  );
}

function GoogleIcon(): JSX.Element {
  return (
    <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function CheckIcon(): JSX.Element {
  return (
    <svg
      className="h-4 w-4 flex-shrink-0 text-[#22c55e]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
