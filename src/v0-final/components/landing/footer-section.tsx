"use client";

import { useState } from "react";
import { AnimatedWave } from "./animated-wave";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/v0-final/components/ui/dialog";
import { ScrollArea } from "@/v0-final/components/ui/scroll-area";

export function FooterSection() {
  const [termsOpen, setTermsOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  return (
    <footer className="relative border-t border-foreground/10">
      {/* Animated wave background */}
      <div className="absolute inset-0 h-36 opacity-20 pointer-events-none overflow-hidden">
        <AnimatedWave />
      </div>
      
      <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Main Footer */}
        <div className="py-8 lg:py-12">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            {/* Brand Column - Left */}
            <div>
              <a href="/" className="inline-flex items-center mb-3 cursor-pointer">
                <span className="text-2xl font-display">TubeWatch™</span>
              </a>
              <p className="text-xs text-muted-foreground/70 font-mono mb-2">
                Built by Creators for Creators
              </p>
              <p className="text-xs text-muted-foreground/70">
                <button onClick={() => setTermsOpen(true)} className="hover:text-foreground transition-colors cursor-pointer">Terms of Service</button>
                <span className="mx-1">|</span>
                <button onClick={() => setPrivacyOpen(true)} className="hover:text-foreground transition-colors cursor-pointer">Privacy Policy</button>
                <span className="mx-1">|</span>
                <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors cursor-pointer">Google Privacy Policy</a>
                <span className="mx-1">|</span>
                <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors cursor-pointer">YouTube Terms of Service</a>
              </p>
            </div>

            {/* Company Info - Right */}
            <div className="text-xs text-muted-foreground/70 md:text-right leading-relaxed">
              <p>Unfold Lab | CEO: J. W. Jung | Email. nudgefilm@gmail.com</p>
              <p>Business License 136-11-23540</p>
              <p>Suite 214-S46, Apgujeong-ro 2-gil, Gangnam-gu, Seoul, Republic of Korea</p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-4 border-t border-foreground/10 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              All systems operational
            </span>
          </div>

          <p className="text-sm text-muted-foreground">
            Copyright <a href="/admin" className="hover:text-foreground transition-colors cursor-pointer">©</a> 2026 TubeWatch™ All rights reserved.
          </p>
        </div>
      </div>

      {/* Terms of Service Dialog */}
      <Dialog open={termsOpen} onOpenChange={setTermsOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="text-xl font-display">TubeWatch 이용약관 (Terms of Service)</DialogTitle>
            <p className="text-xs text-muted-foreground">최종 업데이트: 2026년 3월</p>
          </DialogHeader>
          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
              <section>
                <h3 className="font-semibold text-foreground mb-2">제1조 (목적)</h3>
                <p>본 약관은 TubeWatch(이하 &quot;회사&quot;)가 제공하는 유튜브 채널 분석 및 성장 전략 서비스(이하 &quot;서비스&quot;)의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임 사항을 규정함을 목적으로 합니다.</p>
              </section>

              <section>
                <h3 className="font-semibold text-foreground mb-2">제2조 (정의)</h3>
                <p className="mb-2">본 약관에서 사용하는 용어의 정의는 다음과 같습니다.</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li><strong>서비스</strong>: TubeWatch가 제공하는 유튜브 채널 분석, 성장 전략 추천, 데이터 기반 인사이트 제공 서비스</li>
                  <li><strong>이용자</strong>: 본 약관에 동의하고 서비스를 이용하는 모든 사용자</li>
                  <li><strong>계정</strong>: 이용자가 Google OAuth 로그인을 통해 생성한 서비스 이용 계정</li>
                  <li><strong>분석 데이터</strong>: YouTube API를 통해 수집된 채널 정보 및 영상 데이터</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-foreground mb-2">제3조 (약관의 효력 및 변경)</h3>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>본 약관은 서비스 화면에 게시함으로써 효력이 발생합니다.</li>
                  <li>회사는 관련 법령을 위반하지 않는 범위에서 약관을 변경할 수 있습니다.</li>
                  <li>약관 변경 시 서비스 내 공지 또는 웹사이트 공지를 통해 안내합니다.</li>
                  <li>변경된 약관 시행 이후 서비스를 계속 이용할 경우 변경에 동의한 것으로 간주됩니다.</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-foreground mb-2">제4조 (서비스 제공)</h3>
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
                <h3 className="font-semibold text-foreground mb-2">제5조 (계정 및 로그인)</h3>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>서비스 이용은 Google 계정을 통한 로그인으로 이루어집니다.</li>
                  <li>이용자는 본인의 Google 계정을 통해서만 서비스를 이용할 수 있습니다.</li>
                  <li>계정 관리 책임은 이용자에게 있습니다.</li>
                  <li>이용자는 계정 정보를 타인에게 공유해서는 안 됩니다.</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-foreground mb-2">제6조 (서비스 이용 제한)</h3>
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
                <h3 className="font-semibold text-foreground mb-2">제7조 (데이터 이용)</h3>
                <p className="mb-2">TubeWatch는 다음 데이터를 활용합니다.</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>YouTube API를 통해 제공되는 공개 채널 데이터</li>
                  <li>사용자가 등록한 채널 정보</li>
                  <li>분석 결과 데이터</li>
                </ul>
                <p className="mt-2">이 데이터는 서비스 제공 및 개선을 위해 활용됩니다.</p>
              </section>

              <section>
                <h3 className="font-semibold text-foreground mb-2">제8조 (서비스 제공의 중단)</h3>
                <p className="mb-2">회사는 다음 경우 서비스 제공을 중단할 수 있습니다.</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>시스템 점검</li>
                  <li>서버 장애</li>
                  <li>외부 API 장애</li>
                  <li>기타 서비스 운영상 필요</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-foreground mb-2">제9조 (책임 제한)</h3>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>TubeWatch는 데이터 분석 기반 인사이트를 제공하는 서비스입니다.</li>
                  <li>서비스에서 제공되는 분석 및 전략은 성장 결과를 보장하지 않습니다.</li>
                  <li>이용자는 서비스 결과를 참고 자료로 활용해야 합니다.</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-foreground mb-2">제10조 (지적재산권)</h3>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>서비스 UI 및 시스템에 대한 모든 권리는 회사에 있습니다.</li>
                  <li>이용자는 서비스 콘텐츠를 무단 복제, 배포, 판매할 수 없습니다.</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-foreground mb-2">제11조 (서비스 종료)</h3>
                <p>회사는 서비스 운영 정책에 따라 서비스 제공을 종료할 수 있습니다.</p>
              </section>

              <section>
                <h3 className="font-semibold text-foreground mb-2">제12조 (준거법)</h3>
                <p>본 약관은 대한민국 법률을 따릅니다.</p>
              </section>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Privacy Policy Dialog */}
      <Dialog open={privacyOpen} onOpenChange={setPrivacyOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="text-xl font-display">TubeWatch 개인정보 처리방침 (Privacy Policy)</DialogTitle>
            <p className="text-xs text-muted-foreground">최종 업데이트: 2026년 3월</p>
          </DialogHeader>
          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
              <section>
                <h3 className="font-semibold text-foreground mb-2">1. 개인정보 수집 항목</h3>
                <p className="mb-2">TubeWatch는 다음 정보를 수집할 수 있습니다.</p>
                <div className="ml-2 space-y-2">
                  <div>
                    <p className="font-medium text-foreground/80">로그인 정보</p>
                    <ul className="list-disc list-inside ml-2">
                      <li>Google 계정 이메일</li>
                      <li>Google 계정 ID</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium text-foreground/80">서비스 이용 정보</p>
                    <ul className="list-disc list-inside ml-2">
                      <li>등록된 YouTube 채널 ID</li>
                      <li>분석 요청 기록</li>
                      <li>서비스 이용 로그</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="font-semibold text-foreground mb-2">2. 개인정보 수집 목적</h3>
                <p className="mb-2">수집한 정보는 다음 목적으로 사용됩니다.</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>서비스 로그인 및 계정 관리</li>
                  <li>유튜브 채널 분석 서비스 제공</li>
                  <li>서비스 개선 및 오류 분석</li>
                  <li>사용자 지원</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-foreground mb-2">3. YouTube API 데이터 사용</h3>
                <p className="mb-2">TubeWatch는 YouTube API Services를 사용합니다. YouTube API 사용과 관련하여 다음 정책이 적용됩니다.</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li><a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Privacy Policy</a></li>
                  <li><a href="https://developers.google.com/youtube/terms/api-services-terms-of-service" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">YouTube API Services Terms</a></li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-foreground mb-2">4. 개인정보 보관 기간</h3>
                <p className="mb-2">개인정보는 다음 기간 동안 보관됩니다.</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>서비스 이용 기간 동안 보관</li>
                  <li>계정 삭제 요청 시 즉시 삭제</li>
                </ul>
                <p className="mt-2">단, 법령에 따라 일정 기간 보관이 필요한 경우 해당 기간 동안 보관됩니다.</p>
              </section>

              <section>
                <h3 className="font-semibold text-foreground mb-2">5. 개인정보 제3자 제공</h3>
                <p className="mb-2">TubeWatch는 이용자의 개인정보를 제3자에게 제공하지 않습니다. 단, 다음 경우 예외로 합니다.</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>법률에 따른 요청</li>
                  <li>이용자의 동의가 있는 경우</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-foreground mb-2">6. 개인정보 보호 조치</h3>
                <p className="mb-2">TubeWatch는 다음과 같은 보안 조치를 시행합니다.</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>HTTPS 암호화 통신</li>
                  <li>인증 기반 접근 제어</li>
                  <li>안전한 클라우드 인프라 사용</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-foreground mb-2">7. 이용자의 권리</h3>
                <p className="mb-2">이용자는 다음 권리를 가집니다.</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>개인정보 열람 요청</li>
                  <li>개인정보 수정 요청</li>
                  <li>계정 삭제 요청</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-foreground mb-2">8. 개인정보 문의</h3>
                <p>개인정보 관련 문의는 아래 이메일로 연락할 수 있습니다.</p>
                <p className="mt-2"><strong>Email:</strong> nudgefilm@gmail.com</p>
              </section>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </footer>
  );
}
