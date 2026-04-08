"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, BarChart3, Dna, ClipboardList, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navigation } from "./navigation";
import { FooterSection } from "./footer-section";

// ─── Scroll-fade hook ───────────────────────────────────────────────────────

function useFadeIn(threshold = 0.15) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

// ─── Section Label ──────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-6">
      <span className="w-8 h-px bg-foreground/30" />
      {children}
    </span>
  );
}

// ─── 01. Hero ───────────────────────────────────────────────────────────────

function HeroSection() {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setVisible(true); }, []);

  return (
    <section className="relative min-h-[80vh] flex flex-col justify-center py-16 overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: "radial-gradient(circle, hsl(var(--foreground)/0.04) 1px, transparent 1px)", backgroundSize: "32px 32px" }}
      />

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className={`transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <SectionLabel>TubeWatch™ Platform Introduction</SectionLabel>
        </div>

        <h1 className={`font-heading font-medium leading-[1.15] tracking-[-0.03em] transition-all duration-1000 delay-100 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <span className="block text-[clamp(2rem,6vw,4.5rem)]">
            당신의 데이터는 이미<br />다음 전략을 말하고 있습니다.
          </span>
          <span className="block text-[clamp(1.2rem,3.6vw,2.7rem)] text-muted-foreground mt-2">
            유튜브 스튜디오가 보여주지 않는 1% 시그널,<br />튜브워치가 설계합니다.
          </span>
        </h1>

        <div className={`mt-8 transition-all duration-700 delay-300 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <img src="/mainbb.png" alt="" className="h-48 w-auto object-contain rounded-lg" />
        </div>

        {/* Stats row */}
        <div className={`mt-10 flex flex-wrap gap-x-10 gap-y-5 border-t border-foreground/10 pt-8 transition-all duration-700 delay-500 ${visible ? "opacity-100" : "opacity-0"}`}>
          {[
            { value: "4개", label: "핵심 분석 모듈" },
            { value: "50개+", label: "영상 심층 분석" },
            { value: "80개+", label: "데이터 시그널 기반" },
            { value: "무료", label: "로 시작 가능", highlight: true },
          ].map(({ value, label, highlight }) => (
            <div key={label}>
              <p className={`font-heading text-3xl lg:text-4xl font-medium tracking-[-0.03em] ${highlight ? "text-foreground" : ""}`}>
                {value}
              </p>
              <p className={`text-sm mt-1 ${highlight ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                {highlight ? <><span className="underline underline-offset-4">{label}</span></> : label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── 02. Pain Points ────────────────────────────────────────────────────────

const painPoints = [
  {
    situation: "꾸준히 올리는데 구독자가 안 늘어요",
    solution: "성장을 막는 패턴을 데이터로 찾아드립니다",
  },
  {
    situation: "어떤 주제를 올려야 할지 모르겠어요",
    solution: "내 채널 흐름 기반 '다음 주제'를 바로 제안합니다",
  },
  {
    situation: "잘된 영상이 왜 잘됐는지 모르겠어요",
    solution: "반복되는 성공 공식을 자동으로 추출합니다",
  },
  {
    situation: "다음에 뭘 해야 할지 막막해요",
    solution: "오늘 바로 실행할 액션 리스트를 제공합니다",
  },
];

function PainPointsSection() {
  const { ref, visible } = useFadeIn();

  return (
    <section ref={ref} className="relative py-10 lg:py-16 border-t border-foreground/10">
      <div className="max-w-[1200px] mx-auto px-8 lg:px-20">
        <div className={`mb-8 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <SectionLabel>For Creators</SectionLabel>
          <h2 className="font-heading text-4xl lg:text-5xl font-medium tracking-[-0.03em] leading-[1.1]">
            이런 분께<br />
            <span className="text-muted-foreground">꼭 필요합니다</span>
          </h2>
        </div>

        <div className={`grid grid-cols-1 md:grid-cols-2 gap-px border border-foreground/10 bg-foreground/10 transition-all duration-700 delay-150 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          {painPoints.map(({ situation, solution }, i) => (
            <div key={i} className="bg-background p-6 lg:p-8 flex flex-col gap-4">
              <p className="text-base text-foreground/50 leading-snug">
                &ldquo;{situation}&rdquo;
              </p>
              <div className="flex items-start gap-3">
                <ArrowRight className="w-4 h-4 mt-0.5 shrink-0 text-foreground" />
                <p className="text-base font-medium leading-snug">{solution}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── 03. Features ───────────────────────────────────────────────────────────

const features = [
  {
    number: "01",
    icon: BarChart3,
    title: "Channel Analysis",
    subtitle: "채널 건강검진 리포트",
    description: "내 채널 상태를 한눈에 파악하고,\n지금 가장 큰 문제를 바로 찾습니다.",
    points: [
      "채널 종합 성장 점수 산출",
      "상위 vs 하위 영상 패턴 비교",
      "최적 업로드 요일·시간대 분석",
      "썸네일·제목 클릭률 영향 분석",
    ],
    quote: "내 채널 점수 62점,\n업로드 일관성이 핵심 문제입니다.",
  },
  {
    number: "02",
    icon: Dna,
    title: "Channel DNA",
    subtitle: "성공 공식 추출기",
    description: "잘된 영상의 공통점을 분석해\n내 채널의 '성공 공식'을 만들어줍니다.",
    points: [
      "성과 높은 영상의 공통 패턴 추출",
      "채널 고유 강점과 약점 시각화",
      "타겟 시청자층 자동 분석",
      "콘텐츠 주제 일관성 진단",
    ],
    quote: "이 포맷에서\n평균 2.3배 높은 성과가 발생합니다.",
  },
  {
    number: "03",
    icon: ClipboardList,
    title: "Action Plan",
    subtitle: "오늘 당장 할 일 리스트",
    description: "분석 결과를\n\"지금 바로 실행할 행동\"으로 바꿔드립니다.",
    points: [
      "우선순위별 P1·P2·P3 실행 계획",
      "SEO 키워드 진단 및 태그 개선",
      "업로드 전 매번 확인할 체크리스트",
      "즉시 수정 가능한 결손 항목 리포트",
    ],
    quote: "설명란 키워드 누락 —\n지금 수정하세요.",
  },
  {
    number: "04",
    icon: TrendingUp,
    title: "Next Trend",
    subtitle: "내부 흐름 기반 다음 영상 방향",
    description: "내 채널 데이터 흐름에서\n다음 영상 주제를 바로 제안합니다.",
    points: [
      "채널 내부 신호 기반 주제 후보 추천",
      "1순위 주제 강조 + 근거 제시",
      "최적 포맷 방향(길이·형식) 권장",
      "제목·훅·썸네일 통합 실행 힌트",
    ],
    quote: "이 주제,\n최근 패턴에서 1.8배 높은 반응.",
  },
];

function FeatureBlock({ feature, index }: { feature: typeof features[0]; index: number }) {
  const { ref, visible } = useFadeIn();
  const isEven = index % 2 === 0;
  const Icon = feature.icon;

  return (
    <div
      ref={ref}
      className={`grid grid-cols-1 lg:grid-cols-2 gap-0 border border-foreground/10 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      {/* Text block */}
      <div className={`p-6 lg:p-10 flex flex-col justify-between ${isEven ? "lg:order-1" : "lg:order-2"}`}>
        <div>
          <div className="flex items-center gap-4 mb-6">
            <span className="font-mono text-xs text-muted-foreground">{feature.number}</span>
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-md bg-foreground/5 border border-foreground/10">
                <Icon className="size-4 text-foreground" />
              </div>
              <div>
                <h3 className="font-heading text-xl lg:text-2xl font-medium tracking-[-0.02em]">{feature.title}</h3>
                <p className="text-xs text-muted-foreground">{feature.subtitle}</p>
              </div>
            </div>
          </div>
          <p className="text-lg lg:text-xl font-heading font-medium leading-snug tracking-[-0.02em] mb-8 whitespace-pre-line">
            {feature.description}
          </p>
          <ul className="space-y-2.5">
            {feature.points.map((point) => (
              <li key={point} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <Check className="h-3.5 w-3.5 mt-0.5 shrink-0 text-foreground/40" />
                {point}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Result quote block */}
      <div className={`flex items-center justify-center bg-foreground/[0.02] border-t lg:border-t-0 ${isEven ? "lg:border-l lg:order-2" : "lg:border-r lg:order-1"} border-foreground/10 p-6 lg:p-10 min-h-[220px]`}>
        <div className="space-y-3">
          <p className="font-mono text-[10px] tracking-[0.12em] uppercase text-muted-foreground/50">실제 결과 예시</p>
          <blockquote className="font-heading text-xl lg:text-2xl font-medium tracking-[-0.02em] leading-snug whitespace-pre-line">
            {feature.quote}
          </blockquote>
        </div>
      </div>
    </div>
  );
}

function FeaturesSection() {
  const { ref, visible } = useFadeIn();

  return (
    <section id="features" className="relative py-10 lg:py-16 border-t border-foreground/10">
      <div className="max-w-[1200px] mx-auto px-8 lg:px-20">
        <div ref={ref} className={`mb-8 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <SectionLabel>Core Features</SectionLabel>
          <h2 className="font-heading text-4xl lg:text-5xl font-medium tracking-[-0.03em] leading-[1.1]">
            읽는 순간 이해되는
            <br />
            <span className="text-muted-foreground">4가지 분석 도구</span>
          </h2>
        </div>

        <div className="space-y-px">
          {features.map((feature, index) => (
            <FeatureBlock key={feature.number} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── 04. How It Works ───────────────────────────────────────────────────────

const steps = [
  { step: "01", title: "채널 등록", sub: "1분", desc: "유튜브 채널 URL 입력만으로 완료" },
  { step: "02", title: "자동 분석", sub: "영상 50개+", desc: "AI가 데이터 시그널 80개+ 자동 처리" },
  { step: "03", title: "4개 리포트", sub: "즉시 생성", desc: "Analysis · DNA · Action Plan · Next Trend" },
  { step: "04", title: "실행 → 성장", sub: "반복 추적", desc: "업로드 후 재분석으로 성장 변화 확인" },
];

function HowItWorksSection() {
  const { ref, visible } = useFadeIn();

  return (
    <section className="relative py-10 lg:py-16 border-t border-foreground/10">
      <div className="max-w-[1200px] mx-auto px-8 lg:px-20">
        <div ref={ref} className={`mb-8 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <SectionLabel>How It Works</SectionLabel>
          <h2 className="font-heading text-4xl lg:text-5xl font-medium tracking-[-0.03em] leading-[1.1]">
            4단계,
            <br />
            <span className="text-muted-foreground">5분 안에 첫 결과</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px border border-foreground/10 bg-foreground/10">
          {steps.map(({ step, title, sub, desc }, i) => (
            <StepCard key={step} step={step} title={title} sub={sub} desc={desc} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function StepCard({ step, title, sub, desc, index }: { step: string; title: string; sub: string; desc: string; index: number }) {
  const { ref, visible } = useFadeIn();
  return (
    <div
      ref={ref}
      className={`bg-background p-6 lg:p-8 flex flex-col gap-4 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <span className="font-mono text-3xl font-medium tracking-[-0.03em] text-foreground/15">{step}</span>
      <div>
        <div className="flex items-baseline gap-2 mb-1">
          <h3 className="font-heading text-xl font-medium tracking-[-0.02em]">{title}</h3>
          <span className="font-mono text-xs text-muted-foreground">({sub})</span>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

// ─── 05. Why TubeWatch ──────────────────────────────────────────────────────

const whyItems = [
  {
    title: "감이 아닌 근거",
    desc: "모든 제안은 내 채널 데이터 기반입니다. 다른 채널 평균이나 외부 트렌드가 아닌, 내 채널 안의 패턴에서만 찾습니다.",
  },
  {
    title: "분석에서 끝나지 않습니다",
    desc: "숫자를 보여주고 끝내지 않습니다. 바로 실행 가능한 액션을 제공합니다.",
  },
  {
    title: "내 채널 전용 전략",
    desc: "일반적인 유튜브 성장 팁이 아닙니다. 다른 채널이 아닌 '내 데이터' 기준으로 전략을 설계합니다.",
  },
  {
    title: "복잡함 없이 바로 이해",
    desc: "핵심만, 바로 실행 가능하게. 분석 전문가가 아니어도 읽는 순간 무엇을 해야 할지 알 수 있습니다.",
  },
];

function WhySection() {
  const { ref, visible } = useFadeIn();

  return (
    <section className="relative py-10 lg:py-16 border-t border-foreground/10">
      <div className="max-w-[1200px] mx-auto px-8 lg:px-20">
        <div ref={ref} className={`mb-8 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <SectionLabel>Why TubeWatch</SectionLabel>
          <h2 className="font-heading text-4xl lg:text-5xl font-medium tracking-[-0.03em] leading-[1.1]">
            다른 분석 도구와
            <br />
            <span className="text-muted-foreground">무엇이 다른가요?</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px border border-foreground/10 bg-foreground/10">
          {whyItems.map(({ title, desc }, i) => (
            <WhyCard key={title} title={title} desc={desc} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function WhyCard({ title, desc, index }: { title: string; desc: string; index: number }) {
  const { ref, visible } = useFadeIn();
  return (
    <div
      ref={ref}
      className={`bg-background p-6 lg:p-8 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="mt-2 w-1.5 h-1.5 rounded-full bg-foreground shrink-0" />
        <h3 className="font-heading text-xl lg:text-2xl font-medium tracking-[-0.02em]">{title}</h3>
      </div>
      <p className="text-base text-muted-foreground leading-relaxed pl-4">{desc}</p>
    </div>
  );
}

// ─── 06. Pricing Preview ────────────────────────────────────────────────────

const plans = [
  {
    name: "Free",
    price: "무료",
    note: "신용카드 없이 바로 시작",
    features: ["채널 1개", "생애 기본 분석 횟수 제공", "Channel Analysis", "Channel DNA 핵심 항목", "Action Plan P1 항목", "Next Trend 1순위 주제"],
    cta: "무료로 내 채널 분석하기",
    href: "/channels",
    highlight: false,
  },
  {
    name: "Creator",
    price: "월 구독",
    note: "성장을 원하는 크리에이터",
    features: ["채널 복수 등록", "월 정기 분석 제공", "Channel Analysis 전체", "Channel DNA 전체", "Action Plan 전체", "Next Trend 전체 + 실행 힌트"],
    cta: "지금 성장 시작하기",
    href: "/billing",
    highlight: false,
  },
  {
    name: "Pro",
    price: "월 구독",
    note: "진지하게 성장을 원하는 분",
    features: ["채널 더 많이 등록 가능", "월 분석 횟수 대폭 확대", "모든 기능 무제한", "원페이퍼 리포트 제공", "성장 전략 실행 플랜", "우선 지원"],
    cta: "지금 성장 시작하기",
    href: "/billing",
    highlight: true,
  },
];

function PricingPreviewSection() {
  const { ref, visible } = useFadeIn();

  return (
    <section className="relative py-10 lg:py-16 border-t border-foreground/10">
      <div className="max-w-[1200px] mx-auto px-8 lg:px-20">
        <div ref={ref} className={`mb-8 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <SectionLabel>Pricing</SectionLabel>
          <h2 className="font-heading text-4xl lg:text-5xl font-medium tracking-[-0.03em] leading-[1.1]">
            필요한 만큼만
            <br />
            <span className="text-muted-foreground">선택하세요</span>
          </h2>
          <p className="mt-4 text-base text-muted-foreground">
            기본 채널 진단은 <strong className="text-foreground">무료</strong>입니다. 성장이 필요한 시점에 업그레이드하세요.
          </p>
        </div>

        <div className={`grid grid-cols-1 md:grid-cols-3 gap-px border border-foreground/10 bg-foreground/10 transition-all duration-700 delay-150 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          {plans.map(({ name, price, note, features, cta, href, highlight }) => (
            <div key={name} className={`p-6 lg:p-8 flex flex-col ${highlight ? "bg-foreground text-background" : "bg-background"}`}>
              <div className="mb-6">
                {highlight && (
                  <span className="inline-block font-mono text-[10px] tracking-[0.1em] uppercase bg-background/10 px-2 py-0.5 mb-3">추천</span>
                )}
                <p className={`font-mono text-xs tracking-[0.1em] uppercase mb-2 ${highlight ? "opacity-60" : "text-muted-foreground"}`}>{name}</p>
                <p className="font-heading text-3xl font-medium tracking-[-0.03em]">{price}</p>
                <p className={`mt-1 text-xs ${highlight ? "opacity-60" : "text-muted-foreground"}`}>{note}</p>
              </div>
              <ul className="space-y-2.5 flex-1 mb-8">
                {features.map((f) => (
                  <li key={f} className={`flex items-start gap-2 text-sm ${highlight ? "opacity-80" : "text-muted-foreground"}`}>
                    <Check className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${highlight ? "" : "text-foreground/40"}`} />
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href={href}
                className={`block w-full text-center py-2.5 text-sm font-medium transition-colors ${
                  highlight
                    ? "bg-background text-foreground hover:bg-background/90"
                    : "border border-foreground/20 hover:bg-foreground/[0.04]"
                }`}
              >
                {cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── 07. Final CTA ──────────────────────────────────────────────────────────

function FinalCtaSection() {
  const { ref, visible } = useFadeIn(0.2);

  return (
    <section className="relative py-10 lg:py-16 border-t border-foreground/10">
      <div className="max-w-[1200px] mx-auto px-8 lg:px-20">
        <div
          ref={ref}
          className={`relative border border-foreground px-8 lg:px-14 py-10 lg:py-16 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          {/* Corner decorations */}
          <div className="absolute top-0 right-0 w-24 h-24 border-b border-l border-foreground/10" />
          <div className="absolute bottom-0 left-0 w-24 h-24 border-t border-r border-foreground/10" />

          <div className="relative z-10 max-w-2xl">
            <p className="font-mono text-xs tracking-[0.15em] uppercase text-muted-foreground mb-6">Get Started</p>
            <h2 className="font-heading text-4xl lg:text-6xl font-medium tracking-[-0.03em] leading-[1.1] mb-6">
              지금 채널을 등록하면<br />
              5분 안에 첫 성장 인사이트를<br />
              확인할 수 있습니다.
            </h2>
            <p className="text-lg text-muted-foreground mb-4 leading-relaxed">
              지금도 수많은 채널이<br />
              감이 아닌 데이터로 성장하고 있습니다.
            </p>
            <p className="text-lg font-medium mb-12">
              당신 채널도,<br />
              다음 단계로 넘어갈 준비가 되었나요?
            </p>
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <Button size="lg" className="bg-black hover:bg-neutral-800 text-white px-8 h-12 text-base rounded-lg shadow-lg group" asChild>
                <a href="/channels">
                  무료로 내 채널 분석 시작하기
                  <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                </a>
              </Button>
            </div>
            <p className="mt-8 font-mono text-xs text-muted-foreground/50">
              tubewatch.kr — 감이 아닌 데이터로 성장하는 유튜버를 위해
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Root ────────────────────────────────────────────────────────────────────

export default function IntroduceLanding() {
  return (
    <main className="relative min-h-screen overflow-x-hidden noise-overlay">
      <Navigation />
      <HeroSection />
      <PainPointsSection />
      <FeaturesSection />
      <HowItWorksSection />
      <WhySection />
      <PricingPreviewSection />
      <FinalCtaSection />
      <FooterSection />
    </main>
  );
}
