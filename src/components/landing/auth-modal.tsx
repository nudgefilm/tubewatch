"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

import { GoogleLoginButton } from "./GoogleLoginButton";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** OAuth 완료 후 이동할 경로 (`next` 쿼리 등에서 전달, 없으면 기본 `/analysis`). */
  returnToPath?: string | null;
  /** 이전 OAuth 시도 실패 여부 — 콜백 오류 후 모달을 다시 열 때 true */
  hasError?: boolean;
}

export function AuthModal({ isOpen, onClose, returnToPath = null, hasError = false }: AuthModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop - matching how-it-works modal */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300" />

      {/* Modal */}
      <div
        className="relative w-full max-w-[420px] bg-background border border-foreground/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer z-10 rounded-full hover:bg-foreground/5"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="p-8 pt-12">
          {/* Logo/Title */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-heading mb-3">TubeWatch</h2>
            <p className="text-foreground text-base font-medium mb-1">
              채널이 정체되는 이유
            </p>
            <p className="text-foreground text-base mb-4">
              데이터는 알고 있습니다.
            </p>
            <p className="text-sm text-muted-foreground">
              Google 계정으로 계속하면 로그인 또는<br />첫 방문 시 자동으로 가입됩니다.
            </p>
          </div>

          <GoogleLoginButton
            returnToPath={returnToPath}
            label="Google로 계속하기"
            hasError={hasError}
            className="w-full flex items-center justify-center gap-3 bg-foreground text-background font-medium py-4 px-6 rounded-xl hover:bg-foreground/90 transition-all duration-300 cursor-pointer group disabled:opacity-70 disabled:pointer-events-none"
          />

          {/* Terms Notice */}
          <p className="text-xs text-muted-foreground text-center mt-6 leading-relaxed">
            계속하기를 누르면 TubeWatch의{" "}
            <a href="/terms" className="underline hover:text-foreground cursor-pointer">이용약관</a> 및{" "}
            <a href="/privacy" className="underline hover:text-foreground cursor-pointer">개인정보처리방침</a>에 동의하게 됩니다.
          </p>
        </div>

        {/* Footer Links */}
        <div className="px-8 py-4 border-t border-foreground/10 flex justify-center gap-6 text-xs text-muted-foreground">
          <a href="/terms" className="hover:text-foreground transition-colors cursor-pointer">Terms of Service</a>
          <a href="/privacy" className="hover:text-foreground transition-colors cursor-pointer">Privacy Policy</a>
        </div>
      </div>
    </div>
  );
}
