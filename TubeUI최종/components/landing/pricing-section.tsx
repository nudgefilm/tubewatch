"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";

const plans = [
  {
    name: "Free",
    description: "시작하는 크리에이터를 위한 무료 플랜",
    price: { monthly: 0, annual: 0 },
    features: [
      "채널 3개 등록",
      "기본 채널 분석",
      "주간 리포트",
      "커뮤니티 지원",
      "기본 SEO 분석",
    ],
    cta: "무료로 시작",
    popular: false,
  },
  {
    name: "Pro",
    description: "성장하는 크리에이터를 위한 프로 플랜",
    price: { monthly: 19000, annual: 15000 },
    features: [
      "채널 10개 등록",
      "심층 채널 분석",
      "실시간 알림",
      "AI 액션 플랜",
      "고급 SEO Lab",
      "경쟁 채널 벤치마크",
      "우선 지원",
    ],
    cta: "Pro 시작하기",
    popular: true,
  },
  {
    name: "Business",
    description: "MCN 및 에이전시를 위한 플랜",
    price: { monthly: null, annual: null },
    features: [
      "Pro의 모든 기능",
      "무제한 채널 등록",
      "팀 협업 기능",
      "API 액세스",
      "전담 매니저",
      "커스텀 리포트",
      "SLA 보장",
      "맞춤 계약",
    ],
    cta: "문의하기",
    popular: false,
  },
];

export function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(true);

  return (
    <section id="pricing" className="relative py-32 lg:py-40 border-t border-foreground/10">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        {/* Header */}
        <div className="max-w-3xl mb-20">
          <span className="font-mono text-xs tracking-widest text-muted-foreground uppercase block mb-6">
            Pricing
          </span>
          <h2 className="font-display text-5xl md:text-6xl lg:text-7xl tracking-tight text-foreground mb-6">
            심플하고 투명한
            <br />
            <span className="text-stroke">요금제</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl">
            무료로 시작하고 성장에 맞춰 업그레이드하세요. 숨겨진 비용 없이 투명하게.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center gap-4 mb-16">
          <span
            className={`text-sm transition-colors ${
              !isAnnual ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            월간
          </span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className="relative w-14 h-7 bg-foreground/10 rounded-full p-1 transition-colors hover:bg-foreground/20"
          >
            <div
              className={`w-5 h-5 bg-foreground rounded-full transition-transform duration-300 ${
                isAnnual ? "translate-x-7" : "translate-x-0"
              }`}
            />
          </button>
          <span
            className={`text-sm transition-colors ${
              isAnnual ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            연간
          </span>
          {isAnnual && (
            <span className="ml-2 px-2 py-1 bg-foreground text-primary-foreground text-xs font-mono">
              21% 할인
            </span>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-px bg-foreground/10">
          {plans.map((plan, idx) => (
            <div
              key={plan.name}
              className={`relative p-8 lg:p-12 bg-background ${
                plan.popular ? "md:-my-4 md:py-12 lg:py-16 border-2 border-foreground" : ""
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-8 px-3 py-1 bg-foreground text-primary-foreground text-xs font-mono uppercase tracking-widest">
                  인기
                </span>
              )}

              {/* Plan Header */}
              <div className="mb-8">
                <span className="font-mono text-xs text-muted-foreground">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <h3 className="font-display text-3xl text-foreground mt-2">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
              </div>

              {/* Price */}
              <div className="mb-8 pb-8 border-b border-foreground/10">
                {plan.price.monthly !== null ? (
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-5xl lg:text-6xl text-foreground">
                      {(isAnnual ? plan.price.annual : plan.price.monthly) === 0 
                        ? "무료" 
                        : `₩${(isAnnual ? plan.price.annual : plan.price.monthly).toLocaleString()}`}
                    </span>
                    {(isAnnual ? plan.price.annual : plan.price.monthly) !== 0 && (
                      <span className="text-muted-foreground">/월</span>
                    )}
                  </div>
                ) : (
                  <span className="font-display text-4xl text-foreground">맞춤 견적</span>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-4 mb-10">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-foreground mt-0.5 shrink-0" />
                    <span className="text-sm text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <a
                href={plan.name === "Business" ? "/support" : "/channels"}
                className={`w-full py-4 flex items-center justify-center gap-2 text-sm font-medium transition-all group ${
                  plan.popular
                    ? "bg-foreground text-primary-foreground hover:bg-foreground/90"
                    : "border border-foreground/20 text-foreground hover:border-foreground hover:bg-foreground/5"
                }`}
              >
                {plan.cta}
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </a>
            </div>
          ))}
        </div>

        {/* Bottom Note */}
        <p className="mt-12 text-center text-sm text-muted-foreground">
          모든 플랜에는 자동 업데이트, 보안 연결, 데이터 백업이 포함됩니다.{" "}
          <a href="/billing" className="underline underline-offset-4 hover:text-foreground transition-colors">
            모든 기능 비교하기
          </a>
        </p>
      </div>
    </section>
  );
}
