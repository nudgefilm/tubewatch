"use client";

import { useEffect, useState } from "react";
import { Button } from "@/v0-final/components/ui/button";
import { ArrowRight, Youtube, BarChart3, Lightbulb, Zap, CheckCircle2 } from "lucide-react";
import { AnimatedSphere } from "./animated-sphere";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/v0-final/components/ui/dialog";
import { ScrollArea } from "@/v0-final/components/ui/scroll-area";

const words = [
  { line1: "떡상의 신호", line2: "튜브 워치가 가장 빨리 읽습니다." },
  { line1: "알고리즘 분석", line2: "채널의 다음 행동을 설계합니다." },
  { line1: "성공한 채널의 DNA", line2: "해독하거나 놓치거나" },
  { line1: "100만 구독자로 가는", line2: "가장 정밀한 네비게이션" },
];

export function HeroSection() {
  const [isVisible, setIsVisible] = useState(false);
  const [wordIndex, setWordIndex] = useState(0);
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % words.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden">
      {/* Animated sphere background */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[600px] h-[600px] lg:w-[800px] lg:h-[800px] opacity-40 pointer-events-none">
        <AnimatedSphere />
      </div>
      
      {/* Subtle grid lines */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        {[...Array(8)].map((_, i) => (
          <div
            key={`h-${i}`}
            className="absolute h-px bg-foreground/10"
            style={{
              top: `${12.5 * (i + 1)}%`,
              left: 0,
              right: 0,
            }}
          />
        ))}
        {[...Array(12)].map((_, i) => (
          <div
            key={`v-${i}`}
            className="absolute w-px bg-foreground/10"
            style={{
              left: `${8.33 * (i + 1)}%`,
              top: 0,
              bottom: 0,
            }}
          />
        ))}
      </div>
      
      <div className="relative z-10 w-full max-w-[1400px] px-6 lg:px-12 xl:px-24 py-32 lg:py-40">
        {/* Eyebrow */}
        <div 
          className={`mb-8 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <span className="inline-flex items-center gap-3 text-base font-bold text-orange-500">
            <span className="w-8 h-px bg-orange-500" />
            데이터로 설계하는 유튜브 성장 전략 플랫폼 | 튜브 워치
          </span>
        </div>
        
        {/* Main headline */}
        <div className="mb-12">
          <h1 
            className={`font-display leading-[1.2] transition-all duration-1000 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <span 
              key={wordIndex}
              className="block"
            >
              <span className="block text-[clamp(1.4rem,5.6vw,3.5rem)]">
                {words[wordIndex].line1.split(" ").map((word, wordIdx, arr) => (
                  <span
                    key={`line1-word-${wordIndex}-${wordIdx}`}
                    className="inline-block animate-char-in"
                    style={{
                      animationDelay: `${wordIdx * 100}ms`,
                    }}
                  >
                    {word}{wordIdx < arr.length - 1 ? "\u00A0" : ""}
                  </span>
                ))}
              </span>
              <span className="block text-[clamp(1.4rem,5.6vw,3.5rem)] text-muted-foreground">
                {words[wordIndex].line2.split(" ").map((word, wordIdx, arr) => (
                  <span
                    key={`line2-word-${wordIndex}-${wordIdx}`}
                    className="inline-block animate-char-in"
                    style={{
                      animationDelay: `${(words[wordIndex].line1.split(" ").length + wordIdx) * 100}ms`,
                    }}
                  >
                    {word}{wordIdx < arr.length - 1 ? "\u00A0" : ""}
                  </span>
                ))}
              </span>
            </span>
          </h1>
        </div>
        
        {/* Description */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-end">
          <p 
            className={`text-base lg:text-lg text-muted-foreground leading-relaxed transition-all duration-700 delay-200 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            채널 데이터를 기반으로 당신의 성장 전략을 찾아갑니다.
          </p>
          
          {/* CTAs */}
          <div 
            className={`flex flex-col sm:flex-row items-start gap-4 transition-all duration-700 delay-300 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <a href="/channels">
              <Button 
                size="lg" 
                className="bg-foreground hover:bg-foreground/90 text-background px-8 h-14 text-base rounded-full group cursor-pointer"
              >
                내 채널 분석
                <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
              </Button>
            </a>
            <Button 
              size="lg" 
              variant="outline" 
              className="h-14 px-8 text-base rounded-full border-foreground/20 hover:bg-foreground/5 cursor-pointer"
              onClick={() => setHowItWorksOpen(true)}
            >
              튜브워치 작동 방식
            </Button>
          </div>
        </div>
        
      </div>
      
      {/* Stats marquee - full width outside container */}
      <div 
        className={`absolute bottom-24 left-0 right-0 transition-all duration-700 delay-500 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="flex gap-16 marquee whitespace-nowrap">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex gap-16">
              {[
                { value: "20", label: "분석 영상" },
                { value: "31", label: "데이터 시그널" },
                { value: "5", label: "성장 지표" },
                { value: "AI", label: "전략 인사이트" },
                { value: "3", label: "무료 채널 슬롯" },
                { value: "1", label: "채널별 무료 진단" },
              ].map((stat, idx) => (
                <div key={`${stat.label}-${i}-${idx}`} className="flex items-baseline gap-4">
                  <span className="text-4xl lg:text-5xl font-display">{stat.value}</span>
                  <span className="text-sm text-muted-foreground">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      
      {/* Scroll indicator */}

      {/* How It Works Dialog */}
      <Dialog open={howItWorksOpen} onOpenChange={setHowItWorksOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-4 border-b border-border/50">
            <DialogTitle className="text-2xl font-display">TubeWatch는 어떻게 채널을 분석할까요?</DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              유튜브 채널 데이터를 기반으로 성장 전략을 찾는 데이터 분석 플랫폼입니다.
            </p>
          </DialogHeader>
          <ScrollArea className="h-[65vh]">
            <div className="p-6 space-y-8">
              {/* Step 1 */}
              <div className="relative">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
                    <Youtube className="w-6 h-6 text-orange-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-mono text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded">STEP 1</span>
                      <h3 className="font-semibold text-lg">채널 등록</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      사용자는 자신의 YouTube 채널을 등록합니다. TubeWatch는 YouTube 공식 API를 통해 채널 데이터를 수집합니다.
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {["채널 정보", "최근 업로드 영상", "조회수", "댓글", "업로드 패턴", "영상 메타데이터"].map((item) => (
                        <div key={item} className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                          <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="absolute left-6 top-14 bottom-0 w-px bg-gradient-to-b from-orange-500/30 to-transparent h-full" />
              </div>

              {/* Step 2 */}
              <div className="relative">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-mono text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded">STEP 2</span>
                      <h3 className="font-semibold text-lg">데이터 분석</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      수집된 데이터를 기반으로 TubeWatch 분석 엔진이 채널을 진단합니다. 각 항목은 데이터 기반 점수와 인사이트로 분석됩니다.
                    </p>
                    <div className="space-y-2">
                      {[
                        { label: "채널 활동 패턴", value: 85 },
                        { label: "시청자 반응", value: 72 },
                        { label: "콘텐츠 구조", value: 68 },
                        { label: "SEO 최적화", value: 45 },
                        { label: "성장 모멘텀", value: 78 },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground w-24 flex-shrink-0">{item.label}</span>
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-1000"
                              style={{ width: `${item.value}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono text-muted-foreground w-8">{item.value}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="absolute left-6 top-14 bottom-0 w-px bg-gradient-to-b from-blue-500/30 to-transparent h-full" />
              </div>

              {/* Step 3 */}
              <div className="relative">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                    <Lightbulb className="w-6 h-6 text-purple-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-mono text-purple-500 bg-purple-500/10 px-2 py-0.5 rounded">STEP 3</span>
                      <h3 className="font-semibold text-lg">전략 인사이트 생성</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      분석된 데이터를 기반으로 AI가 채널의 성장 전략을 도출합니다.
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { icon: "01", title: "콘텐츠 방향", desc: "시청자가 원하는 콘텐츠 유형 분석" },
                        { icon: "02", title: "업로드 전략", desc: "최적의 업로드 시간대 및 빈도" },
                        { icon: "03", title: "SEO 개선 포인트", desc: "검색 최적화를 위한 키워드 제안" },
                        { icon: "04", title: "성장 시나리오", desc: "데이터 기반 성장 예측 모델" },
                      ].map((item) => (
                        <div key={item.title} className="bg-muted/30 rounded-xl p-3 border border-border/50">
                          <span className="text-xs font-mono text-purple-500">{item.icon}</span>
                          <p className="font-medium text-sm mt-1">{item.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="absolute left-6 top-14 bottom-0 w-px bg-gradient-to-b from-purple-500/30 to-transparent h-full" />
              </div>

              {/* Step 4 */}
              <div className="relative">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-mono text-green-500 bg-green-500/10 px-2 py-0.5 rounded">STEP 4</span>
                      <h3 className="font-semibold text-lg">실행 가능한 액션 제공</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      TubeWatch는 분석 결과를 기반으로 실행 가능한 전략을 제공합니다.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {["채널 진단", "Action Plan", "SEO Lab", "Benchmark", "Next Trend"].map((feature) => (
                        <span 
                          key={feature}
                          className="inline-flex items-center gap-1.5 text-sm font-medium bg-foreground text-background px-4 py-2 rounded-full"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer CTA */}
              <div className="pt-4 border-t border-border/50">
                <p className="text-center text-sm text-muted-foreground mb-4">
                  TubeWatch는 데이터를 기반으로 유튜브 채널 성장 전략을 설계합니다.
                </p>
                <div className="flex justify-center">
                  <a href="/channels">
                    <Button 
                      className="bg-foreground hover:bg-foreground/90 text-background rounded-full px-8 cursor-pointer"
                      onClick={() => setHowItWorksOpen(false)}
                    >
                      내 채널 분석 시작하기
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
      
    </section>
  );
}
