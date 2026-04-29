"use client";

import { useState } from "react";
import { ArrowRight, Check, X, Building2 } from "lucide-react";
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
                  placeholder="언폴드랩"
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

// ─── 기능 목록 ────────────────────────────────────────────────────────────────

const FEATURES = [
  "최근 영상 50개 메타데이터 + 30개 시그널 전수 조사",
  "수석 전략가 1:1 맞춤형 진단 코멘터리",
  "특허 출원 기술 기반 병목(Bottleneck) 구간 탐지",
  "분석 기반 향후 30일 콘텐츠 실행 로드맵",
  "클라이언트 보고용 전용 URL 제공",
  "월 1회 전략 리포트 × 3회 (3개월 정기)",
];

// ─── 메인 랜딩 ────────────────────────────────────────────────────────────────

export default function ChannelReportLanding() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 border-b border-foreground/10 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <span className="font-heading text-lg font-semibold tracking-tight">
            Channel Report
          </span>
          <Button size="sm" onClick={() => setModalOpen(true)}>
            서비스 신청
          </Button>
        </div>
      </header>

      {/* 히어로 */}
      <section className="mx-auto max-w-5xl px-6 py-20 lg:py-28">
        <div className="max-w-2xl">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-foreground/15 bg-foreground/5 px-3 py-1 text-xs font-mono tracking-widest text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-foreground/50" />
            전문가 채널 분석 컨설팅
          </span>
          <h1 className="font-heading text-4xl font-bold leading-[1.1] tracking-[-0.03em] lg:text-6xl">
            채널 성장의<br />
            <span className="text-orange-500">다음 전략</span>을<br />
            진단합니다.
          </h1>
          <p className="mt-6 text-base text-muted-foreground lg:text-lg">
            최근 영상 <strong>50</strong>개와 <strong>30개 시그널</strong>을 전수 조사하여
            병목 구간을 찾고, 향후 30일 실행 가이드를 제공합니다.
          </p>
          <p className="mt-2 text-xs text-muted-foreground/60">특허출원 제10-2026-0075318호</p>
          <div className="mt-8 flex items-center gap-4">
            <Button size="lg" className="gap-2" onClick={() => setModalOpen(true)}>
              서비스 신청하기
              <ArrowRight className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">₩330,000 / 3개월</span>
          </div>
        </div>
      </section>

      {/* 기능 목록 */}
      <section className="border-t border-foreground/10 bg-foreground/[0.02]">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <div className="mb-8">
            <Building2 className="mb-3 h-6 w-6 text-orange-500" />
            <h2 className="text-2xl font-bold tracking-tight">포함 내용</h2>
            <p className="mt-2 text-sm text-muted-foreground">광고기획사 및 MCN 대상 전문가 진단 서비스</p>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-3">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-orange-500" />
                <span className="text-sm text-foreground">{f}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="rounded-2xl border border-foreground/15 bg-foreground/[0.01] p-10 text-center lg:p-16">
          <h2 className="text-3xl font-bold tracking-tight lg:text-4xl">
            지금 바로 신청하세요
          </h2>
          <p className="mt-4 text-muted-foreground">
            신청 접수 후 담당자 이메일로 결제 안내가 발송됩니다.
          </p>
          <Button size="lg" className="mt-8 gap-2" onClick={() => setModalOpen(true)}>
            서비스 신청하기
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* 푸터 */}
      <footer className="border-t border-foreground/10 py-8 text-center text-xs text-muted-foreground">
        © 2026 Channel Report. All rights reserved.
      </footer>

      {modalOpen && <B2BInquiryModal onClose={() => setModalOpen(false)} />}
    </main>
  );
}
