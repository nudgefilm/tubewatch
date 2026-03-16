"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { AnimatedSphere } from "./animated-sphere";

const words = [
  { line1: "떡상의 신호", line2: "튜브 워치가 가장 빨리 읽습니다." },
  { line1: "알고리즘 분석", line2: "채널의 다음 행동을 설계합니다." },
  { line1: "성공한 채널의 DNA", line2: "해독하거나 놓치거나" },
  { line1: "100만 구독자로 가는", line2: "가장 정밀한 네비게이션" },
];

export function HeroSection() {
  const [isVisible, setIsVisible] = useState(false);
  const [wordIndex, setWordIndex] = useState(0);

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
            <Button 
              size="lg" 
              asChild
              className="bg-foreground hover:bg-foreground/90 text-background px-8 h-14 text-base rounded-full group"
            >
              <Link href="/login">
                내 채널 분석
                <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              asChild
              className="h-14 px-8 text-base rounded-full border-foreground/20 hover:bg-foreground/5"
            >
              <Link href="/login">튜브워치 작동 방식</Link>
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
      
    </section>
  );
}
