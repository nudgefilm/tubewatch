"use client";

import { useEffect, useState, useRef } from "react";
import { BarChart3, Brain, Target, Rocket } from "lucide-react";

const whyFeatures = [
  {
    icon: BarChart3,
    number: "01",
    title: "Data-driven channel analysis",
    subtitle: "단순 통계가 아닌 채널 구조 분석",
    description: "튜브 워치는 단순 조회수나 구독자 변화만 보여주는 도구가 아닙니다. 최근 업로드 영상과 채널 활동 데이터를 기반으로 31개의 분석 신호를 종합해 채널의 성장 구조를 분석합니다.",
    stats: ["최근 영상 20개 데이터 분석", "31개 성장 신호 평가", "5개 성장 지표 점수화"],
    highlight: "채널의 현재 상태를 데이터 기반으로 진단합니다.",
  },
  {
    icon: Brain,
    number: "02",
    title: "AI-powered strategy insights",
    subtitle: "채널 전략을 해석합니다",
    description: "튜브 워치는 데이터 분석 결과를 기반으로 채널의 전략을 해석하고 인사이트를 제공합니다.",
    stats: ["어떤 콘텐츠 주제가 가장 반응이 좋은가", "검색 유입을 늘리려면 무엇을 바꿔야 하는가", "어떤 콘텐츠 전략이 구독자 성장에 유리한가"],
    highlight: "데이터를 실제 전략으로 번역합니다.",
  },
  {
    icon: Target,
    number: "03",
    title: "Creator-focused metrics",
    subtitle: "크리에이터 관점의 성장 지표",
    description: "튜브 워치는 기존의 광고나 마케팅 지표 중심의 분석 도구가 아닙니다. 유튜브 크리에이터 성장 지표를 정조준합니다.",
    stats: ["콘텐츠 주제 일관성", "시청자 반응 구조", "채널 활동 패턴", "SEO 최적화 상태", "성장 모멘텀"],
    highlight: "채널이 왜 성장하거나 정체되는지를 보여줍니다.",
  },
  {
    icon: Rocket,
    number: "04",
    title: "Actionable growth recommendations",
    subtitle: "바로 실행할 수 있는 개선 전략",
    description: "튜브 워치의 분석 결과는 단순한 평가 리포트가 아닙니다.",
    stats: ["제목 구조 개선", "콘텐츠 주제 전략", "업로드 패턴", "검색 키워드 활용"],
    highlight: "분석 → 인사이트 → 실행 전략을 포함하는 구조입니다.",
  },
];

export function SecuritySection() {
  const [isVisible, setIsVisible] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
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

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % whyFeatures.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section id="why" ref={sectionRef} className="relative py-16 lg:py-24 bg-foreground/[0.02] overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Header */}
        <div
          className={`mb-10 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-6">
            <span className="w-8 h-px bg-foreground/30" />
            차별점
          </span>
          <h2 className="text-4xl lg:text-6xl font-display tracking-tight">
            Why TubeWatch™ ?
          </h2>
        </div>

        {/* Features Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {whyFeatures.map((feature, index) => (
            <div
              key={feature.title}
              className={`relative p-8 border rounded-2xl transition-all duration-300 cursor-pointer h-[320px] overflow-hidden hover:shadow-sm ${
                activeFeature === index
                  ? "border-orange-500/50 bg-orange-500/5"
                  : "border-foreground/10 hover:border-foreground/20"
              } ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
              style={{ transitionDelay: `${index * 100}ms` }}
              onClick={() => setActiveFeature(index)}
            >
              {/* Number badge */}
              <div className="absolute -top-3 -left-3 w-10 h-10 bg-background border border-foreground/10 rounded-full flex items-center justify-center">
                <span className="text-sm font-mono text-muted-foreground">{feature.number}</span>
              </div>

              <div className="flex items-start gap-4 mb-4">
                <div className={`shrink-0 w-12 h-12 flex items-center justify-center rounded-xl transition-colors duration-300 ${
                  activeFeature === index ? "bg-orange-500 text-white" : "bg-foreground/5"
                }`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-1">{feature.title}</h3>
                  <p className="text-sm text-orange-500 font-medium">{feature.subtitle}</p>
                </div>
              </div>

              <p className="text-muted-foreground mb-4 leading-relaxed">
                {feature.description}
              </p>

              {/* Stats/Features */}
              <div className={`transition-opacity duration-300 ${
                activeFeature === index ? "opacity-100" : "opacity-0 invisible"
              }`}>
                <div className="flex flex-wrap gap-2 mb-4">
                  {feature.stats.map((stat) => (
                    <span
                      key={stat}
                      className="px-3 py-1.5 text-xs font-mono bg-foreground/5 rounded-full text-muted-foreground"
                    >
                      {stat}
                    </span>
                  ))}
                </div>
                <p className="text-sm font-medium text-foreground border-l-2 border-orange-500 pl-3">
                  {feature.highlight}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
