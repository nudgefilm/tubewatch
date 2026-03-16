"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/v0-final/components/ui/dialog";
import { Button } from "@/v0-final/components/ui/button";

export type AuthModalMode = "signin" | "signup";

export interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: AuthModalMode;
}

const signinConfig = {
  title: "로그인",
  description: "기존 계정으로 TubeWatch에 로그인하세요.",
  buttonText: "Google로 로그인",
  helperItems: null as string[] | null,
};

const signupConfig = {
  title: "회원가입",
  description: "Google 계정으로 1분 안에 TubeWatch를 시작하세요.",
  buttonText: "Google로 시작하기",
  helperItems: [
    "Google 계정만 사용합니다",
    "비밀번호 생성이 필요 없습니다",
    "가입 후 바로 채널 분석을 시작할 수 있습니다",
  ] as string[],
};

export function AuthModal({ open, onOpenChange, mode }: AuthModalProps): JSX.Element {
  const config = mode === "signin" ? signinConfig : signupConfig;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{config.title}</DialogTitle>
          <DialogDescription>{config.description}</DialogDescription>
        </DialogHeader>
        {config.helperItems !== null && config.helperItems.length > 0 && (
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            {config.helperItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )}
        <a href="/login">
          <Button className="w-full bg-foreground hover:bg-foreground/90 text-background rounded-full cursor-pointer">
            {config.buttonText}
          </Button>
        </a>
      </DialogContent>
    </Dialog>
  );
}
