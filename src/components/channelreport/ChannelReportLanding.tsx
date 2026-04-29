"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Check, X } from "lucide-react";
import { ProcessSection } from "./ProcessSection";
import { IncludesSection } from "./IncludesSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ─── B2B 문의 모달 ────────────────────────────────────────────────────────────

function B2BInquiryModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    agencyName: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    channelUrl: "",
    taxInvoiceRequested: false,
    taxInvoiceInfo: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function set(key: keyof typeof form, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit() {
    if (!form.agencyName || !form.contactName || !form.contactEmail || !form.channelUrl) {
      setError("기관명, 담당자명, 이메일, 채널 URL은 필수 항목입니다.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/b2b-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.ok) {
        setSuccess(true);
      } else {
        setError(json.error ?? "접수에 실패했습니다.");
      }
    } catch {
      setError("요청 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-lg rounded-2xl border bg-background p-8 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-bold">서비스 신청</h2>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-foreground/5">
            <X className="h-4 w-4" />
          </button>
        </div>

        {success ? (
          <div className="py-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
              <Check className="h-6 w-6 text-green-500" />
            </div>
            <p className="font-semibold">신청이 접수됐습니다.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              담당자가 확인 후 이메일로 결제 안내를 발송드립니다.
            </p>
            <Button className="mt-6" onClick={onClose}>닫기</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">기관명 <span className="text-destructive">*</span></Label>
                <Input
                  className="mt-1"
                  placeholder="기관명"
                  value={form.agencyName}
                  onChange={(e) => set("agencyName", e.target.value)}
                />
              </div>
              <div>
                <Label className="text-sm">담당자명 <span className="text-destructive">*</span></Label>
                <Input
                  className="mt-1"
                  placeholder="홍길동"
                  value={form.contactName}
                  onChange={(e) => set("contactName", e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label className="text-sm">담당자 이메일 <span className="text-destructive">*</span></Label>
              <Input
                className="mt-1"
                type="email"
                placeholder="contact@agency.com"
                value={form.contactEmail}
                onChange={(e) => set("contactEmail", e.target.value)}
              />
            </div>
            <div>
              <Label className="text-sm">담당자 연락처</Label>
              <Input
                className="mt-1"
                type="tel"
                placeholder="010-0000-0000"
                value={form.contactPhone}
                onChange={(e) => set("contactPhone", e.target.value)}
              />
            </div>
            <div>
              <Label className="text-sm">분석 대상 채널 URL <span className="text-destructive">*</span></Label>
              <Input
                className="mt-1"
                placeholder="https://www.youtube.com/@channelname"
                value={form.channelUrl}
                onChange={(e) => set("channelUrl", e.target.value)}
              />
            </div>
            <div className="flex items-start gap-2">
              <input
                id="tax"
                type="checkbox"
                className="mt-0.5"
                checked={form.taxInvoiceRequested}
                onChange={(e) => set("taxInvoiceRequested", e.target.checked)}
              />
              <Label htmlFor="tax" className="cursor-pointer text-sm">세금계산서 발행 요청</Label>
            </div>
            {form.taxInvoiceRequested && (
              <div>
                <Label className="text-sm">사업자 정보 (사업자번호 등)</Label>
                <Input
                  className="mt-1"
                  placeholder="123-45-67890"
                  value={form.taxInvoiceInfo}
                  onChange={(e) => set("taxInvoiceInfo", e.target.value)}
                />
              </div>
            )}

            {error && <p className="text-xs text-destructive" role="alert">{error}</p>}

            <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              신청 접수 후 담당자 이메일로 결제 안내가 발송됩니다. (카드 결제 또는 현금 계좌이체)
            </div>

            <Button className="w-full" onClick={handleSubmit} disabled={loading}>
              {loading ? "접수 중..." : "신청하기"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}


// ─── 히어로 스탯 ─────────────────────────────────────────────────────────────

const HERO_STATS = [
  { value: "50", unit: "개", label: "영상 전수 분석" },
  { value: "30", unit: "개", label: "채널 시그널" },
  { value: "30", unit: "일", label: "실행 로드맵" },
  { value: "3", unit: "회", label: "정기 전략 리포트" },
];

// ─── 메인 랜딩 ────────────────────────────────────────────────────────────────

export default function ChannelReportLanding() {
  const [modalOpen, setModalOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => { setVisible(true); }, []);

  useEffect(() => {
    const handler = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  function scrollToHero() {
    document.getElementById("hero")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <>
      {/* 헤더 — main 바깥에 위치해야 overflow-x-hidden에 의한 fixed 무력화 방지 */}
      <header
        className={`fixed z-50 transition-all duration-300 ${
          isScrolled ? "top-4 left-4 right-4" : "top-0 left-0 right-0"
        }`}
      >
        <div
          className={`mx-auto flex items-center justify-between transition-all duration-300 ${
            isScrolled
              ? "max-w-[1100px] h-14 px-6 lg:px-8 rounded-2xl bg-background/80 backdrop-blur-xl border border-foreground/10 shadow-lg"
              : "max-w-[1100px] h-20 px-8 lg:px-16"
          }`}
        >
          <button
            onClick={scrollToHero}
            className="font-heading text-lg font-semibold tracking-tight hover:opacity-80 transition-opacity"
          >
            Channel Report
          </button>
          <div className="flex items-center gap-2 text-right text-xs text-muted-foreground">
            <span className="hidden sm:inline">유튜브 채널 분석 진단 솔루션</span>
            <span className="hidden sm:inline text-foreground/20">|</span>
            <span className="font-mono text-[10px] text-muted-foreground/70">특허출원 제10-2026-0075318호&nbsp;&nbsp;2026.04 발행</span>
          </div>
        </div>
      </header>

      <main className="relative min-h-screen overflow-x-hidden bg-background">

      {/* 히어로 */}
      <section id="hero" className="relative flex flex-col justify-center overflow-hidden pt-20 pb-16 lg:pt-28 lg:pb-20">
        {/* 배경 그리드 */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ backgroundImage: "radial-gradient(circle, hsl(var(--foreground)/0.04) 1px, transparent 1px)", backgroundSize: "32px 32px" }}
        />
        {/* 오렌지 글로우 */}
        <div className="pointer-events-none absolute top-0 right-1/3 h-[400px] w-[600px] rounded-full bg-orange-500/[0.05] blur-3xl" />

        <div className="relative z-10 mx-auto w-full max-w-[1100px] px-8 lg:px-16">
          <div className="flex flex-col items-center gap-12 lg:flex-row lg:gap-6">

            {/* 왼쪽: 텍스트 */}
            <div className="min-w-0 flex-1">
              <div className={`transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
                <span className="mb-8 inline-flex items-center gap-2 rounded-lg border border-foreground/20 bg-foreground/5 px-3 py-1 text-xs font-mono tracking-widest text-foreground">
                  유튜브 채널 전략 컨설팅
                </span>
              </div>

              <h1 className={`font-heading font-bold leading-[1.1] tracking-[-0.04em] transition-all duration-1000 delay-100 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
                <span className="block whitespace-nowrap text-[clamp(2.4rem,4.8vw,3.8rem)] text-foreground">
                  클라이언트 채널의
                </span>
                <span className="block whitespace-nowrap text-[clamp(2.2rem,4vw,3.4rem)] text-foreground">
                  <span className="text-orange-500">불확실성</span>,
                </span>
                <span className="block whitespace-nowrap text-[clamp(1.5rem,2.8vw,2.4rem)] text-foreground">
                  데이터로 제거합니다.
                </span>
              </h1>

              <p className={`mt-5 max-w-lg text-base leading-relaxed text-muted-foreground transition-all duration-700 delay-150 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
                최근 영상 <span className="font-semibold text-orange-500">50</span>개와 채널 데이터를{" "}
                <span className="font-medium"><span className="font-semibold text-orange-500">30</span>개 시그널 · <span className="font-semibold text-orange-500">9</span>개 성장 지표 · <span className="font-semibold text-orange-500">7</span>개 운영 패턴</span>으로 정밀 분석하여 다음 성장 전략을 제시합니다.
              </p>

              <div className={`mt-8 flex flex-col gap-2 transition-all duration-700 delay-[250ms] ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
                <button
                  onClick={() => setModalOpen(true)}
                  className="inline-flex w-fit animate-float-half items-center gap-2 rounded-xl bg-foreground px-7 py-3.5 text-sm font-semibold text-background shadow-lg shadow-foreground/10 transition-colors hover:bg-foreground/85"
                >
                  전략 컨설팅 채널 등록
                  <ArrowRight className="h-4 w-4" />
                </button>
                <span className="text-xs text-muted-foreground">₩330,000 (VAT 포함, 3개월 정기 발행)</span>
              </div>

              {/* 스탯 */}
              <div className={`mt-10 grid grid-cols-4 gap-6 border-t border-foreground/10 pt-8 transition-all duration-700 delay-[400ms] ${visible ? "opacity-100" : "opacity-0"}`}>
                {HERO_STATS.map(({ value, unit, label }) => (
                  <div key={label} className="flex flex-col">
                    <p className="font-heading text-2xl font-semibold leading-none tracking-[-0.04em] lg:text-3xl">
                      {value}<span className="ml-0.5 text-sm font-normal lg:text-base">{unit}</span>
                    </p>
                    <p className="mt-2 text-xs leading-tight text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 오른쪽: 이미지 */}
            <div className={`w-full flex-shrink-0 transition-all duration-1000 delay-200 lg:w-[420px] ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
              <div className="relative">
                <div className="pointer-events-none absolute -inset-4 rounded-3xl bg-orange-500/8 blur-2xl" />
                <img
                  src="/hero-folder.png"
                  alt="채널 분석 리포트 미리보기"
                  className="relative h-auto w-full drop-shadow-2xl"
                />
              </div>
              <p className="mt-3 text-center text-xs font-medium tracking-wide text-muted-foreground/80">
                채널 분석 전략 리포트 <span className="text-muted-foreground/50">|</span> 월간 정기 발행
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 프로세스 */}
      <div className="border-t border-foreground/10">
        <ProcessSection />
      </div>

      {/* 포함 내용 */}
      <div className="border-t border-foreground/10">
        <IncludesSection />
      </div>

      {/* CTA */}
      <section className="border-t border-foreground/10 bg-foreground/[0.02]">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <div className="rounded-2xl border border-foreground/15 bg-background p-10 text-center lg:p-16">
            <h2 className="text-3xl font-bold tracking-tight lg:text-4xl">
              지금 바로 신청하세요
            </h2>
            <p className="mt-4 text-muted-foreground">
              신청 접수 후 이메일로 결제 안내가 발송됩니다.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3">
              <Button size="lg" className="gap-2" onClick={() => setModalOpen(true)}>
                서비스 신청하기
                <ArrowRight className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">₩330,000 (VAT 포함) · 3개월 정기</span>
            </div>
          </div>
        </div>
      </section>

      {/* 푸터 */}
      <footer className="border-t border-foreground/10 py-8 text-center text-xs text-muted-foreground">
        © 2026 Channel Report. All rights reserved.
      </footer>

      {modalOpen && <B2BInquiryModal onClose={() => setModalOpen(false)} />}
    </main>
    </>
  );
}
