"use client";

import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import {
  BILLING_PLANS,
  CREDIT_PRODUCTS,
  FREE_LIFETIME_ANALYSIS_LIMIT,
} from "@/components/billing/types";

const FREE_FEATURES = [
  `채널 1개`,
  `생애 ${FREE_LIFETIME_ANALYSIS_LIMIT}회 분석`,
  "재분석 12시간 쿨다운",
  "영상 50개 분석",
  "Channel Analysis · Channel DNA",
  "Action Plan · Next Trend",
];

const PLAN_FEATURES = [
  "재분석 12시간 쿨다운",
  "영상 50개 분석",
  "Channel Analysis · Channel DNA",
  "Action Plan · Next Trend",
];

export function PricingSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="relative py-16 lg:py-24">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Header */}
        <div
          className={`mb-12 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <p className="font-mono text-xs tracking-[0.15em] uppercase text-muted-foreground mb-3">
            Pricing
          </p>
          <h2 className="font-heading text-4xl lg:text-5xl font-medium tracking-[-0.03em] leading-[1.1]">
            필요한 만큼만
            <br />
            <span className="text-muted-foreground">선택하세요</span>
          </h2>
        </div>

        {/* Subscription plans */}
        <div
          className={`grid grid-cols-1 md:grid-cols-3 gap-px border border-foreground/10 bg-foreground/10 mb-6 transition-all duration-700 delay-150 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          {/* Free */}
          <div className="bg-background p-6 lg:p-8 flex flex-col">
            <div className="mb-6">
              <p className="font-mono text-xs tracking-[0.1em] uppercase text-muted-foreground mb-2">
                Free
              </p>
              <div className="flex items-baseline gap-1">
                <span className="font-heading text-4xl font-medium tracking-[-0.03em]">₩0</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">구독 없이 시작</p>
            </div>
            <ul className="space-y-2.5 flex-1 mb-8">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Check className="h-3.5 w-3.5 mt-0.5 shrink-0 text-foreground/40" />
                  {f}
                </li>
              ))}
            </ul>
            <a
              href="/channels"
              className="block w-full border border-foreground/20 text-center py-2.5 text-sm font-medium hover:bg-foreground/[0.04] transition-colors"
            >
              무료로 시작하기
            </a>
          </div>

          {/* Creator */}
          <div className="bg-background p-6 lg:p-8 flex flex-col">
            <div className="mb-6">
              <p className="font-mono text-xs tracking-[0.1em] uppercase text-muted-foreground mb-2">
                {BILLING_PLANS[0].name}
              </p>
              <div className="flex items-baseline gap-1">
                <span className="font-heading text-4xl font-medium tracking-[-0.03em]">
                  ₩{BILLING_PLANS[0].priceKrw.toLocaleString()}
                </span>
                <span className="text-sm text-muted-foreground">/월</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{BILLING_PLANS[0].targetAudience}</p>
            </div>
            <ul className="space-y-2.5 flex-1 mb-8">
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <Check className="h-3.5 w-3.5 mt-0.5 shrink-0 text-foreground/40" />
                채널 {BILLING_PLANS[0].channels}개
              </li>
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <Check className="h-3.5 w-3.5 mt-0.5 shrink-0 text-foreground/40" />
                월 {BILLING_PLANS[0].monthlyAnalyses}회 분석
              </li>
              {PLAN_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Check className="h-3.5 w-3.5 mt-0.5 shrink-0 text-foreground/40" />
                  {f}
                </li>
              ))}
            </ul>
            <a
              href="/billing"
              className="block w-full border border-foreground/20 text-center py-2.5 text-sm font-medium hover:bg-foreground/[0.04] transition-colors"
            >
              구독 시작하기
            </a>
          </div>

          {/* Pro */}
          <div className="bg-foreground text-background p-6 lg:p-8 flex flex-col relative">
            <div className="absolute top-4 right-4">
              <span className="font-mono text-[10px] tracking-[0.1em] uppercase bg-background/10 px-2 py-0.5">
                추천
              </span>
            </div>
            <div className="mb-6">
              <p className="font-mono text-xs tracking-[0.1em] uppercase opacity-60 mb-2">
                {BILLING_PLANS[1].name}
              </p>
              <div className="flex items-baseline gap-1">
                <span className="font-heading text-4xl font-medium tracking-[-0.03em]">
                  ₩{BILLING_PLANS[1].priceKrw.toLocaleString()}
                </span>
                <span className="text-sm opacity-60">/월</span>
              </div>
              <p className="mt-1 text-xs opacity-60">{BILLING_PLANS[1].targetAudience}</p>
            </div>
            <ul className="space-y-2.5 flex-1 mb-8">
              <li className="flex items-start gap-2 text-sm opacity-80">
                <Check className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                채널 {BILLING_PLANS[1].channels}개
              </li>
              <li className="flex items-start gap-2 text-sm opacity-80">
                <Check className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                월 {BILLING_PLANS[1].monthlyAnalyses}회 분석
              </li>
              {PLAN_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm opacity-80">
                  <Check className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <a
              href="/billing"
              className="block w-full bg-background text-foreground text-center py-2.5 text-sm font-medium hover:bg-background/90 transition-colors"
            >
              구독 시작하기
            </a>
          </div>
        </div>

        {/* Credit products */}
        <div
          className={`grid grid-cols-1 sm:grid-cols-2 gap-px border border-foreground/10 bg-foreground/10 transition-all duration-700 delay-300 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          {CREDIT_PRODUCTS.map((product) => (
            <div key={product.id} className="bg-background p-5 lg:p-6 flex items-center justify-between gap-4">
              <div>
                <p className="font-mono text-xs tracking-[0.1em] uppercase text-muted-foreground mb-1">
                  단건 크레딧
                </p>
                <p className="font-medium">{product.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{product.description}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-heading text-2xl font-medium tracking-[-0.03em]">
                  ₩{product.priceKrw.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">{product.creditCount}회 충전</p>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-4 text-xs text-muted-foreground/60 font-mono">
          * 단건 크레딧은 무료 횟수 소진 후 구독 없이 추가 분석을 이용할 때 사용합니다.
        </p>
      </div>
    </section>
  );
}
