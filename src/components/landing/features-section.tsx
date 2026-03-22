"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const features = [
  {
    number: "01",
    title: "Channel Analysis",
    description: "채널 데이터를 기반으로\n현재 성장 상태를 정밀 진단합니다.",
    visual: "deploy",
  },
  {
    number: "02",
    title: "Action Plan",
    description: "지금 실행해야 할\n콘텐츠 전략을 제안합니다.",
    visual: "ai",
  },
  {
    number: "03",
    title: "SEO Lab",
    description: "검색 노출을 높이는\n제목·설명·태그 전략을 분석합니다.",
    visual: "collab",
  },
  {
    number: "04",
    title: "Benchmark",
    description: "유사 채널과 비교해\n성장 포인트를 발견합니다.",
    visual: "security",
  },
];

const staticAiNodePositions = [
  { x: 150, y: 80 },
  { x: 125, y: 123 },
  { x: 75, y: 123 },
  { x: 50, y: 80 },
  { x: 75, y: 37 },
  { x: 125, y: 37 },
];

/** SSR·청크 로드 전: SMIL 없이 동일 프레임 구도만 유지 */
function StaticDeployVisual() {
  return (
    <svg viewBox="0 0 200 160" className="w-full h-full">
      <defs>
        <clipPath id="deployClipStatic">
          <rect x="30" y="20" width="140" height="120" rx="4" />
        </clipPath>
      </defs>
      <rect x="30" y="20" width="140" height="120" rx="4" fill="none" stroke="currentColor" strokeWidth="2" />
      <g clipPath="url(#deployClipStatic)">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <rect
            key={i}
            x="40"
            y={35 + i * 16}
            width="70"
            height="10"
            rx="2"
            fill="currentColor"
            opacity="0.5"
          />
        ))}
      </g>
      <circle cx="100" cy="155" r="3" fill="currentColor" opacity="0.65" />
    </svg>
  );
}

function StaticAIVisual() {
  return (
    <svg viewBox="0 0 200 160" className="w-full h-full">
      <circle cx="100" cy="80" r="13" fill="currentColor" />
      {staticAiNodePositions.map((pos, i) => (
        <g key={i}>
          <circle cx={pos.x} cy={pos.y} r="7" fill="none" stroke="currentColor" strokeWidth="2" />
        </g>
      ))}
      <circle cx="100" cy="80" r="40" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.25" />
    </svg>
  );
}

function StaticCollabVisual() {
  return (
    <svg viewBox="0 0 200 160" className="w-full h-full">
      <g>
        <rect x="30" y="50" width="50" height="60" rx="4" fill="none" stroke="currentColor" strokeWidth="2" />
        <text x="55" y="85" textAnchor="middle" fontSize="20" fontFamily="monospace" fill="currentColor">
          A
        </text>
        <circle cx="55" cy="35" r="12" fill="none" stroke="currentColor" strokeWidth="2" />
      </g>
      <g>
        <rect x="120" y="50" width="50" height="60" rx="4" fill="none" stroke="currentColor" strokeWidth="2" />
        <text x="145" y="85" textAnchor="middle" fontSize="20" fontFamily="monospace" fill="currentColor">
          B
        </text>
        <circle cx="145" cy="35" r="12" fill="none" stroke="currentColor" strokeWidth="2" />
      </g>
      <rect
        x="80"
        y="79"
        width="40"
        height="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="4 4"
      />
      <circle cx="100" cy="80" r="4" fill="currentColor" />
      <g transform="translate(100, 130)">
        <circle r="8" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.65" />
      </g>
    </svg>
  );
}

function StaticSecurityVisual() {
  return (
    <svg viewBox="0 0 200 160" className="w-full h-full">
      <path
        d="M 100 20 L 150 40 L 150 90 Q 150 130 100 145 Q 50 130 50 90 L 50 40 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M 100 35 L 135 50 L 135 85 Q 135 115 100 128 Q 65 115 65 85 L 65 50 Z"
        fill="currentColor"
        opacity="0.15"
      />
      <rect x="85" y="70" width="30" height="25" rx="3" fill="currentColor" />
      <path
        d="M 90 70 L 90 60 Q 90 50 100 50 Q 110 50 110 60 L 110 70"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="100" cy="80" r="4" fill="white" />
      <rect x="98" y="82" width="4" height="8" fill="white" />
      <rect x="60" y="79.5" width="80" height="1" fill="currentColor" opacity="0.25" />
    </svg>
  );
}

function StaticFeatureVisual({ type }: { type: string }) {
  switch (type) {
    case "deploy":
      return <StaticDeployVisual />;
    case "ai":
      return <StaticAIVisual />;
    case "collab":
      return <StaticCollabVisual />;
    case "security":
      return <StaticSecurityVisual />;
    default:
      return <StaticDeployVisual />;
  }
}

const AnimatedDeployVisual = dynamic(
  () =>
    import("./feature-visuals-animated").then((m) => ({
      default: function AnimatedDeploy() {
        return <m.AnimatedFeatureVisual type="deploy" />;
      },
    })),
  { ssr: false, loading: StaticDeployVisual }
);

const AnimatedAIVisual = dynamic(
  () =>
    import("./feature-visuals-animated").then((m) => ({
      default: function AnimatedAI() {
        return <m.AnimatedFeatureVisual type="ai" />;
      },
    })),
  { ssr: false, loading: StaticAIVisual }
);

const AnimatedCollabVisual = dynamic(
  () =>
    import("./feature-visuals-animated").then((m) => ({
      default: function AnimatedCollab() {
        return <m.AnimatedFeatureVisual type="collab" />;
      },
    })),
  { ssr: false, loading: StaticCollabVisual }
);

const AnimatedSecurityVisual = dynamic(
  () =>
    import("./feature-visuals-animated").then((m) => ({
      default: function AnimatedSecurity() {
        return <m.AnimatedFeatureVisual type="security" />;
      },
    })),
  { ssr: false, loading: StaticSecurityVisual }
);

function ClientFeatureVisualLoader({ type }: { type: string }) {
  switch (type) {
    case "deploy":
      return <AnimatedDeployVisual />;
    case "ai":
      return <AnimatedAIVisual />;
    case "collab":
      return <AnimatedCollabVisual />;
    case "security":
      return <AnimatedSecurityVisual />;
    default:
      return <AnimatedDeployVisual />;
  }
}

function FeatureCard({ feature, index }: { feature: (typeof features)[0]; index: number }) {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.2 }
    );

    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  const featureHrefs = ["/analysis", "/action-plan", "/seo-lab", "/benchmark"];

  return (
    <a
      href={featureHrefs[index]}
      ref={cardRef}
      className={`group relative transition-all duration-700 block border border-foreground/10 rounded-2xl p-6 lg:p-8 hover:border-foreground/30 hover:bg-foreground/[0.02] cursor-pointer ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
      }`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div className="flex flex-col h-full">
        <div className="mb-4">
          <span className="font-mono text-sm text-muted-foreground">{feature.number}</span>
        </div>

        <div className="flex justify-center mb-6">
          <div className="w-32 h-28 text-foreground">
            <ClientFeatureVisualLoader type={feature.visual} />
          </div>
        </div>

        <div className="text-center">
          <h3 className="text-xl lg:text-2xl font-heading font-medium tracking-[-0.02em] mb-3 group-hover:translate-x-1 transition-transform duration-500">
            {feature.title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
            {feature.description}
          </p>
        </div>
      </div>
    </a>
  );
}

export function FeaturesSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

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
    <section id="features" ref={sectionRef} className="relative py-16 lg:py-24">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="mb-10 lg:mb-14">
          <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-6">
            <span className="w-8 h-px bg-foreground/30" />
            Feature Overview
          </span>
          <h2
            className={`text-4xl lg:text-6xl font-heading font-medium tracking-[-0.03em] transition-all duration-700 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            4개 핵심 기능 프리뷰
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <FeatureCard key={feature.number} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
