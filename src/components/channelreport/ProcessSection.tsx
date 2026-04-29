"use client";

import { useEffect, useRef, useState } from "react";

const steps = [
  {
    number: "01",
    title: "서비스 신청",
    description:
      "채널 URL과 담당자 정보를 입력합니다. 접수 즉시 결제 안내 이메일이 발송됩니다.",
    icon: "submit",
  },
  {
    number: "02",
    title: "전문가 전수 분석",
    description:
      "수석 전략가가 최근 영상 50개와 30개 시그널을 직접 조사합니다. 데이터 기반 병목 구간을 정확히 탐지합니다.",
    icon: "analyze",
  },
  {
    number: "03",
    title: "리포트 수령",
    description:
      "열람 가능한 클라이언트 리포트 전용 URL과 1:1 맞춤형 전문가 진단 코멘터리가 제공됩니다. 클라이언트 보고서에 바로 활용하세요.",
    icon: "report",
  },
];

function SubmitIcon({ isActive }: { isActive: boolean }) {
  return (
    <svg viewBox="0 0 80 80" className="w-full h-full">
      <rect
        x="15" y="10" width="50" height="60" rx="4"
        fill="none" stroke="currentColor" strokeWidth="2"
        className={`transition-all duration-500 ${isActive ? "opacity-100" : "opacity-40"}`}
      />
      {[0, 1, 2].map((i) => (
        <rect
          key={i} x="22" y={22 + i * 14}
          width={isActive ? 36 : 20} height="6" rx="1"
          fill="currentColor"
          className="transition-all duration-500"
          style={{ opacity: isActive ? 0.6 : 0.2, transitionDelay: `${i * 100}ms` }}
        >
          {isActive && (
            <animate attributeName="width" values="0;36" dur="0.6s" begin={`${i * 0.15}s`} fill="freeze" />
          )}
        </rect>
      ))}
      <rect
        x="22" y="54" width="36" height="10" rx="2"
        fill="currentColor"
        className={`transition-all duration-300 ${isActive ? "opacity-100" : "opacity-30"}`}
      >
        {isActive && (
          <animate attributeName="opacity" values="0.5;1;0.5" dur="1.5s" repeatCount="indefinite" />
        )}
      </rect>
      {isActive && (
        <g className="animate-bounce-subtle">
          <path d="M 72 20 L 78 14 L 72 8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
          <line x1="60" y1="14" x2="78" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
        </g>
      )}
    </svg>
  );
}

function AnalyzeIcon({ isActive }: { isActive: boolean }) {
  return (
    <svg viewBox="0 0 80 80" className="w-full h-full">
      <circle cx="35" cy="35" r="20" fill="none" stroke="currentColor" strokeWidth="2"
        className={`transition-all duration-500 ${isActive ? "opacity-100" : "opacity-40"}`}
      />
      <line x1="50" y1="50" x2="68" y2="68" stroke="currentColor" strokeWidth="3" strokeLinecap="round"
        className={`transition-all duration-500 ${isActive ? "opacity-100" : "opacity-40"}`}
      />
      {isActive && (
        <>
          {[
            { cx: 28, cy: 30, r: 3 },
            { cx: 38, cy: 38, r: 2.5 },
            { cx: 32, cy: 42, r: 2 },
            { cx: 42, cy: 28, r: 2.5 },
          ].map((dot, i) => (
            <circle key={i} cx={dot.cx} cy={dot.cy} r={dot.r} fill="currentColor" opacity="0">
              <animate attributeName="opacity" values="0;0.8;0" dur="2s" begin={`${i * 0.3}s`} repeatCount="indefinite" />
              <animate attributeName="r" values={`${dot.r};${dot.r + 1};${dot.r}`} dur="2s" begin={`${i * 0.3}s`} repeatCount="indefinite" />
            </circle>
          ))}
          <line x1="20" y1="35" x2="50" y2="35" stroke="currentColor" strokeWidth="1" opacity="0.5">
            <animate attributeName="y1" values="20;50;20" dur="2s" repeatCount="indefinite" />
            <animate attributeName="y2" values="20;50;20" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0;0.6;0" dur="2s" repeatCount="indefinite" />
          </line>
        </>
      )}
    </svg>
  );
}

function ReportIcon({ isActive }: { isActive: boolean }) {
  return (
    <svg viewBox="0 0 80 80" className="w-full h-full">
      <rect x="18" y="8" width="44" height="56" rx="4" fill="none" stroke="currentColor" strokeWidth="2"
        className={`transition-all duration-500 ${isActive ? "opacity-100" : "opacity-40"}`}
      />
      {[0, 1, 2, 3].map((i) => (
        <rect
          key={i}
          x={26 + i * 9}
          y={isActive ? 50 - [16, 24, 12, 20][i] : 45}
          width="6"
          height={isActive ? [16, 24, 12, 20][i] : 5}
          rx="1" fill="currentColor"
          className="transition-all duration-500"
          style={{ opacity: isActive ? 0.7 : 0.2, transitionDelay: `${i * 80}ms` }}
        />
      ))}
      <rect x="26" y="16" width="28" height="4" rx="1" fill="currentColor"
        className={`transition-opacity duration-500 ${isActive ? "opacity-50" : "opacity-20"}`}
      />
      {isActive && (
        <g>
          <circle cx="58" cy="58" r="10" fill="currentColor" opacity="0.9">
            <animate attributeName="r" values="0;10" dur="0.4s" fill="freeze" />
          </circle>
          <path d="M 53 58 L 56 61 L 63 54" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0">
            <animate attributeName="opacity" values="0;1" dur="0.2s" begin="0.3s" fill="freeze" />
          </path>
        </g>
      )}
    </svg>
  );
}

function StepIcon({ type, isActive }: { type: string; isActive: boolean }) {
  switch (type) {
    case "submit": return <SubmitIcon isActive={isActive} />;
    case "analyze": return <AnalyzeIcon isActive={isActive} />;
    case "report": return <ReportIcon isActive={isActive} />;
    default: return <SubmitIcon isActive={isActive} />;
  }
}

function StepCard({
  step, index, isActive, onClick,
}: {
  step: (typeof steps)[0];
  index: number;
  isActive: boolean;
  onClick: () => void;
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
      onClick={onClick}
      className={`relative cursor-pointer transition-all duration-700 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
      }`}
      style={{ transitionDelay: `${index * 150}ms` }}
    >
      <div
        className={`relative overflow-hidden rounded-2xl border p-6 transition-all duration-500 lg:p-8 ${
          isActive
            ? "scale-[1.02] border-foreground/30 bg-foreground/[0.03]"
            : "border-foreground/10 hover:border-foreground/20 hover:bg-foreground/[0.01]"
        }`}
      >
        {/* 프로그레스 바 */}
        <div className={`absolute left-0 right-0 top-0 h-1 bg-foreground transition-all duration-500 ${isActive ? "opacity-100" : "opacity-0"}`}>
          <div className="h-full bg-foreground/50 animate-progress" />
        </div>

        <div className="mb-6 flex items-start justify-between">
          <span
            className={`inline-flex h-10 w-10 items-center justify-center rounded-full border-2 font-mono text-sm transition-all duration-300 ${
              isActive ? "border-foreground bg-foreground text-background" : "border-foreground/20 text-foreground/50"
            }`}
          >
            {step.number}
          </span>
          {index < steps.length - 1 && (
            <div className="absolute -right-8 top-1/2 z-10 hidden -translate-y-1/2 items-center lg:flex">
              <div className={`h-px w-16 transition-all duration-500 ${isActive ? "bg-foreground/40" : "bg-foreground/10"}`}>
                {isActive && <div className="h-full w-0 animate-line-expand bg-foreground" />}
              </div>
              <div className={`-ml-1 h-2 w-2 rotate-45 border-r-2 border-t-2 transition-all duration-300 ${isActive ? "border-foreground/40" : "border-foreground/10"}`} />
            </div>
          )}
        </div>

        <div className={`mx-auto mb-6 h-20 w-20 text-foreground transition-all duration-500 ${isActive ? "scale-110" : "scale-100"}`}>
          <StepIcon type={step.icon} isActive={isActive} />
        </div>

        <div className="text-center">
          <h3 className={`mb-3 font-display text-xl transition-all duration-300 lg:text-2xl ${isActive ? "text-foreground" : "text-foreground/70"}`}>
            {step.title}
          </h3>
          <p className={`text-sm leading-relaxed transition-all duration-300 ${isActive ? "text-muted-foreground" : "text-muted-foreground/60"}`}>
            {step.description}
          </p>
        </div>

        <div
          className={`pointer-events-none absolute inset-0 transition-opacity duration-500 ${isActive ? "opacity-100" : "opacity-0"}`}
          style={{ background: "radial-gradient(circle at 50% 0%, rgba(0,0,0,0.03) 0%, transparent 70%)" }}
        />
      </div>
    </div>
  );
}

export function ProcessSection() {
  const [activeStep, setActiveStep] = useState(0);
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
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section id="process" ref={sectionRef} className="relative overflow-hidden py-16 lg:py-24">
      {/* 배경 그리드 */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.02]">
        <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
      </div>

      <div className="relative z-10 mx-auto max-w-[1100px] px-8 lg:px-16">
        <div className="mb-12 text-center lg:mb-16">
          <span className="mb-6 inline-flex items-center gap-3 font-mono text-sm text-muted-foreground">
            <span className="h-px w-8 bg-foreground/30" />
            Simple 3-Step Process
            <span className="h-px w-8 bg-foreground/30" />
          </span>
          <h2 className={`font-display text-4xl tracking-tight transition-all duration-700 lg:text-6xl ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            진행 프로세스
          </h2>
          <p className={`mx-auto mt-4 max-w-2xl text-lg text-muted-foreground transition-all duration-700 delay-100 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            신청부터 리포트 수령까지, 단 3단계로 완성됩니다
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-12">
          {steps.map((step, index) => (
            <StepCard
              key={step.number}
              step={step}
              index={index}
              isActive={activeStep === index}
              onClick={() => setActiveStep(index)}
            />
          ))}
        </div>

        {/* 모바일 도트 인디케이터 */}
        <div className="mt-8 flex justify-center gap-3 lg:hidden">
          {steps.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setActiveStep(index)}
              className={`h-2 rounded-full transition-all duration-300 ${activeStep === index ? "w-8 bg-foreground" : "w-2 bg-foreground/20 hover:bg-foreground/40"}`}
              aria-label={`Go to step ${index + 1}`}
            />
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
        .animate-progress { animation: progress 4s linear forwards; }
        @keyframes line-expand {
          from { width: 0%; }
          to { width: 100%; }
        }
        .animate-line-expand { animation: line-expand 0.5s ease-out forwards; }
        .animate-bounce-subtle { animation: bounce-subtle 1.5s ease-in-out infinite; }
        @keyframes bounce-subtle {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(3px); }
        }
      `}</style>
    </section>
  );
}
