"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PrivacyModal({ isOpen, onClose }: PrivacyModalProps) {
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
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300" />

      {/* Modal */}
      <div
        className="relative w-full max-w-[700px] max-h-[80vh] bg-background border border-foreground/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-background border-b border-foreground/10 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-display">TubeWatch 개인정보 처리방침</h2>
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)] text-sm text-muted-foreground leading-relaxed space-y-6">
          <p className="text-xs text-muted-foreground/70">최종 업데이트: 2026년 3월</p>

          <section>
            <h3 className="text-foreground font-medium mb-2">1. 개인정보 수집 항목</h3>
            <p className="mb-2">TubeWatch는 다음 정보를 수집할 수 있습니다.</p>
            
            <div className="ml-2 space-y-3">
              <div>
                <p className="text-foreground/80 font-medium">로그인 정보</p>
                <ul className="list-disc list-inside ml-2">
                  <li>Google 계정 이메일</li>
                  <li>Google 계정 ID</li>
                </ul>
              </div>
              
              <div>
                <p className="text-foreground/80 font-medium">서비스 이용 정보</p>
                <ul className="list-disc list-inside ml-2">
                  <li>등록된 YouTube 채널 ID</li>
                  <li>분석 요청 기록</li>
                  <li>서비스 이용 로그</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-foreground font-medium mb-2">2. 개인정보 수집 목적</h3>
            <p className="mb-2">수집한 정보는 다음 목적으로 사용됩니다.</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>서비스 로그인 및 계정 관리</li>
              <li>유튜브 채널 분석 서비스 제공</li>
              <li>서비스 개선 및 오류 분석</li>
              <li>사용자 지원</li>
            </ul>
          </section>

          <section>
            <h3 className="text-foreground font-medium mb-2">3. YouTube API 데이터 사용</h3>
            <p className="mb-2">TubeWatch는 YouTube API Services를 사용합니다. YouTube API 사용과 관련하여 다음 정책이 적용됩니다.</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>
                <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-foreground underline hover:text-foreground/80 cursor-pointer">
                  Google Privacy Policy
                </a>
              </li>
              <li>
                <a href="https://developers.google.com/youtube/terms/api-services-terms-of-service" target="_blank" rel="noopener noreferrer" className="text-foreground underline hover:text-foreground/80 cursor-pointer">
                  YouTube API Services Terms
                </a>
              </li>
            </ul>
          </section>

          <section>
            <h3 className="text-foreground font-medium mb-2">4. 개인정보 보관 기간</h3>
            <p className="mb-2">개인정보는 다음 기간 동안 보관됩니다.</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>서비스 이용 기간 동안 보관</li>
              <li>계정 삭제 요청 시 즉시 삭제</li>
            </ul>
            <p className="mt-2">단, 법령에 따라 일정 기간 보관이 필요한 경우 해당 기간 동안 보관됩니다.</p>
          </section>

          <section>
            <h3 className="text-foreground font-medium mb-2">5. 개인정보 제3자 제공</h3>
            <p className="mb-2">TubeWatch는 이용자의 개인정보를 제3자에게 제공하지 않습니다. 단, 다음 경우 예외로 합니다.</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>법률에 따른 요청</li>
              <li>이용자의 동의가 있는 경우</li>
            </ul>
          </section>

          <section>
            <h3 className="text-foreground font-medium mb-2">6. 개인정보 보호 조치</h3>
            <p className="mb-2">TubeWatch는 다음과 같은 보안 조치를 시행합니다.</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>HTTPS 암호화 통신</li>
              <li>인증 기반 접근 제어</li>
              <li>안전한 클라우드 인프라 사용</li>
            </ul>
          </section>

          <section>
            <h3 className="text-foreground font-medium mb-2">7. 이용자의 권리</h3>
            <p className="mb-2">이용자는 다음 권리를 가집니다.</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>개인정보 열람 요청</li>
              <li>개인정보 수정 요청</li>
              <li>계정 삭제 요청</li>
            </ul>
          </section>

          <section>
            <h3 className="text-foreground font-medium mb-2">8. 개인정보 문의</h3>
            <p>개인정보 관련 문의는 아래 이메일로 연락할 수 있습니다.</p>
            <p className="mt-2 text-foreground">Email: nudgefilm@gmail.com</p>
          </section>
        </div>
      </div>
    </div>
  );
}
