"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check } from "lucide-react";
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
    <span className="inline-flex items-center text-sm font-mono text-muted-foreground mb-6">
      {children}
    </span>
  );
}

// ─── 01. Hero ───────────────────────────────────────────────────────────────

const heroStats = [
  { value: "4", unit: "개", label: "핵심 분석 모듈" },
  { value: "50", unit: "개", label: "영상 심층 분석" },
  { value: "30+9+7", unit: "", label: "신호·지표·패턴 분석" },
  { value: "무료", unit: "", label: "Free Start", isFree: true },
];

function HeroSection() {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setVisible(true); }, []);

  return (
    <section className="relative flex flex-col justify-center pt-20 pb-16 lg:pt-28 lg:pb-20 overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: "radial-gradient(circle, hsl(var(--foreground)/0.04) 1px, transparent 1px)", backgroundSize: "32px 32px" }}
      />
      {/* Orange glow */}
      <div className="absolute top-0 right-1/3 w-[600px] h-[400px] bg-orange-500/[0.05] rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-[1100px] mx-auto px-8 lg:px-16">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-6">

          {/* ── 왼쪽: 텍스트 영역 ── */}
          <div className="flex-1 min-w-0">
            {/* Badge */}
            <div className={`transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
              <span className="inline-flex items-center gap-2 text-xs font-mono tracking-widest text-foreground border border-foreground/20 bg-foreground/5 rounded-full px-3 py-1 mb-8">
                <span className="w-1.5 h-1.5 rounded-full bg-foreground/60 inline-block" />
                YouTube Channel Analytics
              </span>
            </div>

            {/* Headline */}
            <h1 className={`font-heading font-bold leading-[1.1] tracking-[-0.04em] transition-all duration-1000 delay-100 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
              <span className="block text-[clamp(2.4rem,5vw,4.2rem)] text-foreground whitespace-nowrap">
                성장 채널로 가는
              </span>
              <span className="block text-[clamp(1.6rem,3.2vw,2.8rem)] text-foreground whitespace-nowrap">
                가장 정밀한 네비게이션
              </span>
            </h1>

            {/* Patent */}
            <p className={`text-xs text-muted-foreground/50 mt-2 transition-all duration-700 delay-150 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
              특허출원 제10-2026-0075318호
            </p>

            {/* Sub description */}
            <p className={`text-base text-muted-foreground mt-5 leading-relaxed max-w-lg transition-all duration-700 delay-150 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
              최근 영상 <span className="text-orange-500 font-semibold">50</span>개와 채널 데이터를{" "}
              <span className="font-medium"><span className="text-orange-500 font-semibold">30</span>개 시그널 · <span className="text-orange-500 font-semibold">9</span>개 성장 지표 · <span className="text-orange-500 font-semibold">7</span>개 운영 패턴</span>으로 정밀 분석하여 다음 성장 전략을 제시합니다.
            </p>

            {/* CTA */}
            <div className={`flex items-center gap-4 mt-8 transition-all duration-700 delay-250 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
              <a
                href="/channels"
                className="inline-flex items-center gap-2 bg-foreground text-background px-7 py-3.5 rounded-xl font-semibold text-sm hover:bg-foreground/85 transition-colors shadow-lg shadow-foreground/10 animate-float-half"
              >
                내 채널 무료 분석하기
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            {/* Stats row */}
            <div className={`grid grid-cols-4 gap-6 border-t border-foreground/10 mt-10 pt-8 transition-all duration-700 delay-400 ${visible ? "opacity-100" : "opacity-0"}`}>
              {heroStats.map(({ value, unit, label, isFree }) => (
                <div key={label} className="flex flex-col">
                  <p className={`font-heading text-2xl lg:text-3xl font-semibold tracking-[-0.04em] leading-none ${isFree ? "text-orange-500" : ""}`}>
                    {value}<span className="text-sm lg:text-base font-normal ml-0.5">{unit}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-2 leading-tight">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── 오른쪽: 폴더 이미지 ── */}
          <div className={`flex-shrink-0 w-full lg:w-[420px] transition-all duration-1000 delay-200 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <div className="relative">
              <div className="absolute -inset-4 bg-orange-500/8 rounded-3xl blur-2xl pointer-events-none" />
              <img
                src="/hero-folder.png"
                alt="채널 분석 리포트 미리보기"
                className="relative w-full h-auto drop-shadow-2xl"
              />
            </div>
            <p className="mt-3 text-center text-xs text-muted-foreground/60 tracking-wide">
              채널 분석 전략 리포트 <span className="text-muted-foreground/40">|</span> 월간 발행
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}

// ─── 02. For You (Persona Cards) ────────────────────────────────────────────

const personas = [
  {
    id: "beginner",
    icon: "seedling" as const,
    label: "기획이 힘든 초보",
    pain: "꾸준히 올리는데\n구독자가 안 늘어요",
    solution: "성장을 막는 패턴을 데이터로 찾아드립니다",
    gradient: "from-emerald-500/20 to-emerald-500/5",
    hoverBorder: "group-hover:border-emerald-500/40",
    accent: "text-emerald-600",
  },
  {
    id: "growth",
    icon: "chart" as const,
    label: "조회수가 멈춘 성장기",
    pain: "어떤 주제를 올려야\n할지 모르겠어요",
    solution: "내 채널 흐름 기반 '다음 주제'를 바로 제안합니다",
    gradient: "from-amber-500/20 to-amber-500/5",
    hoverBorder: "group-hover:border-amber-500/40",
    accent: "text-amber-600",
  },
  {
    id: "pattern",
    icon: "pattern" as const,
    label: "성공 공식을 찾는 중급자",
    pain: "잘된 영상이 왜\n잘됐는지 모르겠어요",
    solution: "반복되는 성공 공식을 자동으로 추출합니다",
    gradient: "from-violet-500/20 to-violet-500/5",
    hoverBorder: "group-hover:border-violet-500/40",
    accent: "text-violet-600",
  },
  {
    id: "operator",
    icon: "analytics" as const,
    label: "데이터가 어려운 운영자",
    pain: "다음에 뭘 해야\n할지 막막해요",
    solution: "오늘 바로 실행할 액션 리스트를 제공합니다",
    gradient: "from-blue-500/20 to-blue-500/5",
    hoverBorder: "group-hover:border-blue-500/40",
    accent: "text-blue-600",
  },
];

function SeedlingIcon() {
  return (
    <svg viewBox="0 0 80 80" className="w-full h-full">
      <path d="M 25 55 L 30 70 L 50 70 L 55 55 Z" fill="currentColor" opacity="0.2" />
      <path d="M 25 55 L 30 70 L 50 70 L 55 55" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M 27 55 L 53 55" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M 40 55 Q 40 45 40 38" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <animate attributeName="d" values="M 40 55 Q 40 50 40 48;M 40 55 Q 40 45 40 38;M 40 55 Q 40 50 40 48" dur="3s" repeatCount="indefinite" />
      </path>
      <path d="M 40 40 Q 28 35 25 25 Q 35 28 40 40" fill="currentColor" opacity="0.3">
        <animate attributeName="d" values="M 40 42 Q 32 40 30 35 Q 35 38 40 42;M 40 40 Q 28 35 25 25 Q 35 28 40 40;M 40 42 Q 32 40 30 35 Q 35 38 40 42" dur="3s" repeatCount="indefinite" />
      </path>
      <path d="M 40 40 Q 28 35 25 25 Q 35 28 40 40" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <animate attributeName="d" values="M 40 42 Q 32 40 30 35 Q 35 38 40 42;M 40 40 Q 28 35 25 25 Q 35 28 40 40;M 40 42 Q 32 40 30 35 Q 35 38 40 42" dur="3s" repeatCount="indefinite" />
      </path>
      <path d="M 40 40 Q 52 35 55 25 Q 45 28 40 40" fill="currentColor" opacity="0.3">
        <animate attributeName="d" values="M 40 42 Q 48 40 50 35 Q 45 38 40 42;M 40 40 Q 52 35 55 25 Q 45 28 40 40;M 40 42 Q 48 40 50 35 Q 45 38 40 42" dur="3s" repeatCount="indefinite" />
      </path>
      <path d="M 40 40 Q 52 35 55 25 Q 45 28 40 40" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <animate attributeName="d" values="M 40 42 Q 48 40 50 35 Q 45 38 40 42;M 40 40 Q 52 35 55 25 Q 45 28 40 40;M 40 42 Q 48 40 50 35 Q 45 38 40 42" dur="3s" repeatCount="indefinite" />
      </path>
      <circle cx="58" cy="20" r="2" fill="currentColor" opacity="0">
        <animate attributeName="opacity" values="0;0.6;0" dur="2s" repeatCount="indefinite" />
        <animate attributeName="r" values="1;3;1" dur="2s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg viewBox="0 0 80 80" className="w-full h-full">
      <line x1="15" y1="65" x2="65" y2="65" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
      <line x1="15" y1="50" x2="65" y2="50" stroke="currentColor" strokeWidth="1" opacity="0.15" strokeDasharray="2 2" />
      <line x1="15" y1="35" x2="65" y2="35" stroke="currentColor" strokeWidth="1" opacity="0.15" strokeDasharray="2 2" />
      <line x1="15" y1="20" x2="65" y2="20" stroke="currentColor" strokeWidth="1" opacity="0.15" strokeDasharray="2 2" />
      <path
        d="M 15 60 Q 25 55 30 45 Q 35 35 40 32 L 50 32 L 65 32"
        fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray="100" strokeDashoffset="100"
      >
        <animate attributeName="stroke-dashoffset" values="100;0;0;100" dur="4s" repeatCount="indefinite" />
      </path>
      <rect x="40" y="28" width="25" height="10" rx="2" fill="currentColor" opacity="0">
        <animate attributeName="opacity" values="0;0;0.15;0.15;0" dur="4s" repeatCount="indefinite" />
      </rect>
      <g transform="translate(55, 22)">
        <circle r="8" fill="currentColor" opacity="0">
          <animate attributeName="opacity" values="0;0;0.2;0.2;0" dur="4s" repeatCount="indefinite" />
        </circle>
        <text textAnchor="middle" dominantBaseline="middle" fontSize="10" fontWeight="bold" fill="currentColor" opacity="0">
          ?
          <animate attributeName="opacity" values="0;0;1;1;0" dur="4s" repeatCount="indefinite" />
        </text>
      </g>
      <circle cx="40" cy="32" r="3" fill="currentColor" opacity="0">
        <animate attributeName="opacity" values="0;0;0.8;0" dur="4s" repeatCount="indefinite" />
        <animate attributeName="r" values="3;3;6;3" dur="4s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

function PatternIcon() {
  return (
    <svg viewBox="0 0 80 80" className="w-full h-full">
      <rect x="12" y="50" width="8" height="20" rx="1.5" fill="currentColor" opacity="0.15" />
      <rect x="24" y="42" width="8" height="28" rx="1.5" fill="currentColor" opacity="0.2" />
      <rect x="36" y="34" width="8" height="36" rx="1.5" fill="currentColor" opacity="0.25">
        <animate attributeName="opacity" values="0.25;0.55;0.25" dur="2s" repeatCount="indefinite" />
      </rect>
      <rect x="48" y="44" width="8" height="26" rx="1.5" fill="currentColor" opacity="0.15" />
      <path
        d="M 40 29 L 41.5 32 L 45 32 L 42 34 L 43.5 37.5 L 40 35.5 L 36.5 37.5 L 38 34 L 35 32 L 38.5 32 Z"
        fill="currentColor" opacity="0.5"
      >
        <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" />
      </path>
      <circle cx="55" cy="30" r="11" fill="none" stroke="currentColor" strokeWidth="2.5" opacity="0.7" />
      <circle cx="55" cy="30" r="11" fill="currentColor" opacity="0.04" />
      <line x1="63" y1="38" x2="70" y2="46" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
      <line x1="48" y1="30" x2="62" y2="30" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0">
        <animate attributeName="opacity" values="0;0.7;0.7;0" dur="3s" repeatCount="indefinite" />
        <animate attributeName="y1" values="24;30;36;36" dur="3s" repeatCount="indefinite" />
        <animate attributeName="y2" values="24;30;36;36" dur="3s" repeatCount="indefinite" />
      </line>
      <circle cx="44" cy="19" r="2" fill="currentColor" opacity="0">
        <animate attributeName="opacity" values="0;0.5;0" dur="2.5s" begin="0.5s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

function AnalyticsIcon() {
  return (
    <svg viewBox="0 0 80 80" className="w-full h-full">
      <rect x="12" y="15" width="56" height="42" rx="3" fill="none" stroke="currentColor" strokeWidth="2" />
      <rect x="12" y="15" width="56" height="42" rx="3" fill="currentColor" opacity="0.05" />
      <path d="M 35 57 L 35 65 L 30 65" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M 45 57 L 45 65 L 50 65" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="18" y="22" width="12" height="8" rx="1" fill="currentColor" opacity="0.2">
        <animate attributeName="opacity" values="0.2;0.5;0.2" dur="2s" begin="0s" repeatCount="indefinite" />
      </rect>
      <rect x="34" y="22" width="12" height="8" rx="1" fill="currentColor" opacity="0.2">
        <animate attributeName="opacity" values="0.2;0.5;0.2" dur="2s" begin="0.3s" repeatCount="indefinite" />
      </rect>
      <rect x="50" y="22" width="12" height="8" rx="1" fill="currentColor" opacity="0.2">
        <animate attributeName="opacity" values="0.2;0.5;0.2" dur="2s" begin="0.6s" repeatCount="indefinite" />
      </rect>
      <rect x="20" y="42" width="6" height="10" rx="1" fill="currentColor" opacity="0.3">
        <animate attributeName="height" values="10;14;10" dur="3s" repeatCount="indefinite" />
        <animate attributeName="y" values="42;38;42" dur="3s" repeatCount="indefinite" />
      </rect>
      <rect x="29" y="38" width="6" height="14" rx="1" fill="currentColor" opacity="0.4">
        <animate attributeName="height" values="14;8;14" dur="3s" begin="0.5s" repeatCount="indefinite" />
        <animate attributeName="y" values="38;44;38" dur="3s" begin="0.5s" repeatCount="indefinite" />
      </rect>
      <rect x="38" y="36" width="6" height="16" rx="1" fill="currentColor" opacity="0.5">
        <animate attributeName="height" values="16;20;16" dur="3s" begin="1s" repeatCount="indefinite" />
        <animate attributeName="y" values="36;32;36" dur="3s" begin="1s" repeatCount="indefinite" />
      </rect>
      <rect x="47" y="40" width="6" height="12" rx="1" fill="currentColor" opacity="0.35">
        <animate attributeName="height" values="12;6;12" dur="3s" begin="1.5s" repeatCount="indefinite" />
        <animate attributeName="y" values="40;46;40" dur="3s" begin="1.5s" repeatCount="indefinite" />
      </rect>
      <rect x="56" y="34" width="6" height="18" rx="1" fill="currentColor" opacity="0.45">
        <animate attributeName="height" values="18;12;18" dur="3s" begin="2s" repeatCount="indefinite" />
        <animate attributeName="y" values="34;40;34" dur="3s" begin="2s" repeatCount="indefinite" />
      </rect>
    </svg>
  );
}

function PersonaIcon({ type }: { type: typeof personas[0]["icon"] }) {
  if (type === "seedling") return <SeedlingIcon />;
  if (type === "chart") return <ChartIcon />;
  if (type === "pattern") return <PatternIcon />;
  return <AnalyticsIcon />;
}

function PersonaCard({ persona, index }: { persona: typeof personas[0]; index: number }) {
  const { ref, visible } = useFadeIn(0.2);

  return (
    <div
      ref={ref}
      className={`group relative transition-all duration-700 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
      }`}
      style={{ transitionDelay: `${index * 150}ms` }}
    >
      <div className={`relative h-full border border-foreground/10 rounded-2xl p-6 lg:p-8 transition-all duration-500 ${persona.hoverBorder} hover:shadow-lg overflow-hidden cursor-default`}>
        <div className={`absolute inset-0 bg-gradient-to-b ${persona.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
        <div className="relative z-10 flex flex-col h-full">
          <div className={`w-16 h-16 mb-5 ${persona.accent} transition-transform duration-500 group-hover:scale-110`}>
            <PersonaIcon type={persona.icon} />
          </div>
          <div className="mb-4">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-foreground/5 ${persona.accent}`}>
              {persona.label}
            </span>
          </div>
          <h3 className="font-heading text-xl lg:text-2xl font-medium tracking-[-0.02em] mb-3 leading-tight whitespace-pre-line">
            &ldquo;{persona.pain}&rdquo;
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed mt-auto">
            {persona.solution}
          </p>
          <div className={`mt-5 flex items-center gap-1.5 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${persona.accent}`}>
            <span>이런 분들을 위한 솔루션</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
}

function PainPointsSection() {
  const { ref, visible } = useFadeIn();

  return (
    <section className="relative py-10 lg:py-20 border-t border-foreground/10">
      <div className="max-w-[1080px] mx-auto px-8 lg:px-20">
        <div ref={ref} className={`mb-10 text-center transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-6">
            <span className="w-8 h-px bg-foreground/30 inline-block" />
            For Creators
            <span className="w-8 h-px bg-foreground/30 inline-block" />
          </span>
          <h2 className="font-heading text-4xl lg:text-5xl font-medium tracking-[-0.03em] leading-[1.1] mt-2">
            이런 분께<br />
            <span className="text-muted-foreground">꼭 필요합니다</span>
          </h2>
          <p className={`mt-4 text-base text-muted-foreground transition-all duration-700 delay-100 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            어느 단계에 계시든, 튜브워치가 다음 성장을 함께합니다
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
          {personas.map((persona, index) => (
            <PersonaCard key={persona.id} persona={persona} index={index} />
          ))}
        </div>
        <div className={`mt-10 text-center transition-all duration-700 delay-700 ${visible ? "opacity-100" : "opacity-0"}`}>
          <p className="text-sm text-muted-foreground">
            <span className="inline-block w-2 h-2 rounded-full bg-orange-500 mr-2 animate-pulse" />
            지금 무료로 채널 진단을 시작해보세요
          </p>
        </div>
      </div>
    </section>
  );
}

// ─── 03. Features ───────────────────────────────────────────────────────────

const tools = [
  {
    id: "channel-analysis",
    title: "채널 분석",
    subtitle: "Channel Analysis",
    description: "채널 종합 점수로 지금 가장 큰 문제를 바로 찾습니다",
  },
  {
    id: "action-plan",
    title: "액션 플랜",
    subtitle: "Action Plan",
    description: "분석 결과를 오늘 바로 실행할 액션 리스트로 전환합니다",
  },
  {
    id: "next-trend",
    title: "넥스트 트렌드",
    subtitle: "Next Trend",
    description: "내 채널 흐름 기반 다음 영상 주제를 바로 제안합니다",
  },
  {
    id: "success-formula",
    title: "채널 DNA",
    subtitle: "Channel DNA",
    description: "잘된 영상의 성공 공식과 스윗 스팟을 자동으로 추출합니다",
  },
];

function ChannelAnalysisPreview() {
  const [score, setScore] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    setStarted(true);
  }, []);

  useEffect(() => {
    if (!started) return;
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        setScore((prev) => {
          if (prev >= 78) { clearInterval(interval); return 78; }
          return prev + 2;
        });
      }, 30);
      return () => clearInterval(interval);
    }, 300);
    return () => clearTimeout(timer);
  }, [started]);

  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-4">
      <div className="relative w-32 h-32 lg:w-36 lg:h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeWidth="8" className="text-foreground/10" />
          <circle
            cx="60" cy="60" r="54"
            fill="none" stroke="url(#scoreGradient)"
            strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: "stroke-dashoffset 0.08s linear" }}
          />
          <defs>
            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#fb923c" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl lg:text-4xl font-heading font-medium">{score}</span>
          <span className="text-xs text-muted-foreground mt-1">/ 100점</span>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <span className="px-3 py-1 rounded-full bg-orange-500/10 text-orange-600 text-xs font-medium">B+ 등급</span>
        <span className="text-xs text-muted-foreground">성장 가능성 높음</span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3 w-full max-w-[200px]">
        {[
          { label: "콘텐츠", value: "82" },
          { label: "참여도", value: "71" },
          { label: "성장률", value: "85" },
        ].map((stat) => (
          <div key={stat.label} className="text-center">
            <div className="text-sm font-medium">{stat.value}</div>
            <div className="text-[10px] text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActionPlanPreview() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 4);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const steps = [
    { week: "1주차", task: "채널 브랜딩 정비" },
    { week: "2주차", task: "콘텐츠 기획안 작성" },
    { week: "3주차", task: "키워드 최적화 적용" },
    { week: "4주차", task: "성과 분석 & 개선" },
  ];

  return (
    <div className="relative w-full h-full flex flex-col p-4 lg:p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-mono text-muted-foreground">ROADMAP</span>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">4주 플랜</span>
      </div>
      <div className="flex-1 flex flex-col justify-center space-y-3">
        {steps.map((step, index) => {
          const isActive = index === activeStep;
          const isDone = index < activeStep;
          return (
            <div
              key={step.week}
              className={`flex items-center gap-3 transition-all duration-500 ${isActive ? "scale-[1.03] translate-x-1" : ""}`}
            >
              <div className="relative flex-shrink-0">
                <div className={`w-3 h-3 rounded-full transition-all duration-300 ${isDone ? "bg-emerald-500" : isActive ? "bg-orange-500 ring-4 ring-orange-500/20" : "bg-foreground/20"}`} />
                {index < steps.length - 1 && (
                  <div className={`absolute top-3 left-1/2 w-0.5 h-6 -translate-x-1/2 transition-colors duration-300 ${isDone ? "bg-emerald-500" : "bg-foreground/10"}`} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-mono ${isActive ? "text-orange-600" : "text-muted-foreground"}`}>{step.week}</span>
                  {isDone && (
                    <svg className="w-3 h-3 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <p className={`text-sm truncate transition-colors duration-300 ${isActive ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                  {step.task}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NextTrendPreview() {
  const [activeIndex, setActiveIndex] = useState(0);

  const trends = [
    { topic: "AI 활용 브이로그", score: 94, badge: "추천 1순위" },
    { topic: "미니멀 라이프", score: 87, badge: "채널 연관" },
    { topic: "1인 캠핑", score: 82, badge: "성장 중" },
    { topic: "홈카페 레시피", score: 79, badge: "참여 높음" },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev >= trends.length - 1 ? 0 : prev + 1));
    }, 1500);
    return () => clearInterval(interval);
  }, [trends.length]);

  return (
    <div className="relative w-full h-full flex flex-col p-4 lg:p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-mono text-muted-foreground">NEXT TOPIC</span>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600">내 채널 기반</span>
      </div>
      <div className="flex-1 flex flex-col justify-center space-y-2">
        {trends.map((trend, index) => (
          <div
            key={trend.topic}
            className={`flex items-center gap-3 p-2 rounded-lg transition-all duration-300 ${index === activeIndex ? "bg-foreground/5 scale-[1.02]" : ""}`}
          >
            <span className={`w-5 h-5 rounded text-xs flex items-center justify-center font-mono shrink-0 transition-colors duration-300 ${index === 0 ? "bg-orange-500 text-white" : "bg-foreground/10 text-muted-foreground"}`}>
              {index + 1}
            </span>
            <p className="flex-1 text-sm truncate">{trend.topic}</p>
            <div className="w-16 h-1.5 bg-foreground/10 rounded-full overflow-hidden shrink-0">
              <div
                className={`h-full rounded-full transition-all duration-500 ${index === 0 ? "bg-orange-500" : "bg-foreground/30"}`}
                style={{ width: `${trend.score}%` }}
              />
            </div>
            <span className="text-[10px] text-orange-500 font-mono shrink-0 text-right w-14">{trend.badge}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 text-center">
        <span className="text-[10px] text-muted-foreground">내 채널 흐름 기반 다음 주제 추천</span>
      </div>
    </div>
  );
}

function SuccessFormulaPreview() {
  const [animationPhase, setAnimationPhase] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationPhase((prev) => (prev + 1) % 3);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-full flex flex-col p-4 lg:p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-mono text-muted-foreground">SWEET SPOT</span>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-600">최적 구간 발견</span>
      </div>
      <div className="flex-1 relative">
        <svg viewBox="0 0 200 140" className="w-full h-full">
          <line x1="30" y1="120" x2="190" y2="120" stroke="currentColor" strokeWidth="1" opacity="0.15" />
          <line x1="30" y1="20" x2="30" y2="120" stroke="currentColor" strokeWidth="1" opacity="0.15" />
          {[40, 60, 80, 100].map((y) => (
            <line key={y} x1="30" y1={y} x2="190" y2={y} stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" opacity="0.07" />
          ))}
          <text x="110" y="135" textAnchor="middle" fontSize="8" fill="currentColor" opacity="0.35">영상 길이</text>
          <text x="15" y="70" textAnchor="middle" fontSize="8" fill="currentColor" opacity="0.35" transform="rotate(-90, 15, 70)">조회수</text>
          {[
            { x: 50, y: 90 }, { x: 70, y: 75 }, { x: 90, y: 55 },
            { x: 110, y: 40 }, { x: 130, y: 50 }, { x: 150, y: 70 }, { x: 170, y: 85 },
          ].map((point, i) => (
            <circle key={i} cx={point.x} cy={point.y} r="4" fill="currentColor" opacity="0.2">
              <animate attributeName="r" values="3;5;3" dur="2s" begin={`${i * 0.2}s`} repeatCount="indefinite" />
            </circle>
          ))}
          <path
            d="M 50 90 Q 80 60 110 40 Q 140 55 170 85"
            fill="none" stroke="url(#curveGradient)"
            strokeWidth="2.5" strokeLinecap="round"
            strokeDasharray="200"
            strokeDashoffset={animationPhase === 0 ? 200 : 0}
            style={{ transition: "stroke-dashoffset 1s ease" }}
          />
          <defs>
            <linearGradient id="curveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0.3" />
            </linearGradient>
          </defs>
          <g opacity={animationPhase >= 1 ? 1 : 0} style={{ transition: "opacity 0.5s" }}>
            <rect x="95" y="30" width="30" height="40" rx="4" fill="#f97316" opacity="0.1" />
            <circle cx="110" cy="40" r="6" fill="#f97316">
              <animate attributeName="r" values="5;7;5" dur="1.5s" repeatCount="indefinite" />
            </circle>
          </g>
          <g opacity={animationPhase >= 2 ? 1 : 0} style={{ transition: "opacity 0.5s" }}>
            <rect x="115" y="25" width="55" height="18" rx="3" className="fill-foreground" />
            <text x="142" y="37" textAnchor="middle" fontSize="8" fontWeight="500" className="fill-background">
              8~12분 최적
            </text>
          </g>
        </svg>
      </div>
      <div className="flex items-center justify-center gap-2 mt-2">
        <span className="w-2 h-2 rounded-full bg-orange-500" />
        <span className="text-[10px] text-muted-foreground">내 채널의 최적 영상 길이 발견</span>
      </div>
    </div>
  );
}

function ToolPreview({ id }: { id: string }) {
  if (id === "channel-analysis") return <ChannelAnalysisPreview />;
  if (id === "action-plan") return <ActionPlanPreview />;
  if (id === "next-trend") return <NextTrendPreview />;
  return <SuccessFormulaPreview />;
}

function ToolCard({ tool, index }: { tool: typeof tools[0]; index: number }) {
  const { ref, visible } = useFadeIn(0.2);

  return (
    <div
      ref={ref}
      className={`group relative transition-all duration-700 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
      }`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div className="relative h-full border border-foreground/10 rounded-2xl overflow-hidden transition-all duration-500 hover:border-foreground/20 hover:shadow-xl bg-background">
        <div className="h-64 lg:h-72 border-b border-foreground/5 bg-foreground/[0.02]">
          <ToolPreview id={tool.id} />
        </div>
        <div className="p-4 lg:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-heading text-lg font-medium mb-0.5 group-hover:text-orange-600 transition-colors duration-300">
                {tool.title}
              </h3>
              <p className="text-xs font-mono text-muted-foreground">{tool.subtitle}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-foreground/5 flex items-center justify-center shrink-0 group-hover:bg-orange-500 group-hover:text-white transition-all duration-300">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-2">{tool.description}</p>
        </div>
      </div>
    </div>
  );
}

function FeaturesSection() {
  const { ref, visible } = useFadeIn();

  return (
    <section id="features" className="relative py-10 lg:py-20 border-t border-foreground/10 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />
      </div>
      <div className="relative z-10 max-w-[1080px] mx-auto px-8 lg:px-20">
        <div ref={ref} className={`mb-10 text-center transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-6">
            <span className="w-8 h-px bg-foreground/30 inline-block" />
            Core Tools
            <span className="w-8 h-px bg-foreground/30 inline-block" />
          </span>
          <h2 className="font-heading text-4xl lg:text-5xl font-medium tracking-[-0.03em] leading-[1.1] mt-2">
            읽는 순간 이해되는<br />
            <span className="text-orange-600 dark:text-orange-500">4가지 분석 도구</span>
          </h2>
          <p className={`mt-4 text-base text-muted-foreground transition-all duration-700 delay-100 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            텍스트 설명 없이도 바로 이해되는 직관적인 분석 UI
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
          {tools.map((tool, index) => (
            <ToolCard key={tool.id} tool={tool} index={index} />
          ))}
        </div>
        <div className={`mt-10 text-center transition-all duration-700 delay-500 ${visible ? "opacity-100" : "opacity-0"}`}>
          <p className="text-sm text-muted-foreground mb-3">모든 도구는 연결되어 더 강력한 인사이트를 제공합니다</p>
          <div className="flex items-center justify-center gap-2">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-foreground/20 animate-pulse"
                style={{ animationDelay: `${i * 0.3}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── 04. How It Works ───────────────────────────────────────────────────────

const workSteps = [
  { number: 1, title: "채널 연동",   description: "유튜브 채널 URL 입력", duration: "30초",    icon: "link"     as const },
  { number: 2, title: "데이터 수집", description: "최근 영상 50개 분석", duration: "1분",     icon: "download" as const },
  { number: 3, title: "AI 분석",    description: "30 데이터 시그널 · 9 성장 지표 · 7 채널 운영 패턴 처리", duration: "2분",     icon: "brain"    as const },
  { number: 4, title: "리포트 생성", description: "맞춤 전략 도출",     duration: "1분 30초", icon: "report"  as const },
];

function WorkLinkIcon({ isActive, isComplete }: { isActive: boolean; isComplete: boolean }) {
  const cls = `w-full h-full transition-colors duration-500 ${isComplete ? "text-emerald-500" : isActive ? "text-orange-500" : "text-foreground/30"}`;
  return (
    <svg viewBox="0 0 40 40" className={cls}>
      <circle cx="14" cy="20" r="6" fill="none" stroke="currentColor" strokeWidth="2.5">
        {isActive && <animate attributeName="r" values="6;7;6" dur="1s" repeatCount="indefinite" />}
      </circle>
      <circle cx="26" cy="20" r="6" fill="none" stroke="currentColor" strokeWidth="2.5">
        {isActive && <animate attributeName="r" values="6;7;6" dur="1s" begin="0.2s" repeatCount="indefinite" />}
      </circle>
      <path d="M 18 20 L 22 20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        {isActive && <animate attributeName="stroke-dasharray" values="0 10;10 0;0 10" dur="1.5s" repeatCount="indefinite" />}
      </path>
      {isComplete && (
        <path d="M 16 20 L 19 23 L 25 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      )}
    </svg>
  );
}

function WorkDownloadIcon({ isActive, isComplete }: { isActive: boolean; isComplete: boolean }) {
  const cls = `w-full h-full transition-colors duration-500 ${isComplete ? "text-emerald-500" : isActive ? "text-orange-500" : "text-foreground/30"}`;
  return (
    <svg viewBox="0 0 40 40" className={cls}>
      <rect x="12" y="10" width="16" height="20" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M 20 14 L 20 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        {isActive && <animate attributeName="d" values="M 20 14 L 20 18;M 20 14 L 20 24;M 20 14 L 20 18" dur="1s" repeatCount="indefinite" />}
      </path>
      <path d="M 16 21 L 20 25 L 24 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none">
        {isActive && <animate attributeName="opacity" values="0.3;1;0.3" dur="1s" repeatCount="indefinite" />}
      </path>
    </svg>
  );
}

function WorkBrainIcon({ isActive, isComplete }: { isActive: boolean; isComplete: boolean }) {
  const cls = `w-full h-full transition-colors duration-500 ${isComplete ? "text-emerald-500" : isActive ? "text-orange-500" : "text-foreground/30"}`;
  const nodes = [
    { cx: 16, cy: 16, delay: "0s" }, { cx: 24, cy: 16, delay: "0.2s" },
    { cx: 20, cy: 22, delay: "0.4s" }, { cx: 14, cy: 26, delay: "0.6s" }, { cx: 26, cy: 26, delay: "0.3s" },
  ];
  return (
    <svg viewBox="0 0 40 40" className={cls}>
      <path d="M 20 8 Q 28 8 30 14 Q 34 16 32 22 Q 34 28 28 30 Q 26 34 20 32 Q 14 34 12 30 Q 6 28 8 22 Q 6 16 10 14 Q 12 8 20 8" fill="none" stroke="currentColor" strokeWidth="2" />
      {nodes.map(({ cx, cy, delay }, i) => (
        <circle key={i} cx={cx} cy={cy} r="2" fill="currentColor" opacity="0.5">
          {isActive && <animate attributeName="opacity" values="0.3;1;0.3" dur="0.8s" begin={delay} repeatCount="indefinite" />}
        </circle>
      ))}
      <line x1="16" y1="16" x2="24" y2="16" stroke="currentColor" strokeWidth="1" opacity="0.3" />
      <line x1="16" y1="16" x2="20" y2="22" stroke="currentColor" strokeWidth="1" opacity="0.3" />
      <line x1="24" y1="16" x2="20" y2="22" stroke="currentColor" strokeWidth="1" opacity="0.3" />
      <line x1="20" y1="22" x2="14" y2="26" stroke="currentColor" strokeWidth="1" opacity="0.3" />
      <line x1="20" y1="22" x2="26" y2="26" stroke="currentColor" strokeWidth="1" opacity="0.3" />
    </svg>
  );
}

function WorkReportIcon({ isActive, isComplete }: { isActive: boolean; isComplete: boolean }) {
  const cls = `w-full h-full transition-colors duration-500 ${isComplete ? "text-emerald-500" : isActive ? "text-orange-500" : "text-foreground/30"}`;
  return (
    <svg viewBox="0 0 40 40" className={cls}>
      <path d="M 12 8 L 24 8 L 28 12 L 28 32 L 12 32 Z" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M 24 8 L 24 12 L 28 12" fill="none" stroke="currentColor" strokeWidth="2" />
      <rect x="15" y="24" width="3" height="5" fill="currentColor" opacity="0.4">
        {isActive && <animate attributeName="height" values="2;5;2" dur="1s" repeatCount="indefinite" />}
      </rect>
      <rect x="19" y="20" width="3" height="9" fill="currentColor" opacity="0.4">
        {isActive && <animate attributeName="height" values="4;9;4" dur="1s" begin="0.2s" repeatCount="indefinite" />}
      </rect>
      <rect x="23" y="22" width="3" height="7" fill="currentColor" opacity="0.4">
        {isActive && <animate attributeName="height" values="3;7;3" dur="1s" begin="0.4s" repeatCount="indefinite" />}
      </rect>
      <line x1="15" y1="14" x2="25" y2="14" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
      <line x1="15" y1="17" x2="22" y2="17" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
    </svg>
  );
}

function WorkStepIcon({ type, isActive, isComplete }: { type: typeof workSteps[0]["icon"]; isActive: boolean; isComplete: boolean }) {
  const props = { isActive, isComplete };
  if (type === "link") return <WorkLinkIcon {...props} />;
  if (type === "download") return <WorkDownloadIcon {...props} />;
  if (type === "brain") return <WorkBrainIcon {...props} />;
  return <WorkReportIcon {...props} />;
}

function WorkTimerDisplay({ isRunning }: { isRunning: boolean }) {
  const [elapsed, setElapsed] = useState(0);
  const total = 300;

  useEffect(() => {
    if (!isRunning) { setElapsed(0); return; }
    const id = setInterval(() => setElapsed(p => p >= total ? total : p + 1), 25);
    return () => clearInterval(id);
  }, [isRunning]);

  const pct = (elapsed / total) * 100;
  const circ = 2 * Math.PI * 45;
  const min = Math.floor(elapsed / 60);
  const sec = elapsed % 60;

  return (
    <div className="flex flex-col items-center shrink-0">
      <div className="relative w-28 h-28 lg:w-32 lg:h-32">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="5" className="text-foreground/10" />
          <circle
            cx="50" cy="50" r="45"
            fill="none" stroke="url(#timerGrad)"
            strokeWidth="5" strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ - (pct / 100) * circ}
            style={{ transition: "stroke-dashoffset 0.02s linear" }}
          />
          {Array.from({ length: 60 }).map((_, i) => {
            const a = (i * 6 - 90) * (Math.PI / 180);
            const big = i % 5 === 0;
            const r1 = big ? 36 : 38;
            return (
              <line key={i}
                x1={50 + r1 * Math.cos(a)} y1={50 + r1 * Math.sin(a)}
                x2={50 + 42 * Math.cos(a)} y2={50 + 42 * Math.sin(a)}
                stroke="currentColor" strokeWidth={big ? "1.5" : "0.5"}
                className={big ? "text-foreground/30" : "text-foreground/10"}
              />
            );
          })}
          <defs>
            <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#fb923c" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl lg:text-3xl font-mono font-medium tabular-nums">
            {min}:{sec.toString().padStart(2, "0")}
          </span>
          <span className="text-[10px] text-muted-foreground mt-0.5">/ 5:00</span>
        </div>
        {isRunning && elapsed < total && (
          <div className="absolute inset-0 rounded-full border-2 border-orange-500/20 animate-ping-slow pointer-events-none" />
        )}
      </div>
      <div className="mt-3 flex items-center gap-1.5">
        <svg viewBox="0 0 24 24" className="w-4 h-4 text-orange-500">
          <path d="M 6 2 L 18 2 L 18 6 Q 18 10 12 12 Q 6 10 6 6 Z" fill="currentColor" opacity="0.3">
            {isRunning && <animate attributeName="opacity" values="0.3;0.1;0.3" dur="1s" repeatCount="indefinite" />}
          </path>
          <path d="M 6 22 L 18 22 L 18 18 Q 18 14 12 12 Q 6 14 6 18 Z" fill="currentColor" opacity="0.5" />
          <path d="M 6 2 L 18 2 L 18 6 Q 18 10 12 12 Q 6 10 6 6 L 6 2 M 6 22 L 18 22 L 18 18 Q 18 14 12 12 Q 6 14 6 18 L 6 22" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
        </svg>
        <span className="text-sm font-medium text-orange-600 dark:text-orange-500">단 5분</span>
      </div>
    </div>
  );
}

function WorkStepCard({
  step, activeStep, completedSteps,
}: {
  step: typeof workSteps[0];
  activeStep: number;
  completedSteps: number[];
}) {
  const idx = step.number - 1;
  const isActive = idx === activeStep;
  const isComplete = completedSteps.includes(idx);

  return (
    <div className={`flex flex-col items-center transition-all duration-500 shrink-0 ${isActive ? "scale-105" : !isComplete ? "opacity-50" : ""}`}>
      <div className={`relative w-16 h-16 lg:w-20 lg:h-20 rounded-full flex items-center justify-center transition-all duration-500 ${isComplete ? "bg-emerald-500/10 ring-2 ring-emerald-500/30" : isActive ? "bg-orange-500/10 ring-2 ring-orange-500/30" : "bg-foreground/5"}`}>
        <div className="w-8 h-8 lg:w-10 lg:h-10">
          <WorkStepIcon type={step.icon} isActive={isActive} isComplete={isComplete} />
        </div>
        <div className={`absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-all duration-300 ${isComplete ? "bg-emerald-500 text-white" : isActive ? "bg-orange-500 text-white" : "bg-foreground/10 text-foreground/50"}`}>
          {isComplete ? (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <span>{step.number}</span>
          )}
        </div>
        {isActive && (
          <div className="absolute inset-0 rounded-full border-2 border-orange-500/40 animate-ping-slow pointer-events-none" />
        )}
      </div>
      <div className="text-center mt-3">
        <h4 className={`font-heading text-sm lg:text-base font-medium mb-0.5 transition-colors duration-300 ${isComplete ? "text-emerald-600" : isActive ? "text-orange-600 dark:text-orange-500" : ""}`}>
          {step.title}
        </h4>
        <p className="text-xs text-muted-foreground mb-1.5">{step.description}</p>
        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-mono ${isComplete ? "bg-emerald-500/10 text-emerald-600" : isActive ? "bg-orange-500/10 text-orange-600" : "bg-foreground/5 text-muted-foreground"}`}>
          {step.duration}
        </span>
      </div>
    </div>
  );
}

function StepArrow({ active }: { active: boolean }) {
  return (
    <div className={`hidden lg:flex items-center shrink-0 px-1 transition-colors duration-700 ${active ? "text-orange-500" : "text-foreground/15"}`}>
      <svg viewBox="0 0 48 12" className="w-8 lg:w-10 h-3">
        <path d="M 2 6 L 36 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M 32 2 L 40 6 L 32 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    </div>
  );
}

function HowItWorksSection() {
  const { ref, visible } = useFadeIn(0.3);
  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [timerKey, setTimerKey] = useState(0);

  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => setIsRunning(true), 600);
    return () => clearTimeout(t);
  }, [visible]);

  useEffect(() => {
    if (!isRunning) return;
    const durations = [450, 900, 1800, 1350];
    let stepIdx = 0;
    let cancelled = false;
    let tid: ReturnType<typeof setTimeout>;

    const advance = () => {
      if (cancelled) return;
      if (stepIdx >= workSteps.length) {
        tid = setTimeout(() => {
          if (cancelled) return;
          setActiveStep(0);
          setCompletedSteps([]);
          setTimerKey(k => k + 1);
          stepIdx = 0;
          advance();
        }, 2000);
        return;
      }
      setActiveStep(stepIdx);
      tid = setTimeout(() => {
        if (cancelled) return;
        setCompletedSteps(prev => [...prev, stepIdx]);
        stepIdx++;
        advance();
      }, durations[stepIdx] ?? 1000);
    };

    advance();
    return () => { cancelled = true; clearTimeout(tid); };
  }, [isRunning]);

  return (
    <section className="relative py-10 lg:py-20 border-t border-foreground/10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-orange-500/[0.02] to-transparent pointer-events-none" />
      <div className="relative z-10 max-w-[1080px] mx-auto px-8 lg:px-20">
        <div ref={ref} className={`mb-12 text-center transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-6">
            <span className="w-8 h-px bg-foreground/30 inline-block" />
            Quick Start
            <span className="w-8 h-px bg-foreground/30 inline-block" />
          </span>
          <h2 className="font-heading text-4xl lg:text-5xl font-medium tracking-[-0.03em] leading-[1.1] mt-2">
            <span className="text-orange-600 dark:text-orange-500">4단계</span>,{" "}
            <span className="text-muted-foreground">5분 안에 첫 결과</span>
          </h2>
          <p className={`mt-4 text-base text-muted-foreground transition-all duration-700 delay-100 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            채널 등록부터 맞춤 전략 리포트까지, 커피 한 잔 마시기도 전에 완료됩니다
          </p>
        </div>

        {/* Desktop: 1→2→timer→3→4 수평 플로우 */}
        <div className={`hidden lg:flex items-center justify-center transition-all duration-700 delay-200 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <WorkStepCard step={workSteps[0]} activeStep={activeStep} completedSteps={completedSteps} />
          <StepArrow active={completedSteps.includes(0)} />
          <WorkStepCard step={workSteps[1]} activeStep={activeStep} completedSteps={completedSteps} />
          <StepArrow active={completedSteps.includes(1)} />
          <WorkTimerDisplay key={timerKey} isRunning={isRunning} />
          <StepArrow active={completedSteps.includes(1)} />
          <WorkStepCard step={workSteps[2]} activeStep={activeStep} completedSteps={completedSteps} />
          <StepArrow active={completedSteps.includes(2)} />
          <WorkStepCard step={workSteps[3]} activeStep={activeStep} completedSteps={completedSteps} />
        </div>

        {/* Mobile: 타이머 + 2×2 그리드 */}
        <div className={`lg:hidden flex flex-col items-center gap-8 transition-all duration-700 delay-200 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <WorkTimerDisplay key={timerKey} isRunning={isRunning} />
          <div className="grid grid-cols-2 gap-6 w-full max-w-sm">
            {workSteps.map((step) => (
              <WorkStepCard key={step.number} step={step} activeStep={activeStep} completedSteps={completedSteps} />
            ))}
          </div>
          <div className="relative w-full h-1.5 bg-foreground/10 rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${(completedSteps.length / workSteps.length) * 100}%` }}
            />
          </div>
        </div>

        <div className={`mt-12 text-center transition-all duration-700 delay-500 ${visible ? "opacity-100" : "opacity-0"}`}>
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-foreground/5 border border-foreground/10">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse shrink-0" />
            <span className="text-sm text-muted-foreground">채널 URL만 입력하면 바로 시작됩니다</span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── 05. Why TubeWatch ──────────────────────────────────────────────────────

const comparisonItems = [
  {
    category: "데이터 분석",
    features: [
      { name: "조회수·구독자 수치 제공", others: true, tubewatch: true, highlight: false },
      { name: "성과 원인 분석 (왜 떴는지)", others: false, tubewatch: true, highlight: true },
      { name: "30개 데이터 시그널 · 9개 성장 지표 · 7개 채널 운영 패턴 종합 진단", others: false, tubewatch: true, highlight: true },
    ],
  },
  {
    category: "콘텐츠 기획",
    features: [
      { name: "인기 키워드 리스트 제공", others: true, tubewatch: true, highlight: false },
      { name: "내 채널 맞춤 주제 추천", others: false, tubewatch: true, highlight: true },
      { name: "구체적 기획안 자동 생성", others: false, tubewatch: true, highlight: true },
    ],
  },
  {
    category: "실행 가이드",
    features: [
      { name: "일반적인 성장 팁 제공", others: true, tubewatch: true, highlight: false },
      { name: "단계별 실행 로드맵 제공", others: false, tubewatch: true, highlight: true },
      { name: "주간 액션 플랜 자동 생성", others: false, tubewatch: true, highlight: true },
    ],
  },
  {
    category: "성공 공식",
    features: [
      { name: "업계 평균 벤치마크 제공", others: true, tubewatch: true, highlight: false },
      { name: "스윗 스팟 영역 발견", others: false, tubewatch: true, highlight: true },
      { name: "나만의 성공 패턴 도출", others: false, tubewatch: true, highlight: true },
    ],
  },
];

function CheckIcon({ checked, highlight }: { checked: boolean; highlight: boolean }) {
  if (!checked) {
    return (
      <div className="w-8 h-8 rounded-full bg-foreground/5 flex items-center justify-center">
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-foreground/20">
          <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    );
  }
  return (
    <div
      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
        highlight
          ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30"
          : "bg-emerald-500/10 text-emerald-600"
      }`}
    >
      <svg viewBox="0 0 24 24" className="w-5 h-5">
        <path
          d="M5 12l5 5L19 7"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function AnimatedRow({
  feature,
  index,
  isVisible,
}: {
  feature: (typeof comparisonItems)[0]["features"][0];
  index: number;
  isVisible: boolean;
}) {
  const [showCheck, setShowCheck] = useState(false);

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => setShowCheck(true), 300 + index * 100);
      return () => clearTimeout(timer);
    }
  }, [isVisible, index]);

  return (
    <div
      className={`grid grid-cols-[1fr_80px_80px] lg:grid-cols-[1fr_120px_120px] items-center py-4 border-b border-foreground/5 transition-all duration-500 ${
        isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
      } ${feature.highlight ? "bg-orange-500/[0.02]" : ""}`}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      <div className="flex items-center gap-3">
        {feature.highlight && (
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 flex-shrink-0" />
        )}
        <span
          className={`text-sm lg:text-base ${
            feature.highlight ? "font-medium" : "text-muted-foreground"
          }`}
        >
          {feature.name}
        </span>
      </div>
      <div className="flex justify-center">
        <div
          className={`transition-all duration-300 ${
            showCheck ? "scale-100 opacity-100" : "scale-50 opacity-0"
          }`}
          style={{ transitionDelay: `${index * 80 + 100}ms` }}
        >
          <CheckIcon checked={feature.others} highlight={false} />
        </div>
      </div>
      <div className="flex justify-center">
        <div
          className={`transition-all duration-500 ${
            showCheck ? "scale-100 opacity-100" : "scale-50 opacity-0"
          }`}
          style={{ transitionDelay: `${index * 80 + 200}ms` }}
        >
          <CheckIcon checked={feature.tubewatch} highlight={feature.highlight} />
        </div>
      </div>
    </div>
  );
}

function CategoryBlock({
  category,
  categoryIndex,
  isVisible,
}: {
  category: (typeof comparisonItems)[0];
  categoryIndex: number;
  isVisible: boolean;
}) {
  return (
    <div
      className={`transition-all duration-700 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
      style={{ transitionDelay: `${categoryIndex * 150}ms` }}
    >
      <div className={`flex items-center gap-3 mb-2 ${categoryIndex === 0 ? "pt-0" : "pt-6"}`}>
        <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
          {String(categoryIndex + 1).padStart(2, "0")}
        </span>
        <span className="text-sm font-medium text-orange-600 dark:text-orange-500">{category.category}</span>
        <span className="flex-1 h-px bg-foreground/10" />
      </div>
      {category.features.map((feature, featureIndex) => (
        <AnimatedRow
          key={feature.name}
          feature={feature}
          index={categoryIndex * 3 + featureIndex}
          isVisible={isVisible}
        />
      ))}
    </div>
  );
}

function ScoreComparison({ isVisible }: { isVisible: boolean }) {
  const [othersScore, setOthersScore] = useState(0);
  const [tubewatchScore, setTubewatchScore] = useState(0);

  useEffect(() => {
    if (!isVisible) return;
    const timer = setTimeout(() => {
      const othersInterval = setInterval(() => {
        setOthersScore((prev) => {
          if (prev >= 4) { clearInterval(othersInterval); return 4; }
          return prev + 1;
        });
      }, 150);
      const tubewatchInterval = setInterval(() => {
        setTubewatchScore((prev) => {
          if (prev >= 12) { clearInterval(tubewatchInterval); return 12; }
          return prev + 1;
        });
      }, 100);
      return () => {
        clearInterval(othersInterval);
        clearInterval(tubewatchInterval);
      };
    }, 800);
    return () => clearTimeout(timer);
  }, [isVisible]);

  return (
    <div
      className={`mt-8 p-6 rounded-2xl bg-foreground/[0.02] border border-foreground/10 transition-all duration-700 delay-500 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      <div className="grid grid-cols-2 gap-8">
        <div className="text-center">
          <div className="text-3xl lg:text-4xl font-heading mb-2">
            <span className="text-foreground/30">{othersScore}</span>
            <span className="text-foreground/20 text-xl">/12</span>
          </div>
          <div className="text-sm text-muted-foreground">기존 분석 도구</div>
          <div className="mt-3 h-2 bg-foreground/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-foreground/20 rounded-full transition-all duration-500"
              style={{ width: `${(othersScore / 12) * 100}%` }}
            />
          </div>
        </div>
        <div className="text-center">
          <div className="text-3xl lg:text-4xl font-heading mb-2">
            <span className="text-orange-600 dark:text-orange-500">{tubewatchScore}</span>
            <span className="text-orange-400 text-xl">/12</span>
          </div>
          <div className="text-sm font-medium">튜브워치</div>
          <div className="mt-3 h-2 bg-orange-500/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${(tubewatchScore / 12) * 100}%` }}
            />
          </div>
        </div>
      </div>
      <div
        className={`mt-6 text-center transition-all duration-500 delay-1000 ${
          tubewatchScore === 12 ? "opacity-100" : "opacity-0"
        }`}
      >
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-500 text-sm font-medium">
          <svg viewBox="0 0 24 24" className="w-4 h-4">
            <path
              d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
              fill="currentColor"
            />
          </svg>
          8가지 실행 중심 기능 차별화
        </span>
      </div>
    </div>
  );
}

function VsGraphic({ isVisible }: { isVisible: boolean }) {
  return (
    <div
      className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-700 delay-300 ${
        isVisible ? "opacity-100 scale-100" : "opacity-0 scale-50"
      }`}
    >
      <div className="relative w-16 h-16 lg:w-20 lg:h-20">
        <div className="absolute inset-0 bg-orange-500/20 rounded-full blur-xl" />
        <div className="relative w-full h-full rounded-full bg-background border-2 border-orange-500/30 flex items-center justify-center">
          <span className="text-lg lg:text-xl font-heading font-bold text-orange-600 dark:text-orange-500">VS</span>
        </div>
        <div className="absolute inset-0 animate-spin-slow">
          {[0, 90, 180, 270].map((angle) => (
            <div
              key={angle}
              className="absolute w-2 h-2 rounded-full bg-orange-500"
              style={{
                top: "50%",
                left: "50%",
                transform: `rotate(${angle}deg) translateY(-32px) translateX(-50%)`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function WhySection() {
  const { ref, visible } = useFadeIn();

  return (
    <section className="relative py-10 lg:py-20 overflow-hidden border-t border-foreground/10">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-0 w-96 h-96 bg-foreground/[0.02] rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl" />
      </div>

      <div ref={ref} className="relative z-10 max-w-[1080px] mx-auto px-8 lg:px-20">
        {/* Header */}
        <div className="text-center mb-12 lg:mb-16">
          <SectionLabel>Why Different</SectionLabel>
          <h2
            className={`font-heading text-4xl lg:text-5xl font-medium tracking-[-0.03em] leading-[1.1] mb-6 transition-all duration-700 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            다른 분석 도구와
            <br />
            <span className="text-orange-600 dark:text-orange-500">무엇이 다른가요?</span>
          </h2>
          <p
            className={`text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto transition-all duration-700 delay-100 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            숫자만 보여주는 도구는 많습니다
            <br className="lg:hidden" />
            <span className="hidden lg:inline"> — </span>
            튜브워치는 &ldquo;그래서 뭘 해야 하는지&rdquo;까지 알려드립니다
          </p>
        </div>

        {/* Comparison Table */}
        <div
          className={`relative bg-background rounded-3xl border border-foreground/10 overflow-hidden transition-all duration-700 delay-200 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {/* Table header */}
          <div className="grid grid-cols-[1fr_80px_80px] lg:grid-cols-[1fr_120px_120px] items-center px-6 py-4 bg-foreground/[0.02] border-b border-foreground/10">
            <div className="text-sm font-mono text-muted-foreground">기능 비교</div>
            <div className="text-center">
              <div className="text-xs font-mono text-muted-foreground mb-1">기존 도구</div>
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 rounded bg-foreground/10 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-3 h-3 text-foreground/30">
                    <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs font-mono text-orange-600 dark:text-orange-500 mb-1">튜브워치</div>
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 rounded bg-orange-500/10 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-3 h-3 text-orange-500">
                    <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" fill="none" />
                    <circle cx="12" cy="12" r="3" fill="currentColor" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* VS graphic (desktop only) */}
          <div className="hidden lg:block">
            <VsGraphic isVisible={visible} />
          </div>

          {/* Table body */}
          <div className="px-6 pb-6">
            {comparisonItems.map((category, index) => (
              <CategoryBlock
                key={category.category}
                category={category}
                categoryIndex={index}
                isVisible={visible}
              />
            ))}
          </div>
        </div>

        {/* Score comparison */}
        <ScoreComparison isVisible={visible} />

        {/* Bottom message */}
        <div
          className={`mt-12 text-center transition-all duration-700 delay-700 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <p className="text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-orange-500">
                <path
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              분석에서 끝나지 않고, 실행까지 설계하는 분석 도구
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}

// ─── 06. Pricing Preview ────────────────────────────────────────────────────

const plans = [
  {
    name: "Free",
    tier: "free" as const,
    price: "무료",
    note: "신용카드 없이 바로 시작",
    features: ["채널 1개", "기본 분석 횟수 제공", "Channel Analysis", "Channel DNA 핵심 항목", "Action Plan P1 항목", "Next Trend 1순위 주제"],
    cta: "무료로 시작하기",
    href: "/channels",
  },
  {
    name: "Creator",
    tier: "creator" as const,
    price: "월 구독",
    note: "성장을 원하는 크리에이터",
    features: ["채널 복수 등록", "월 정기 분석 제공", "Channel Analysis 전체", "Channel DNA 전체", "Action Plan 전체", "Next Trend 전체 + 실행 힌트"],
    cta: "성장 시작하기",
    href: "/billing",
  },
  {
    name: "Pro",
    tier: "pro" as const,
    price: "월 구독",
    note: "진지하게 성장을 원하는 분",
    features: ["채널 더 많이 등록 가능", "월 분석 횟수 대폭 확대", "모든 기능 이용 가능", "원페이퍼 리포트 제공", "성장 전략 실행 플랜", "우선 지원"],
    cta: "Pro로 시작하기",
    href: "/billing",
  },
];

function PlanIcon({ tier }: { tier: "free" | "creator" | "pro" }) {
  if (tier === "free") return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  if (tier === "creator") return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlanCard({ plan, index, visible }: { plan: typeof plans[0]; index: number; visible: boolean }) {
  const isPro = plan.tier === "pro";
  const isFree = plan.tier === "free";

  return (
    <div
      className={`flex flex-col transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${isPro ? "bg-foreground text-background" : "bg-background"}`}
      style={{ transitionDelay: `${150 + index * 100}ms` }}
    >
      <div className={`p-6 lg:p-8 flex-1 flex flex-col`}>
        {/* Plan header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isPro ? "bg-orange-500 text-white" : isFree ? "bg-foreground/5 text-foreground/50" : "bg-foreground/5 text-foreground/70"}`}>
              <PlanIcon tier={plan.tier} />
            </div>
            {isPro && (
              <span className="font-mono text-[10px] tracking-[0.1em] uppercase bg-orange-500 text-white px-2 py-0.5 rounded">추천</span>
            )}
          </div>
          <p className={`font-mono text-xs tracking-[0.1em] uppercase mb-2 ${isPro ? "opacity-50" : "text-muted-foreground"}`}>{plan.name}</p>
          <p className="font-heading text-3xl font-medium tracking-[-0.03em]">{plan.price}</p>
          <p className={`mt-1 text-xs ${isPro ? "opacity-50" : "text-muted-foreground"}`}>{plan.note}</p>
        </div>

        {/* Divider */}
        <div className={`h-px mb-6 ${isPro ? "bg-background/10" : "bg-foreground/8"}`} />

        {/* Features */}
        <ul className="space-y-2.5 flex-1 mb-8">
          {plan.features.map((f) => (
            <li key={f} className={`flex items-start gap-2 text-sm ${isPro ? "opacity-80" : "text-muted-foreground"}`}>
              <Check className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${isPro ? "text-orange-400" : isFree ? "text-foreground/30" : "text-emerald-500"}`} />
              {f}
            </li>
          ))}
        </ul>

        {/* CTA */}
        <a
          href={plan.href}
          className={`block w-full text-center py-2.5 text-sm font-medium rounded-lg transition-colors ${
            isPro
              ? "bg-orange-500 text-white hover:bg-orange-600"
              : isFree
              ? "border border-foreground/15 hover:bg-foreground/[0.04]"
              : "bg-foreground/5 hover:bg-foreground/10"
          }`}
        >
          {plan.cta}
        </a>
      </div>
    </div>
  );
}

// ─── 07. Final CTA ──────────────────────────────────────────────────────────

function FinalCtaSection() {
  const { ref, visible } = useFadeIn(0.2);

  const chips = ["채널 분석", "액션 플랜", "채널 DNA", "넥스트 트렌드"];

  return (
    <section className="relative py-10 lg:py-20 border-t border-foreground/10 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-1/3 w-[600px] h-[300px] bg-orange-500/[0.05] rounded-full blur-3xl" />
        <div className="absolute top-0 right-0 w-[400px] h-[200px] bg-foreground/[0.02] rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-[1080px] mx-auto px-8 lg:px-20">
        <div
          ref={ref}
          className={`relative border border-foreground/15 rounded-2xl px-8 lg:px-14 py-10 lg:py-16 transition-all duration-700 bg-foreground/[0.01] ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          {/* Corner decorations */}
          <div className="absolute top-0 right-0 w-24 h-24 border-b border-l border-foreground/10 rounded-tr-2xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 border-t border-r border-foreground/10 rounded-bl-2xl" />

          <div className="relative z-10">
            {/* Chips */}
            <div
              className={`flex flex-wrap gap-2 mb-8 transition-all duration-700 delay-100 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            >
              {chips.map((chip, i) => (
                <span
                  key={chip}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-foreground/10 text-xs font-mono text-muted-foreground bg-background"
                  style={{ transitionDelay: `${i * 60}ms` }}
                >
                  <span className="w-1 h-1 rounded-full bg-orange-500" />
                  {chip}
                </span>
              ))}
            </div>

            <p className="font-mono text-xs tracking-[0.15em] uppercase text-muted-foreground mb-4">Get Started</p>
            <h2
              className={`font-heading text-4xl lg:text-6xl font-medium tracking-[-0.03em] leading-[1.1] mb-6 break-keep transition-all duration-700 delay-200 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            >
              지금 채널을 등록하면<br />
              5분 안에 첫 성장 인사이트를<br />
              <span className="text-orange-600 dark:text-orange-500">확인할 수 있습니다.</span>
            </h2>

            <div
              className={`flex flex-col sm:flex-row items-start gap-4 mt-8 transition-all duration-700 delay-300 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            >
              <Button size="lg" className="bg-foreground hover:bg-foreground/90 text-background px-8 h-12 text-base rounded-xl shadow-lg" asChild>
                <a href="/channels">내 채널 무료 분석하기</a>
              </Button>
            </div>

            <p
              className={`mt-8 font-mono text-xs text-muted-foreground/40 transition-all duration-700 delay-400 ${visible ? "opacity-100" : "opacity-0"}`}
            >
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
      <FinalCtaSection />
      <FooterSection />
    </main>
  );
}
