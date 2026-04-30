"use client";

import { useEffect, useRef, useState } from "react";

const TOTAL_SECONDS = 12 * 60 * 60;

function useCountdown() {
  const [timeLeft, setTimeLeft] = useState(TOTAL_SECONDS);

  useEffect(() => {
    const storedEndTime = sessionStorage.getItem("cr_timerEndTime");
    let endTime: number;

    if (storedEndTime) {
      endTime = parseInt(storedEndTime, 10);
    } else {
      endTime = Date.now() + TOTAL_SECONDS * 1000;
      sessionStorage.setItem("cr_timerEndTime", endTime.toString());
    }

    const updateTimer = () => {
      const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
      setTimeLeft(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  return {
    hours: Math.floor(timeLeft / 3600),
    minutes: Math.floor((timeLeft % 3600) / 60),
    seconds: timeLeft % 60,
    timeLeft,
  };
}

function TimerDigit({ value, label, isUrgent }: { value: number; label: string; isUrgent: boolean }) {
  const [isFlipping, setIsFlipping] = useState(false);
  const prevValue = useRef(value);

  useEffect(() => {
    if (prevValue.current !== value) {
      setIsFlipping(true);
      const timeout = setTimeout(() => setIsFlipping(false), 300);
      prevValue.current = value;
      return () => clearTimeout(timeout);
    }
  }, [value]);

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <div className={`relative overflow-hidden rounded-lg border transition-all duration-300 ${
          isUrgent ? "border-foreground/40 bg-foreground/[0.08]" : "border-foreground/20 bg-foreground/[0.03]"
        }`}>
          <div className={`px-3 py-2 font-mono text-3xl font-bold tabular-nums transition-all duration-300 lg:px-5 lg:py-3 lg:text-5xl ${
            isFlipping ? "scale-95 opacity-70" : "scale-100 opacity-100"
          } ${isUrgent ? "text-foreground" : "text-foreground/90"}`}>
            {value.toString().padStart(2, "0")}
          </div>
          <div className={`absolute inset-0 bg-foreground/5 transition-opacity duration-150 ${isFlipping ? "opacity-100" : "opacity-0"}`} />
        </div>
        {isUrgent && (
          <div className="absolute -inset-1 -z-10 animate-pulse rounded-xl bg-foreground/10 blur-md" />
        )}
      </div>
      <span className={`mt-2 font-mono text-xs uppercase tracking-wider transition-colors duration-300 ${
        isUrgent ? "text-foreground/70" : "text-muted-foreground"
      }`}>
        {label}
      </span>
    </div>
  );
}

function TimerSeparator({ isUrgent }: { isUrgent: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-1 lg:px-2">
      {[0, 1].map((i) => (
        <div key={i} className={`h-1.5 w-1.5 rounded-full transition-colors duration-300 lg:h-2 lg:w-2 ${
          isUrgent ? "animate-pulse bg-foreground" : "bg-foreground/40"
        }`} />
      ))}
    </div>
  );
}

function ClockIcon({ isUrgent }: { isUrgent: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-5 w-5 transition-colors duration-300 ${isUrgent ? "text-foreground" : "text-foreground/60"}`}
      fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12,6 12,12 16,14">
        {isUrgent && (
          <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="10s" repeatCount="indefinite" />
        )}
      </polyline>
    </svg>
  );
}

const TRUST_ITEMS = [
  {
    en: "Reliable Analysis", ko: "분석 신뢰성", icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-orange-500 lg:h-6 lg:w-6" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 3v18h18" /><path d="M18 9l-5 5-4-4-3 3" />
      </svg>
    ),
  },
  {
    en: "Actionable Roadmap", ko: "실행 가능한 로드맵", icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-orange-500 lg:h-6 lg:w-6" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 6h18" /><path d="M3 12h18" /><path d="M3 18h18" />
        <circle cx="6" cy="6" r="1" fill="currentColor" />
        <circle cx="12" cy="12" r="1" fill="currentColor" />
        <circle cx="18" cy="18" r="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    en: "Data Integrity", ko: "데이터 무결성", icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-orange-500 lg:h-6 lg:w-6" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
];

export function TimerCtaSection() {
  const { hours, minutes, seconds, timeLeft } = useCountdown();
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const isUrgent = timeLeft < 3600;

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.2 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="timer-cta" ref={sectionRef} className="relative overflow-hidden py-20 lg:py-32">
      {/* 배경 */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }} />
        <div className="absolute inset-0" style={{
          background: "radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0.02) 0%, transparent 70%)",
        }} />
      </div>

      <div className="relative z-10 mx-auto max-w-[1100px] px-8 lg:px-16">
        <div className="mx-auto max-w-4xl">

          {/* 타이머 뱃지 */}
          <div className={`mb-8 flex justify-center transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <span className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 transition-all duration-300 ${
              isUrgent ? "border-foreground/30 bg-foreground/[0.05]" : "border-foreground/15 bg-foreground/[0.02]"
            }`}>
              <ClockIcon isUrgent={isUrgent} />
              <span className={`font-mono text-sm transition-colors duration-300 ${isUrgent ? "text-foreground" : "text-muted-foreground"}`}>
                {isUrgent ? "마감 임박" : "파트너십 전용"}
              </span>
            </span>
          </div>

          {/* 헤딩 */}
          <h2 className={`mb-4 text-center tracking-tight transition-all duration-700 delay-100 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <span className="mb-2 block text-4xl font-bold lg:text-6xl xl:text-7xl">
              귀사의 전문성을
            </span>
            <span className="block text-2xl lg:text-4xl xl:text-5xl text-foreground/80">
              <span className="text-orange-500">데이터</span>로 증명할 준비가 되셨나요?
            </span>
          </h2>

          {/* 서브텍스트 */}
          <p className={`mx-auto mb-12 max-w-2xl text-center text-base leading-relaxed text-muted-foreground transition-all duration-700 delay-200 lg:text-lg ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            신청 접수 후 담당자 이메일로 결제 경로가 즉시 안내되며, 채널 분석과 진단, 전략 보고서 작성 후 최대 12시간 이내에 리포트가 전달될 예정입니다.
          </p>

          {/* 타이머 */}
          <div className={`mb-12 flex justify-center transition-all duration-700 delay-300 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <div className="relative flex items-center gap-1 py-8 lg:gap-2 lg:py-12">
              <TimerDigit value={hours} label="시간" isUrgent={isUrgent} />
              <TimerSeparator isUrgent={isUrgent} />
              <TimerDigit value={minutes} label="분" isUrgent={isUrgent} />
              <TimerSeparator isUrgent={isUrgent} />
              <TimerDigit value={seconds} label="초" isUrgent={isUrgent} />
            </div>
          </div>

          {/* Trust indicators */}
          <div className={`flex flex-wrap items-center justify-center gap-4 transition-all duration-700 delay-[400ms] lg:gap-8 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            {TRUST_ITEMS.map((item, index) => (
              <div key={item.en} className="flex items-center">
                <div className="flex items-center gap-3">
                  {item.icon}
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground/80 lg:text-base">{item.en}</span>
                    <span className="text-xs text-muted-foreground lg:text-sm">{item.ko}</span>
                  </div>
                </div>
                {index < 2 && <span className="ml-8 hidden text-foreground/20 lg:block">|</span>}
              </div>
            ))}
          </div>

          {/* 컨설팅 협업 신청 CTA */}
          <div className={`mt-12 flex justify-center transition-all duration-700 delay-500 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <a
              href="https://forms.gle/ACZTUa46yVyBoN256"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex animate-float-half items-center rounded-lg border border-foreground/20 bg-foreground/[0.04] px-7 py-3.5 text-sm font-medium text-foreground/80 transition-colors hover:border-foreground/40 hover:bg-foreground/[0.08] hover:text-foreground"
            >
              데이터 진단 컨설팅 협업 신청
            </a>
          </div>

        </div>
      </div>
    </section>
  );
}
