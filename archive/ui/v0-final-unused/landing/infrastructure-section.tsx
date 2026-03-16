"use client";

import { useEffect, useState, useRef } from "react";

const insightData = {
  score: 82,
  strength: {
    title: "콘텐츠 주제 일관성 우수",
    detail: "최근 20개 영상 중 17개 동일 카테고리 유지",
    stats: [
      { label: "평균 조회수", value: "28,400" },
      { label: "평균 시청 지속 시간", value: "4분 12초" },
      { label: "구독 전환률", value: "2.8%" },
    ],
  },
  opportunity: {
    title: "SEO 최적화 부족",
    detail: "검색 유입 비율이 경쟁 채널 대비 낮음",
    stats: [
      { label: "키워드 포함률", value: "35%" },
      { label: "검색 유입 비율", value: "14%" },
      { label: "경쟁 채널 평균", value: "31%" },
    ],
    keywords: ["유튜브 성장 전략", "채널 분석", "구독자 늘리는 방법"],
  },
  action: {
    title: "제목 구조 개선 권장",
    current: "유튜브 채널 성장 이야기",
    recommended: "유튜브 채널 성장 전략\n구독자 늘리는 5가지 방법",
    expectedGrowth: "+18% ~ +32%",
  },
};

export function InfrastructureSection() {
  const [isVisible, setIsVisible] = useState(false);
  const [activeCard, setActiveCard] = useState(0);
  const [scoreAnimated, setScoreAnimated] = useState(0);
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

  // Score animation
  useEffect(() => {
    if (isVisible) {
      const duration = 1500;
      const steps = 60;
      const increment = insightData.score / steps;
      let current = 0;
      const interval = setInterval(() => {
        current += increment;
        if (current >= insightData.score) {
          setScoreAnimated(insightData.score);
          clearInterval(interval);
        } else {
          setScoreAnimated(Math.floor(current));
        }
      }, duration / steps);
      return () => clearInterval(interval);
    }
  }, [isVisible]);

  // Card rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveCard((prev) => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const cards = [
    { type: "strength", color: "text-green-500", bgColor: "bg-green-500/10", borderColor: "border-green-500/20" },
    { type: "opportunity", color: "text-orange-500", bgColor: "bg-orange-500/10", borderColor: "border-orange-500/20" },
    { type: "action", color: "text-blue-500", bgColor: "bg-blue-500/10", borderColor: "border-blue-500/20" },
  ];

  return (
    <section ref={sectionRef} className="relative py-16 lg:py-24 overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Left: Content */}
          <div
            className={`transition-all duration-700 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
            }`}
          >
            <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-6">
              <span className="w-8 h-px bg-foreground/30" />
              Example Insight
            </span>
            <h2 className="text-4xl lg:text-6xl font-display tracking-tight mb-8">
              분석 결과
              <br />
              미리보기
            </h2>
            <p className="text-xl text-muted-foreground leading-relaxed mb-12">
              최근 영상 성과와 채널 활동 데이터를 기반으로
              성장 잠재력을 분석한 종합 점수입니다.
            </p>

            {/* Score Display */}
            <div className="flex items-baseline gap-2 mb-8">
              <div className="text-7xl lg:text-8xl font-display tabular-nums">
                {scoreAnimated}
              </div>
              <div className="text-2xl text-muted-foreground">/ 100</div>
            </div>
            <div className="text-lg font-medium mb-2">Channel Growth Score</div>
            <div className="text-muted-foreground">
              종합 성장 잠재력 점수
            </div>
          </div>

          {/* Right: Insight Cards */}
          <div
            className={`transition-all duration-700 delay-200 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
            }`}
          >
            <div className="border border-foreground/10 rounded-2xl p-4 space-y-4">
              {/* Strength Card */}
              <div 
                className={`border rounded-xl p-6 transition-colors duration-300 cursor-pointer h-[180px] overflow-hidden hover:shadow-sm ${
                  activeCard === 0 
                    ? `${cards[0].borderColor} ${cards[0].bgColor}` 
                    : "border-foreground/10 hover:border-foreground/20"
                }`}
                onClick={() => setActiveCard(0)}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className={`text-xs font-mono px-2 py-1 rounded ${cards[0].bgColor} ${cards[0].color}`}>
                    Strength
                  </span>
                  <span className="text-sm font-medium">{insightData.strength.title}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{insightData.strength.detail}</p>
                <div className={`grid grid-cols-3 gap-4 transition-opacity duration-300 ${activeCard === 0 ? "opacity-100" : "opacity-0 invisible"}`}>
                  {insightData.strength.stats.map((stat) => (
                    <div key={stat.label}>
                      <div className="text-lg font-display">{stat.value}</div>
                      <div className="text-xs text-muted-foreground">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Opportunity Card */}
              <div 
                className={`border rounded-xl p-6 transition-colors duration-300 cursor-pointer h-[210px] overflow-hidden ${
                  activeCard === 1 
                    ? `${cards[1].borderColor} ${cards[1].bgColor}` 
                    : "border-foreground/10 hover:border-foreground/20"
                }`}
                onClick={() => setActiveCard(1)}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className={`text-xs font-mono px-2 py-1 rounded ${cards[1].bgColor} ${cards[1].color}`}>
                    Opportunity
                  </span>
                  <span className="text-sm font-medium">{insightData.opportunity.title}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{insightData.opportunity.detail}</p>
                <div className={`transition-opacity duration-300 ${activeCard === 1 ? "opacity-100" : "opacity-0 invisible"}`}>
                  <div className="grid grid-cols-3 gap-4 mb-3">
                    {insightData.opportunity.stats.map((stat) => (
                      <div key={stat.label}>
                        <div className="text-lg font-display">{stat.value}</div>
                        <div className="text-xs text-muted-foreground">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {insightData.opportunity.keywords.map((keyword) => (
                      <span key={keyword} className="text-xs px-2 py-1 rounded-full bg-foreground/5 text-muted-foreground">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Card */}
              <div 
                className={`border rounded-xl p-6 transition-colors duration-300 cursor-pointer h-[220px] overflow-hidden ${
                  activeCard === 2 
                    ? `${cards[2].borderColor} ${cards[2].bgColor}` 
                    : "border-foreground/10 hover:border-foreground/20"
                }`}
                onClick={() => setActiveCard(2)}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className={`text-xs font-mono px-2 py-1 rounded ${cards[2].bgColor} ${cards[2].color}`}>
                    Action
                  </span>
                  <span className="text-sm font-medium">{insightData.action.title}</span>
                </div>
                <div className={`transition-opacity duration-300 ${activeCard === 2 ? "opacity-100" : "opacity-0 invisible"}`}>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div className="p-3 rounded-lg bg-foreground/5">
                      <div className="text-xs text-muted-foreground mb-1">현재 제목</div>
                      <div className="text-sm line-through text-muted-foreground">{insightData.action.current}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                      <div className="text-xs text-blue-500 mb-1">추천 제목</div>
                      <div className="text-sm whitespace-pre-line">{insightData.action.recommended}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                    <span className="text-sm text-muted-foreground">예상 조회수 증가</span>
                    <span className="text-lg font-display text-green-500">{insightData.action.expectedGrowth}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
