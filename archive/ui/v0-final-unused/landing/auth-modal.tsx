"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const router = useRouter();
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
            <h2 className="text-3xl font-display mb-3">TubeWatch™</h2>
            <p className="text-foreground text-base mb-4">
              Google 계정으로 빠르게 시작하세요
            </p>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>TubeWatch™는 채널 데이터를 기반으로 성장 전략을 분석합니다.</p>
            </div>
          </div>

          {/* Google Login Button */}
          <button
            className="w-full flex items-center justify-center gap-3 bg-foreground text-background font-medium py-4 px-6 rounded-xl hover:bg-foreground/90 transition-all duration-300 cursor-pointer group"
            onClick={() => {
              router.push("/login?next=/channels");
            }}
          >
            {/* Google G Logo */}
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span className="group-hover:translate-x-0.5 transition-transform">Google로 시작하기</span>
          </button>

          {/* Terms Notice */}
          <p className="text-xs text-muted-foreground text-center mt-6 leading-relaxed">
            로그인을 진행하면 TubeWatch™의{" "}
            <span className="underline">이용약관</span> 및{" "}
            <span className="underline">개인정보처리방침</span>에 동의하게 됩니다.
          </p>
        </div>

        {/* Footer Links */}
        <div className="px-8 py-4 border-t border-foreground/10 flex justify-center gap-6 text-xs text-muted-foreground">
          <span>Terms of Service</span>
          <span>Privacy Policy</span>
        </div>
      </div>
    </div>
  );
}
