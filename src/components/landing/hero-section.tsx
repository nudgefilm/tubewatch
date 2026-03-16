"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { AnimatedSphere } from "./animated-sphere";
import { HowItWorksModal } from "./how-it-works-modal";

const words = [
  { line1: "떡상의 신호", line2: "튜브 워치가 가장 빨리 읽습니다." },
  { line1: "알고리즘 분석", line2: "채널의 다음 행동을 설계합니다." },
  { line1: "성공한 채널의 DNA", line2: "해독하거나 놓치거나" },
  { line1: "100만 구독자로 가는", line2: "가장 정밀한 네비게이션" },
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
      
      <div className="relative z-10 w-full max-w-[1400px] px-6 lg:px-12 xl:px-24 py-24 lg:py-32">
        {/* Eyebrow */}
        <div 
          className={`mb-8 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <span className="inline-flex items-center gap-3 text-base font-bold text-black">
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
              <span className="block text-[clamp(1.4rem,5.6vw,3.5rem)] text-black font-semibold">
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
              <span className="block text-[clamp(1.4rem,5.6vw,3.5rem)] text-neutral-500">
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
            className={`text-lg lg:text-xl text-neutral-600 leading-relaxed transition-all duration-700 delay-200 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            당신의 <span className="font-bold text-orange-500">데이터</span>는 이미 다음 전략을 말하고 있습니다. <span className="text-2xl lg:text-3xl font-bold text-black inline-block align-bottom relative -top-0.5">!</span>
          </p>
          
          {/* CTAs */}
          <div 
            className={`flex flex-col sm:flex-row items-start gap-6 transition-all duration-700 delay-300 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <Button 
              size="lg" 
              className="bg-black hover:bg-neutral-900 hover:scale-105 text-white px-6 h-12 text-base rounded-lg shadow-lg group cursor-pointer transition-all duration-200"
              asChild
            >
              <Link href="/channels">
                내 채널 분석
                <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="bg-white hover:bg-neutral-100 hover:scale-105 hover:shadow-xl text-black border border-neutral-200 h-12 px-6 text-base rounded-lg shadow-lg cursor-pointer transition-all duration-200"
              onClick={() => setIsHowItWorksOpen(true)}
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
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
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
      
      {/* How It Works Modal */}
      <HowItWorksModal
        isOpen={isHowItWorksOpen}
        onClose={() => setIsHowItWorksOpen(false)}
      />
    </section>
  );
}

