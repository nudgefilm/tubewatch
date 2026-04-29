"use client";

import { useEffect, useRef, useState } from "react";

const features = [
  {
    id: "analysis",
    title: "영상 50개 전수 분석",
    description: "조회수 · 유지율 · CTR 등 핵심 지표 진단",
    icon: "chart",
  },
  {
    id: "expert",
    title: "수석 전략가 맞춤형 코멘터리",
    description: "채널에 최적화된 전문가 진단 의견 제공",
    icon: "expert",
  },
  {
    id: "bottleneck",
    title: "병목 구간 정밀 탐지",
    description: "특허출원 기술 기반 Bottleneck 분석",
    icon: "target",
  },
  {
    id: "roadmap",
    title: "30일 콘텐츠 로드맵",
    description: "향후 30일 콘텐츠 실행 계획 제시",
    icon: "roadmap",
  },
  {
    id: "report",
    title: "전용 리포트 URL",
    description: "제안서 · 보고서에 바로 삽입 가능",
    icon: "link",
  },
  {
    id: "monthly",
    title: "월간 정기 발행",
    description: "3개월간 전략 리포트 정기 제공",
    icon: "calendar",
  },
];

function ChartIcon({ isActive }: { isActive: boolean }) {
  return (
    <svg viewBox="0 0 48 48" className="w-full h-full">
      {[0, 1, 2, 3].map((i) => (
        <rect
          key={i}
          x={8 + i * 10}
          y={isActive ? 40 - [20, 28, 16, 32][i] : 36}
          width="6"
          height={isActive ? [20, 28, 16, 32][i] : 4}
          rx="1"
          fill="currentColor"
          className="transition-all duration-500"
          style={{ opacity: isActive ? 0.8 : 0.3, transitionDelay: `${i * 80}ms` }}
        />
      ))}
      {isActive && (
        <polyline
          points="8,30 18,22 28,28 38,14"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0"
          strokeDasharray="50"
          strokeDashoffset="50"
        >
          <animate attributeName="opacity" values="0;0.6" dur="0.3s" begin="0.3s" fill="freeze" />
          <animate attributeName="stroke-dashoffset" values="50;0" dur="0.6s" begin="0.3s" fill="freeze" />
        </polyline>
      )}
    </svg>
  );
}

function ExpertIcon({ isActive }: { isActive: boolean }) {
  return (
    <svg viewBox="0 0 48 48" className="w-full h-full">
      <circle cx="24" cy="16" r="8" fill="none" stroke="currentColor" strokeWidth="2"
        className={`transition-all duration-500 ${isActive ? "opacity-100" : "opacity-40"}`} />
      <path d="M 10 42 Q 10 30 24 30 Q 38 30 38 42" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
        className={`transition-all duration-500 ${isActive ? "opacity-100" : "opacity-40"}`} />
      {isActive && (
        <g>
          <circle cx="36" cy="12" r="6" fill="currentColor" opacity="0">
            <animate attributeName="opacity" values="0;0.9" dur="0.3s" begin="0.2s" fill="freeze" />
          </circle>
          <path d="M 33 12 L 35 14 L 39 10" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0">
            <animate attributeName="opacity" values="0;1" dur="0.2s" begin="0.4s" fill="freeze" />
          </path>
        </g>
      )}
    </svg>
  );
}

function TargetIcon({ isActive }: { isActive: boolean }) {
  return (
    <svg viewBox="0 0 48 48" className="w-full h-full">
      <circle cx="24" cy="24" r="18" fill="none" stroke="currentColor" strokeWidth="2"
        className={`transition-all duration-500 ${isActive ? "opacity-100" : "opacity-30"}`} />
      <circle cx="24" cy="24" r="12" fill="none" stroke="currentColor" strokeWidth="2"
        className={`transition-all duration-500 ${isActive ? "opacity-80" : "opacity-25"}`} />
      <circle cx="24" cy="24" r="6" fill="none" stroke="currentColor" strokeWidth="2"
        className={`transition-all duration-500 ${isActive ? "opacity-60" : "opacity-20"}`} />
      {isActive && (
        <g>
          <circle cx="24" cy="24" r="3" fill="currentColor" opacity="0">
            <animate attributeName="opacity" values="0;1" dur="0.3s" begin="0.2s" fill="freeze" />
            <animate attributeName="r" values="0;3" dur="0.3s" begin="0.2s" fill="freeze" />
          </circle>
          <circle cx="24" cy="24" r="3" fill="none" stroke="currentColor" strokeWidth="2" opacity="0">
            <animate attributeName="opacity" values="0;0.5;0" dur="1s" begin="0.5s" repeatCount="indefinite" />
            <animate attributeName="r" values="3;10;3" dur="1s" begin="0.5s" repeatCount="indefinite" />
          </circle>
        </g>
      )}
    </svg>
  );
}

function RoadmapIcon({ isActive }: { isActive: boolean }) {
  return (
    <svg viewBox="0 0 48 48" className="w-full h-full">
      <path d="M 8 40 L 8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
        className={`transition-all duration-500 ${isActive ? "opacity-100" : "opacity-40"}`} />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <circle cx="8" cy={14 + i * 12} r="3" fill="currentColor"
            className={`transition-all duration-500 ${isActive ? "opacity-100" : "opacity-30"}`}
            style={{ transitionDelay: `${i * 100}ms` }} />
          <rect x="16" y={11 + i * 12} width={isActive ? [28, 22, 18][i] : 12} height="6" rx="1" fill="currentColor"
            className="transition-all duration-500"
            style={{ opacity: isActive ? 0.6 : 0.2, transitionDelay: `${i * 100 + 50}ms` }} />
        </g>
      ))}
      {isActive && (
        <path d="M 38 8 L 42 12 L 38 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0">
          <animate attributeName="opacity" values="0;0.7" dur="0.3s" begin="0.4s" fill="freeze" />
        </path>
      )}
    </svg>
  );
}

function LinkIcon({ isActive }: { isActive: boolean }) {
  return (
    <svg viewBox="0 0 48 48" className="w-full h-full">
      <rect x="6" y="10" width="26" height="32" rx="3" fill="none" stroke="currentColor" strokeWidth="2"
        className={`transition-all duration-500 ${isActive ? "opacity-100" : "opacity-40"}`} />
      <rect x="12" y="18" width="14" height="2" rx="1" fill="currentColor"
        className={`transition-opacity duration-500 ${isActive ? "opacity-50" : "opacity-20"}`} />
      <rect x="12" y="24" width="10" height="2" rx="1" fill="currentColor"
        className={`transition-opacity duration-500 ${isActive ? "opacity-50" : "opacity-20"}`} />
      {isActive && (
        <g>
          <path d="M 30 28 Q 36 28 36 22 Q 36 16 42 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0" strokeDasharray="30" strokeDashoffset="30">
            <animate attributeName="opacity" values="0;0.8" dur="0.2s" begin="0.2s" fill="freeze" />
            <animate attributeName="stroke-dashoffset" values="30;0" dur="0.4s" begin="0.2s" fill="freeze" />
          </path>
          <circle cx="42" cy="16" r="4" fill="currentColor" opacity="0">
            <animate attributeName="opacity" values="0;0.9" dur="0.2s" begin="0.5s" fill="freeze" />
          </circle>
        </g>
      )}
    </svg>
  );
}

function CalendarIcon({ isActive }: { isActive: boolean }) {
  return (
    <svg viewBox="0 0 48 48" className="w-full h-full">
      <rect x="6" y="10" width="36" height="32" rx="3" fill="none" stroke="currentColor" strokeWidth="2"
        className={`transition-all duration-500 ${isActive ? "opacity-100" : "opacity-40"}`} />
      <line x1="6" y1="20" x2="42" y2="20" stroke="currentColor" strokeWidth="2"
        className={`transition-all duration-500 ${isActive ? "opacity-100" : "opacity-40"}`} />
      <line x1="14" y1="6" x2="14" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
        className={`transition-all duration-500 ${isActive ? "opacity-100" : "opacity-40"}`} />
      <line x1="34" y1="6" x2="34" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
        className={`transition-all duration-500 ${isActive ? "opacity-100" : "opacity-40"}`} />
      {[0, 1, 2].map((row) =>
        [0, 1, 2].map((col) => (
          <rect key={`${row}-${col}`} x={12 + col * 10} y={26 + row * 8} width="6" height="4" rx="1" fill="currentColor"
            className="transition-all duration-300"
            style={{ opacity: isActive ? (row === 0 && col < 2 ? 0.7 : 0.3) : 0.15, transitionDelay: `${(row * 3 + col) * 50}ms` }} />
        ))
      )}
      {isActive && (
        <circle cx="17" cy="28" r="2" fill="currentColor" opacity="0">
          <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" />
        </circle>
      )}
    </svg>
  );
}

function FeatureIcon({ type, isActive }: { type: string; isActive: boolean }) {
  switch (type) {
    case "chart": return <ChartIcon isActive={isActive} />;
    case "expert": return <ExpertIcon isActive={isActive} />;
    case "target": return <TargetIcon isActive={isActive} />;
    case "roadmap": return <RoadmapIcon isActive={isActive} />;
    case "link": return <LinkIcon isActive={isActive} />;
    case "calendar": return <CalendarIcon isActive={isActive} />;
    default: return <ChartIcon isActive={isActive} />;
  }
}

function FeatureCard({
  feature, index, isHovered, onHover, onLeave,
}: {
  feature: (typeof features)[0];
  index: number;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.2 }
    );
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={cardRef}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className={`relative transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      <div className={`group relative overflow-hidden border rounded-xl p-5 lg:p-6 transition-all duration-300 h-full ${
        isHovered ? "border-foreground/30 bg-foreground/[0.03] scale-[1.02]" : "border-foreground/10 hover:border-foreground/20"
      }`}>
        <div className={`absolute top-0 left-0 right-0 h-0.5 bg-foreground transition-all duration-300 ${isHovered ? "opacity-100" : "opacity-0"}`} />
        <div className="flex items-start gap-4">
          <div className={`flex-shrink-0 w-12 h-12 text-foreground transition-all duration-300 ${isHovered ? "scale-110" : "scale-100"}`}>
            <FeatureIcon type={feature.icon} isActive={isHovered} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={`text-base lg:text-lg font-medium mb-1 transition-colors duration-300 ${isHovered ? "text-foreground" : "text-foreground/80"}`}>
              {feature.title}
            </h3>
            <p className={`text-sm leading-relaxed transition-colors duration-300 ${isHovered ? "text-muted-foreground" : "text-muted-foreground/70"}`}>
              {feature.description}
            </p>
          </div>
        </div>
        <div className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${isHovered ? "opacity-100" : "opacity-0"}`}
          style={{ background: "radial-gradient(circle at 30% 30%, rgba(0,0,0,0.02) 0%, transparent 60%)" }} />
      </div>
    </div>
  );
}

export function IncludesSection() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [autoIndex, setAutoIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (hoveredIndex !== null) return;
    const interval = setInterval(() => {
      setAutoIndex((prev) => (prev + 1) % features.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [hoveredIndex]);

  const activeIndex = hoveredIndex ?? autoIndex;

  return (
    <section id="includes" ref={sectionRef} className="relative overflow-hidden py-16 lg:py-24">
      <div className="pointer-events-none absolute inset-0 opacity-[0.015]">
        <div className="absolute inset-0" style={{
          backgroundImage: "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }} />
      </div>

      <div className="relative z-10 mx-auto max-w-[1100px] px-8 lg:px-16">
        <div className="mb-12 text-center lg:mb-16">
          <span className="mb-6 inline-flex items-center gap-3 font-mono text-sm text-muted-foreground">
            <span className="h-px w-8 bg-foreground/30" />
            What&apos;s Included
            <span className="h-px w-8 bg-foreground/30" />
          </span>
          <h2 className={`font-display text-4xl tracking-tight transition-all duration-700 lg:text-6xl ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            포함 내용
          </h2>
          <p className={`mx-auto mt-4 max-w-2xl text-lg text-muted-foreground transition-all duration-700 delay-100 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            3개월 동안 제공되는 전문가 진단 서비스
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {features.map((feature, index) => (
            <FeatureCard
              key={feature.id}
              feature={feature}
              index={index}
              isHovered={activeIndex === index}
              onHover={() => setHoveredIndex(index)}
              onLeave={() => setHoveredIndex(null)}
            />
          ))}
        </div>

        <div className="mt-8 flex justify-center gap-2 lg:hidden">
          {features.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setHoveredIndex(index)}
              className={`h-1.5 rounded-full transition-all duration-300 ${activeIndex === index ? "w-4 bg-foreground" : "w-1.5 bg-foreground/20"}`}
              aria-label={`Feature ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
