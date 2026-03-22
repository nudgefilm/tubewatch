"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TermsModal({ isOpen, onClose }: TermsModalProps) {
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
          <h2 className="text-xl font-display">TubeWatch 이용약관</h2>
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
            <h3 className="text-foreground font-medium mb-2">제1조 (목적)</h3>
            <p>본 약관은 TubeWatch(이하 "회사")가 제공하는 유튜브 채널 분석 및 성장 전략 서비스(이하 "서비스")의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임 사항을 규정함을 목적으로 합니다.</p>
          </section>

          <section>
            <h3 className="text-foreground font-medium mb-2">제2조 (정의)</h3>
            <p className="mb-2">본 약관에서 사용하는 용어의 정의는 다음과 같습니다.</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong>서비스:</strong> TubeWatch가 제공하는 유튜브 채널 분석, 성장 전략 추천, 데이터 기반 인사이트 제공 서비스</li>
              <li><strong>이용자:</strong> 본 약관에 동의하고 서비스를 이용하는 모든 사용자</li>
              <li><strong>계정:</strong> 이용자가 Google OAuth 로그인을 통해 생성한 서비스 이용 계정</li>
              <li><strong>분석 데이터:</strong> YouTube API를 통해 수집된 채널 정보 및 영상 데이터</li>
            </ul>
          </section>

          <section>
            <h3 className="text-foreground font-medium mb-2">제3조 (약관의 효력 및 변경)</h3>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>본 약관은 서비스 화면에 게시함으로써 효력이 발생합니다.</li>
              <li>회사는 관련 법령을 위반하지 않는 범위에서 약관을 변경할 수 있습니다.</li>
              <li>약관 변경 시 서비스 내 공지 또는 웹사이트 공지를 통해 안내합니다.</li>
              <li>변경된 약관 시행 이후 서비스를 계속 이용할 경우 변경에 동의한 것으로 간주됩니다.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-foreground font-medium mb-2">제4조 (서비스 제공)</h3>
            <p className="mb-2">회사는 다음 서비스를 제공합니다.</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>유튜브 채널 데이터 분석</li>
              <li>채널 성장 전략 리포트 제공</li>
              <li>콘텐츠 및 SEO 관련 인사이트 제공</li>
              <li>채널 비교 및 트렌드 분석</li>
              <li>기타 회사가 추가 개발하는 기능</li>
            </ul>
          </section>

          <section>
            <h3 className="text-foreground font-medium mb-2">제5조 (계정 및 로그인)</h3>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>서비스 이용은 Google 계정을 통한 로그인으로 이루어집니다.</li>
              <li>이용자는 본인의 Google 계정을 통해서만 서비스를 이용할 수 있습니다.</li>
              <li>계정 관리 책임은 이용자에게 있습니다.</li>
              <li>이용자는 계정 정보를 타인에게 공유해서는 안 됩니다.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-foreground font-medium mb-2">제6조 (서비스 이용 제한)</h3>
            <p className="mb-2">다음 행위는 금지됩니다.</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>서비스 시스템에 대한 해킹 또는 비정상적 접근</li>
              <li>자동화된 프로그램을 통한 무단 데이터 수집</li>
              <li>서비스의 정상 운영을 방해하는 행위</li>
              <li>타인의 계정을 무단 사용하는 행위</li>
              <li>TubeWatch 서비스 결과물을 무단 재판매하는 행위</li>
            </ul>
            <p className="mt-2">회사는 위 행위 발생 시 서비스 이용을 제한할 수 있습니다.</p>
          </section>

          <section>
            <h3 className="text-foreground font-medium mb-2">제7조 (데이터 이용)</h3>
            <p className="mb-2">TubeWatch는 다음 데이터를 활용합니다.</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>YouTube API를 통해 제공되는 공개 채널 데이터</li>
              <li>사용자가 등록한 채널 정보</li>
              <li>분석 결과 데이터</li>
            </ul>
            <p className="mt-2">이 데이터는 서비스 제공 및 개선을 위해 활용됩니다.</p>
          </section>

          <section>
            <h3 className="text-foreground font-medium mb-2">제8조 (서비스 제공의 중단)</h3>
            <p className="mb-2">회사는 다음 경우 서비스 제공을 중단할 수 있습니다.</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>시스템 점검</li>
              <li>서버 장애</li>
              <li>외부 API 장애</li>
              <li>기타 서비스 운영상 필요</li>
            </ul>
          </section>

          <section>
            <h3 className="text-foreground font-medium mb-2">제9조 (책임 제한)</h3>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>TubeWatch는 데이터 분석 기반 인사이트를 제공하는 서비스입니다.</li>
              <li>서비스에서 제공되는 분석 및 전략은 성장 결과를 보장하지 않습니다.</li>
              <li>이용자는 서비스 결과를 참고 자료로 활용해야 합니다.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-foreground font-medium mb-2">제10조 (지적재산권)</h3>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>서비스 UI 및 시스템에 대한 모든 권리는 회사에 있습니다.</li>
              <li>이용자는 서비스 콘텐츠를 무단 복제, 배포, 판매할 수 없습니다.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-foreground font-medium mb-2">제11조 (서비스 종료)</h3>
            <p>회사는 서비스 운영 정책에 따라 서비스 제공을 종료할 수 있습니다.</p>
          </section>

          <section>
            <h3 className="text-foreground font-medium mb-2">제12조 (준거법)</h3>
            <p>본 약관은 대한민국 법률을 따릅니다.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
