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
    <span className="inline-flex items-center text-sm font-mono text-muted-foreground mb-6">
      {children}
    </span>
  );
}

// ─── 01. Hero ───────────────────────────────────────────────────────────────

function HeroSection() {
  const [visible, setVisible] = useState(false);
  const [iframeSrc, setIframeSrc] = useState("https://www.youtube.com/embed/NSXkMdEBSwo?rel=0");
  useEffect(() => {
    setVisible(true);
    setIframeSrc(`https://www.youtube.com/embed/NSXkMdEBSwo?rel=0&enablejsapi=1&origin=${window.location.origin}`);
  }, []);

  return (
    <section className="relative flex flex-col justify-center py-12 lg:py-16 overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: "radial-gradient(circle, hsl(var(--foreground)/0.04) 1px, transparent 1px)", backgroundSize: "32px 32px" }}
      />

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">

          {/* Left: 텍스트 + 배너 + 스탯 */}
          <div className="flex-1 min-w-0">
            <div className={`transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
              <SectionLabel>TubeWatch™ Platform Introduction</SectionLabel>
            </div>

            <h1 className={`font-heading font-medium leading-[1.15] tracking-[-0.03em] transition-all duration-1000 delay-100 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
              <span className="block text-[clamp(1.6rem,4vw,3.2rem)]">
                당신의 데이터는 이미<br />다음 전략을 말하고 있습니다.
              </span>
              <span className="block text-[clamp(1rem,2.4vw,1.9rem)] text-muted-foreground mt-2">
                유튜브 스튜디오가 보여주지 않는 1% 시그널,<br />튜브워치가 설계합니다.
              </span>
            </h1>

            <div className={`mt-6 transition-all duration-700 delay-300 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
              <a
                href="https://forms.gle/cGMyEXQL1SDevpv7A"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-foreground text-background px-6 py-3 rounded-xl font-medium text-sm hover:bg-foreground/90 transition-colors"
              >
                베타 테스터 신청하기
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            {/* Stats row */}
            <div className={`mt-7 flex flex-wrap gap-x-8 gap-y-4 border-t border-foreground/10 pt-6 transition-all duration-700 delay-500 ${visible ? "opacity-100" : "opacity-0"}`}>
              {[
                { value: "4개", label: "핵심 분석 모듈" },
                { value: "50개+", label: "영상 심층 분석" },
                { value: "80개+", label: "데이터 시그널 기반" },
                { value: "무료", label: "로 시작 가능", highlight: true },
              ].map(({ value, label, highlight }) => (
                <div key={label}>
                  <p className={`font-heading text-2xl lg:text-3xl font-medium tracking-[-0.03em] ${highlight ? "text-foreground" : ""}`}>
                    {value}
                  </p>
                  <p className={`text-xs mt-0.5 ${highlight ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                    {highlight ? <span className="underline underline-offset-4">{label}</span> : label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: YouTube Shorts 영상 */}
          <div className={`shrink-0 self-end transition-all duration-700 delay-400 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
            <div className="relative w-[220px] lg:w-[255px] rounded-2xl overflow-hidden border border-foreground/10 shadow-xl">
              {/* 9:16 비율 컨테이너 */}
              <div className="relative" style={{ paddingBottom: "177.78%" }}>
                <iframe
                  src={iframeSrc}
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="TubeWatch 소개 영상"
                />
              </div>
            </div>
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
    <section className="relative py-6 lg:py-10 border-t border-foreground/10">
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
    <section id="features" className="relative py-6 lg:py-10 border-t border-foreground/10">
      <div className="max-w-[1080px] mx-auto px-8 lg:px-20">
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
    <section className="relative py-6 lg:py-10 border-t border-foreground/10">
      <div className="max-w-[1080px] mx-auto px-8 lg:px-20">
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
        <h3 className="font-heading text-xl font-medium tracking-[-0.02em]">{title}</h3>
        <p className="font-mono text-xs text-muted-foreground mt-0.5">{sub}</p>
        <p className="text-sm text-muted-foreground leading-relaxed mt-2">{desc}</p>
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
    <section className="relative py-6 lg:py-10 border-t border-foreground/10">
      <div className="max-w-[1080px] mx-auto px-8 lg:px-20">
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
    <section className="relative py-6 lg:py-10 border-t border-foreground/10">
      <div className="max-w-[1080px] mx-auto px-8 lg:px-20">
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
    <section className="relative py-6 lg:py-10 border-t border-foreground/10">
      <div className="max-w-[1080px] mx-auto px-8 lg:px-20">
        <div
          ref={ref}
          className={`relative border border-foreground px-8 lg:px-14 py-10 lg:py-16 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          {/* Corner decorations */}
          <div className="absolute top-0 right-0 w-24 h-24 border-b border-l border-foreground/10" />
          <div className="absolute bottom-0 left-0 w-24 h-24 border-t border-r border-foreground/10" />

          <div className="relative z-10">
            <p className="font-mono text-xs tracking-[0.15em] uppercase text-muted-foreground mb-6">Get Started</p>
            <h2 className="font-heading text-4xl lg:text-6xl font-medium tracking-[-0.03em] leading-[1.1] mb-6 break-keep">
              지금 채널을 등록하면<br />
              5분 안에 첫 성장 인사이트를<br />
              확인할 수 있습니다.
            </h2>
            <div className="flex flex-col sm:flex-row items-start gap-4 mt-8">
              <Button size="lg" className="bg-black hover:bg-neutral-800 text-white px-8 h-12 text-base rounded-lg shadow-lg" asChild>
                <a href="/channels">내 채널 분석하기</a>
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
