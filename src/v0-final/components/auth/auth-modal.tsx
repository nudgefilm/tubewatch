"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/v0-final/components/ui/dialog";
import { Button } from "@/v0-final/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { Check } from "lucide-react";

export type AuthMode = "signin" | "signup";

export interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: AuthMode;
}

export function AuthModal({ open, onOpenChange, mode = "signin" }: AuthModalProps): JSX.Element {
  const [isLoading, setIsLoading] = useState(false);
  const isSignUp = mode === "signup";

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
      console.error("Google auth error:", error);
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {isSignUp ? "회원가입" : "로그인"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {isSignUp
              ? "Google 계정으로 1분 안에 TubeWatch를 시작하세요."
              : "기존 계정으로 TubeWatch에 로그인하세요."}
          </DialogDescription>
        </DialogHeader>

        {isSignUp && (
          <ul className="flex flex-col gap-2.5 py-2">
            <li className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10">
                <Check className="h-3.5 w-3.5 text-emerald-500" />
              </span>
              <span>Google 계정만 사용합니다</span>
            </li>
            <li className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10">
                <Check className="h-3.5 w-3.5 text-emerald-500" />
              </span>
              <span>비밀번호 생성이 필요 없습니다</span>
            </li>
            <li className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10">
                <Check className="h-3.5 w-3.5 text-emerald-500" />
              </span>
              <span>가입 후 바로 채널 분석을 시작할 수 있습니다</span>
            </li>
          </ul>
        )}

        <Button
          onClick={handleGoogleAuth}
          disabled={isLoading}
          className="w-full bg-foreground hover:bg-foreground/90 text-background rounded-full h-11 mt-2 cursor-pointer disabled:opacity-60"
        >
          <GoogleIcon />
          {isLoading
            ? "로그인 중..."
            : isSignUp
              ? "Google로 시작하기"
              : "Google로 로그인"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function GoogleIcon(): JSX.Element {
  return (
    <svg className="h-[18px] w-[18px] mr-2" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="currentColor"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="currentColor"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="currentColor"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="currentColor"
      />
    </svg>
  );
}
