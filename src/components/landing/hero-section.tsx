"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { AnimatedSphere } from "./animated-sphere";
import { HowItWorksModal } from "./how-it-works-modal";

const words = [
  { line1: "떡상의 신호", line2: "튜브 워치가 가장 빨리 읽습니다." },
  { line1: "알고리즘 분석", line2: "채널의 다음 행동을 설계합니다." },
  { line1: "성공한 채널의 DNA", line2: "해독하거나 놓치거나" },
  { line1: "성장 채널로 가는", line2: "가장 정밀한 네비게이션" },
];

export function HeroSection() {
  const [isVisible, setIsVisible] = useState(false);
  const [wordIndex, setWordIndex] = useState(0);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);

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
      {/* Animated sphere background - 10% larger */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[660px] h-[660px] lg:w-[880px] lg:h-[880px] opacity-40 pointer-events-none">
        <AnimatedSphere />
      </div>

      <div className="relative z-10 w-full max-w-[1400px] px-6 lg:px-12 xl:px-24 py-24 lg:py-32">

        {/* Eyebrow */}
        <div 
          className={`mb-8 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <span className="inline-flex items-center gap-3 text-lg lg:text-xl font-medium text-foreground tracking-tight">
            유튜버를 위한 데이터 설계, 채널 성장 전략 플랫폼 | 튜브 워치
          </span>
        </div>
        
        {/* Main headline */}
        <div className="mb-12">
          <h1 
            className={`font-heading font-medium leading-[1.2] tracking-[-0.03em] transition-all duration-1000 ${
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
            className={`text-lg lg:text-xl text-foreground font-medium leading-relaxed tracking-tight transition-all duration-700 delay-200 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            당신의 <span className="text-orange-500 font-bold">데이터</span>는 이미 다음 전략을 말하고 있습니다. <span className="text-2xl lg:text-3xl font-black">!</span>
          </p>
          
          {/* CTAs — lucide SVG 제거로 SSR/클라이언트 마크업 일치 */}
          <div 
            className={`flex flex-col sm:flex-row items-start gap-4 transition-all duration-700 delay-300 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <Button 
              size="lg" 
              className="bg-black hover:bg-neutral-800 text-white px-6 h-12 text-base rounded-lg shadow-lg group cursor-pointer"
              asChild
            >
              <a href="/channels">
                내 채널 분석
                <span
                  className="ml-2 inline-block transition-transform group-hover:translate-x-1"
                  aria-hidden
                >
                  →
                </span>
              </a>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="bg-white hover:bg-gray-100 text-black border-0 h-12 px-6 text-base rounded-lg shadow-lg cursor-pointer"
              onClick={() => setIsHowItWorksOpen(true)}
            >
              튜브워치 작동 방식
            </Button>
          </div>
        </div>
        
      </div>
      
      {/* Stats marquee - full width outside container */}
      <div
        className={`absolute bottom-24 left-0 right-0 overflow-hidden transition-all duration-700 delay-500 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Left fade */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        {/* Right fade */}
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
        <div className="flex w-max marquee-quad">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex gap-16 pr-16">
              {[
                { value: "50", label: "분석 영상" },
                { value: "30", label: "데이터 시그널" },
                { value: "9", label: "성장 지표" },
                { value: "7", label: "채널 운영 패턴" },
                { value: "4", label: "분석 모듈" },
                { value: "100", label: "성장 점수 만점" },
                { value: "3", label: "채널 무료 진단" },
              ].map((stat, idx) => (
                <div key={`${stat.label}-${i}-${idx}`} className="flex items-baseline gap-4">
                  <span className={`text-4xl lg:text-5xl font-display${stat.label === "채널 무료 진단" ? " text-orange-500" : ""}`}>{stat.value}</span>
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
      
      {/* How It Works Modal */}
      <HowItWorksModal
        isOpen={isHowItWorksOpen}
        onClose={() => setIsHowItWorksOpen(false)}
      />
    </section>
  );
}
