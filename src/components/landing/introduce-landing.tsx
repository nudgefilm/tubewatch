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
    <section className="relative min-h-[92vh] flex flex-col justify-center py-24 overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: "radial-gradient(circle, hsl(var(--foreground)/0.04) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className={`transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <SectionLabel>TubeWatch™ Platform Introduction</SectionLabel>
        </div>

        <h1 className={`font-heading font-medium leading-[1.15] tracking-[-0.03em] transition-all duration-1000 delay-100 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <span className="block text-[clamp(2rem,6vw,4.5rem)]">
            열심히 올리는데<br className="hidden sm:block" /> 왜 안 늘까?
          </span>
          <span className="block text-[clamp(2rem,6vw,4.5rem)] text-muted-foreground mt-2">
            감이 아닌 데이터로<br className="hidden sm:block" /> 답을 찾으세요.
          </span>
        </h1>

        <p className={`mt-10 text-lg lg:text-xl text-foreground/70 max-w-2xl leading-relaxed transition-all duration-700 delay-200 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          TubeWatch™는 채널 데이터를 분석해 <strong className="text-foreground">다음에 무엇을 해야 할지</strong> 명확하게 알려주는 유튜버 전용 성장 플랫폼입니다.
          조회수 숫자만 보여주는 서비스가 아닙니다. 지금 내 채널에서 무엇이 통하고, 다음에 무엇을 해야 하는지 — 실행까지 설계합니다.
        </p>

        <div className={`mt-12 flex flex-col sm:flex-row items-start gap-4 transition-all duration-700 delay-300 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <Button size="lg" className="bg-black hover:bg-neutral-800 text-white px-8 h-12 text-base rounded-lg shadow-lg group" asChild>
            <a href="/channels">
              무료로 시작하기
              <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
            </a>
          </Button>
          <Button size="lg" variant="outline" className="h-12 px-8 text-base rounded-lg" asChild>
            <a href="#features">기능 살펴보기</a>
          </Button>
        </div>

        {/* Stats row */}
        <div className={`mt-20 flex flex-wrap gap-x-12 gap-y-6 transition-all duration-700 delay-500 ${visible ? "opacity-100" : "opacity-0"}`}>
          {[
            { value: "4", label: "핵심 분석 모듈" },
            { value: "50개+", label: "영상 심층 분석" },
            { value: "80개+", label: "데이터 시그널" },
            { value: "무료", label: "기본 진단 제공" },
          ].map(({ value, label }) => (
            <div key={label}>
              <p className="font-heading text-3xl lg:text-4xl font-medium tracking-[-0.03em]">{value}</p>
              <p className="text-sm text-muted-foreground mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── 02. Pain Points ────────────────────────────────────────────────────────

const painPoints = [
  { situation: "꾸준히 올리는데 구독자가 안 늘어요", solution: "성과를 막는 패턴을 데이터로 찾아드립니다" },
  { situation: "어떤 주제를 올려야 할지 모르겠어요", solution: "내 채널 흐름 기반 다음 주제를 추천합니다" },
  { situation: "잘된 영상이 왜 잘됐는지 모르겠어요", solution: "반복되는 성공 공식을 자동으로 추출합니다" },
  { situation: "유튜브 스튜디오 수치가 너무 복잡해요", solution: "핵심만 골라 한눈에 이해할 수 있게 정리합니다" },
  { situation: "다음에 뭘 해야 할지 막막해요", solution: "오늘 바로 실행할 액션 리스트를 제공합니다" },
  { situation: "썸네일·제목이 클릭률에 영향을 주는지 몰라요", solution: "데이터 기반 클릭률 요소 분석 리포트를 드립니다" },
];

function PainPointsSection() {
  const { ref, visible } = useFadeIn();

  return (
    <section ref={ref} className="relative py-16 lg:py-24 border-t border-foreground/10">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className={`mb-12 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <SectionLabel>For Creators</SectionLabel>
          <h2 className="font-heading text-4xl lg:text-5xl font-medium tracking-[-0.03em] leading-[1.1]">
            이런 분께<br />
            <span className="text-muted-foreground">꼭 필요합니다</span>
          </h2>
        </div>

        <div className={`grid grid-cols-1 md:grid-cols-2 gap-px border border-foreground/10 bg-foreground/10 transition-all duration-700 delay-150 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          {painPoints.map(({ situation, solution }, i) => (
            <div key={i} className="bg-background p-6 lg:p-8 flex flex-col gap-3">
              <p className="text-base font-medium text-foreground/60 leading-snug">
                &ldquo;{situation}&rdquo;
              </p>
              <div className="flex items-start gap-2.5">
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
    description: "내 채널이 지금 어떤 상태인지 한눈에 파악합니다. 조회수·구독·참여율을 하나의 성장 점수로 요약하고, 잘된 영상과 안 된 영상의 차이를 자동으로 비교합니다.",
    points: [
      "채널 종합 성장 점수 산출",
      "상위 vs 하위 영상 패턴 비교",
      "최적 업로드 요일·시간대 분석",
      "썸네일·제목 클릭률 영향 분석",
    ],
    quote: '"내 채널 점수가 62점입니다. 업로드 일관성이 가장 큰 개선 포인트입니다."',
  },
  {
    number: "02",
    icon: Dna,
    title: "Channel DNA",
    subtitle: "성공 공식 추출기",
    description: "잘된 영상들의 공통점을 자동으로 추출합니다. 내 채널만의 성과 구조를 파악하고, 반복해서 통하는 주제·포맷·타이밍 패턴을 정리해드립니다.",
    points: [
      "성과 높은 영상의 공통 패턴 추출",
      "채널 고유 강점과 약점 시각화",
      "타겟 시청자층 자동 분석",
      "콘텐츠 주제 일관성 진단",
    ],
    quote: '"10분 내외 문제 해결 포맷에서 평균 2.3배 높은 성과가 나옵니다."',
  },
  {
    number: "03",
    icon: ClipboardList,
    title: "Action Plan",
    subtitle: "오늘 당장 할 일 리스트",
    description: "분석 결과를 실행 가능한 행동으로 바꿔드립니다. 우선순위 순서대로 P1·P2·P3 액션을 정리하고, 유튜브 스튜디오에서 지금 바로 수정 가능한 항목까지 짚어드립니다.",
    points: [
      "우선순위별 P1·P2·P3 실행 계획",
      "SEO 키워드 진단 및 태그 개선",
      "업로드 전 매번 확인할 체크리스트",
      "즉시 수정 가능한 결손 항목 리포트",
    ],
    quote: '"최근 5개 영상 설명란에 핵심 키워드가 빠져 있습니다. 지금 수정하세요."',
  },
  {
    number: "04",
    icon: TrendingUp,
    title: "Next Trend",
    subtitle: "내부 흐름 기반 다음 영상 방향",
    description: "외부 트렌드가 아닌, 내 채널 안의 데이터 흐름에서 다음 주제를 찾습니다. 지금 가장 유력한 1순위 주제부터 제목·훅·썸네일 방향까지 한 번에 설계합니다.",
    points: [
      "채널 내부 신호 기반 주제 후보 추천",
      "1순위 주제 강조 + 근거 제시",
      "최적 포맷 방향(길이·형식) 권장",
      "제목·훅·썸네일 통합 실행 힌트",
    ],
    quote: '"초보자 실수 교정 주제, 최근 3개 영상 중 이 패턴에서 1.8배 높은 반응이 나왔습니다."',
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
      <div className={`p-8 lg:p-12 flex flex-col justify-between ${isEven ? "lg:order-1" : "lg:order-2"}`}>
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
          <p className="text-base text-foreground/70 leading-relaxed mb-8">{feature.description}</p>
          <ul className="space-y-2.5">
            {feature.points.map((point) => (
              <li key={point} className="flex items-start gap-2.5 text-sm">
                <Check className="h-3.5 w-3.5 mt-0.5 shrink-0 text-foreground/50" />
                {point}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Quote / visual block */}
      <div className={`flex items-center justify-center bg-foreground/[0.02] border-t lg:border-t-0 ${isEven ? "lg:border-l lg:order-2" : "lg:border-r lg:order-1"} border-foreground/10 p-8 lg:p-12 min-h-[220px]`}>
        <blockquote className="font-mono text-sm text-foreground/60 leading-relaxed border-l-2 border-foreground/20 pl-4">
          {feature.quote}
        </blockquote>
      </div>
    </div>
  );
}

function FeaturesSection() {
  const { ref, visible } = useFadeIn();

  return (
    <section id="features" className="relative py-16 lg:py-24 border-t border-foreground/10">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div ref={ref} className={`mb-12 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <SectionLabel>Core Features</SectionLabel>
          <h2 className="font-heading text-4xl lg:text-5xl font-medium tracking-[-0.03em] leading-[1.1]">
            채널 성장을 이끄는
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
  { step: "01", title: "채널 등록", desc: "유튜브 채널 URL을 입력하면 자동으로 채널 정보를 불러옵니다. 1분이면 충분합니다." },
  { step: "02", title: "분석 실행", desc: "AI가 최근 영상 50개+와 채널 지표 80개+를 자동 분석합니다. 별도 설정은 필요 없습니다." },
  { step: "03", title: "4개 리포트 확인", desc: "Channel Analysis · Channel DNA · Action Plan · Next Trend 4개 리포트가 동시에 생성됩니다." },
  { step: "04", title: "실행 & 재분석", desc: "Action Plan의 액션을 실행하고, 새 영상 업로드 후 재분석해 성장 변화를 추적합니다." },
];

function HowItWorksSection() {
  const { ref, visible } = useFadeIn();

  return (
    <section className="relative py-16 lg:py-24 border-t border-foreground/10">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div ref={ref} className={`mb-12 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <SectionLabel>How It Works</SectionLabel>
          <h2 className="font-heading text-4xl lg:text-5xl font-medium tracking-[-0.03em] leading-[1.1]">
            4단계로
            <br />
            <span className="text-muted-foreground">채널 성장을 설계합니다</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px border border-foreground/10 bg-foreground/10">
          {steps.map(({ step, title, desc }, i) => (
            <StepCard key={step} step={step} title={title} desc={desc} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function StepCard({ step, title, desc, index }: { step: string; title: string; desc: string; index: number }) {
  const { ref, visible } = useFadeIn();
  return (
    <div
      ref={ref}
      className={`bg-background p-6 lg:p-8 flex flex-col gap-4 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <span className="font-mono text-3xl font-medium tracking-[-0.03em] text-foreground/20">{step}</span>
      <div>
        <h3 className="font-heading text-xl font-medium tracking-[-0.02em] mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

// ─── 05. Why TubeWatch ──────────────────────────────────────────────────────

const whyItems = [
  {
    title: "감이 아닌 근거",
    desc: "모든 제안은 내 채널 실제 데이터를 기반으로 합니다. 다른 채널 평균이나 외부 트렌드가 아닌, 내 채널 안의 패턴에서 찾습니다.",
  },
  {
    title: "분석에서 끝나지 않습니다",
    desc: "숫자를 보여주고 끝내지 않습니다. 오늘 바로 실행할 수 있는 구체적인 액션까지 설계합니다.",
  },
  {
    title: "내 채널 전용 인사이트",
    desc: "일반적인 유튜브 성장 팁이 아닙니다. 내 채널 데이터에서만 나올 수 있는 고유한 패턴과 방향을 찾아드립니다.",
  },
  {
    title: "복잡함 없이 바로 이해",
    desc: "복잡한 수치 대신 핵심만 골라 이해하기 쉽게 전달합니다. 분석 전문가가 아니어도 바로 활용할 수 있습니다.",
  },
];

function WhySection() {
  const { ref, visible } = useFadeIn();

  return (
    <section className="relative py-16 lg:py-24 border-t border-foreground/10">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div ref={ref} className={`mb-12 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
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
      className={`bg-background p-8 lg:p-10 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="mt-1 w-1.5 h-1.5 rounded-full bg-foreground shrink-0" />
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
    note: "구독 없이 시작",
    features: ["채널 1개", "생애 기본 분석 횟수 제공", "Channel Analysis", "Channel DNA 핵심 항목", "Action Plan P1 항목", "Next Trend 1순위 주제"],
    cta: "무료로 시작하기",
    href: "/channels",
    highlight: false,
  },
  {
    name: "Creator",
    price: "월 구독",
    note: "성장을 원하는 크리에이터",
    features: ["채널 복수 등록", "월 정기 분석 제공", "Channel Analysis 전체", "Channel DNA 전체", "Action Plan 전체", "Next Trend 전체 + 실행 힌트"],
    cta: "구독 시작하기",
    href: "/billing",
    highlight: false,
  },
  {
    name: "Pro",
    price: "월 구독",
    note: "진지하게 성장을 원하는 분",
    features: ["채널 더 많이 등록 가능", "월 분석 횟수 대폭 확대", "모든 기능 무제한", "원페이퍼 리포트 제공", "성장 전략 실행 플랜", "우선 지원"],
    cta: "구독 시작하기",
    href: "/billing",
    highlight: true,
  },
];

function PricingPreviewSection() {
  const { ref, visible } = useFadeIn();

  return (
    <section className="relative py-16 lg:py-24 border-t border-foreground/10">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div ref={ref} className={`mb-12 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <SectionLabel>Pricing</SectionLabel>
          <h2 className="font-heading text-4xl lg:text-5xl font-medium tracking-[-0.03em] leading-[1.1]">
            필요한 만큼만
            <br />
            <span className="text-muted-foreground">선택하세요</span>
          </h2>
          <p className="mt-4 text-base text-muted-foreground">기본 채널 진단은 무료입니다. 성장이 필요한 시점에 업그레이드하세요.</p>
        </div>

        <div className={`grid grid-cols-1 md:grid-cols-3 gap-px border border-foreground/10 bg-foreground/10 transition-all duration-700 delay-150 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          {plans.map(({ name, price, note, features, cta, href, highlight }) => (
            <div key={name} className={`p-8 lg:p-10 flex flex-col ${highlight ? "bg-foreground text-background" : "bg-background"}`}>
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
    <section className="relative py-16 lg:py-24 border-t border-foreground/10">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div
          ref={ref}
          className={`relative border border-foreground px-8 lg:px-16 py-16 lg:py-24 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          {/* Corner decorations */}
          <div className="absolute top-0 right-0 w-24 h-24 border-b border-l border-foreground/10" />
          <div className="absolute bottom-0 left-0 w-24 h-24 border-t border-r border-foreground/10" />

          <div className="relative z-10 max-w-2xl">
            <p className="font-mono text-xs tracking-[0.15em] uppercase text-muted-foreground mb-6">Get Started</p>
            <h2 className="font-heading text-4xl lg:text-6xl font-medium tracking-[-0.03em] leading-[1.1] mb-8">
              지금 채널을 등록하면<br />
              5분 안에 첫 분석 결과를<br />
              확인할 수 있습니다.
            </h2>
            <p className="text-lg text-muted-foreground mb-12 leading-relaxed">
              신용카드 없이 무료로 시작하세요.<br />
              채널 등록부터 첫 리포트까지, 어렵지 않습니다.
            </p>
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <Button size="lg" className="bg-black hover:bg-neutral-800 text-white px-8 h-12 text-base rounded-lg shadow-lg group" asChild>
                <a href="/channels">
                  무료로 채널 분석 시작하기
                  <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                </a>
              </Button>
            </div>
            <p className="mt-8 font-mono text-xs text-muted-foreground/60">
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
