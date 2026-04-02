"use client";

import { useEffect, useState } from "react";
import { X, UserPlus, BarChart3, Lightbulb, Rocket } from "lucide-react";

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const steps = [
  {
    number: "01",
    title: "채널 등록",
    description: "사용자는 자신의 YouTube 채널을 등록합니다.\nTubeWatch는 YouTube 공식 API를 통해 채널 데이터를 안전하게 수집합니다.",
    icon: UserPlus,
    items: ["채널 기본 정보", "최근 업로드 영상", "조회수", "댓글 반응", "업로드 패턴", "영상 메타데이터"],
    label: "수집되는 데이터",
  },
  {
    number: "02",
    title: "데이터 분석",
    description: "수집된 데이터를 기반으로 TubeWatch 분석 엔진이 채널을 진단합니다.",
    icon: BarChart3,
    items: ["채널 활동 패턴", "시청자 반응", "콘텐츠 구조", "SEO 최적화", "성장 모멘텀"],
    label: "분석 영역",
    note: "각 항목은 데이터 기반 점수와 인사이트로 분석됩니다.",
  },
  {
    number: "03",
    title: "전략 인사이트 생성",
    description: "분석된 데이터를 기반으로 튜브워치가 채널 성장 전략 인사이트를 도출합니다.",
    icon: Lightbulb,
    items: ["콘텐츠 방향", "업로드 전략", "SEO 개선 포인트", "성장 가능성 시나리오"],
    label: "생성되는 전략",
    note: "채널 데이터 패턴을 기반으로 다음 영상 아이디어와 카테고리 트렌드도 제안됩니다.",
  },
  {
    number: "04",
    title: "실행 가능한 액션 제공",
    description: "TubeWatch는 분석 결과를 기반으로 실행 가능한 전략 도구를 제공합니다.",
    icon: Rocket,
    items: ["채널 진단", "Action Plan", "SEO Lab", "Channel DNA", "Next Trend"],
    label: "대표 기능",
    note: "Next Trend는 채널 데이터 패턴을 분석하여 다음 영상 아이디어, 카테고리 트렌드, 니치 콘텐츠 기회를 발견할 수 있도록 도와줍니다.",
  },
];

export function HowItWorksModal({ isOpen, onClose }: HowItWorksModalProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setActiveStep(0);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const handleStepChange = (index: number) => {
    if (index === activeStep || isAnimating) return;
    setIsAnimating(true);
    setActiveStep(index);
    setTimeout(() => setIsAnimating(false), 500);
  };

  if (!isOpen) return null;

  const currentStep = steps[activeStep];
  const Icon = currentStep.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-4xl max-h-[90vh] mx-4 bg-background border border-foreground/10 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-foreground/10">
          <div>
            <span className="font-mono text-xs text-muted-foreground uppercase tracking-widest">How It Works</span>
            <h2 className="text-2xl font-heading font-medium tracking-[-0.02em] mt-1">TubeWatch 작동 방식</h2>
            <p className="text-sm text-muted-foreground mt-1">TubeWatch는 유튜브 채널 데이터를 기반으로 채널 성장 전략을 찾는 데이터 분석 플랫폼입니다.</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-foreground/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col md:flex-row">
          {/* Step Navigation */}
          <div className="md:w-48 border-b md:border-b-0 md:border-r border-foreground/10 p-4">
            <div className="flex md:flex-col gap-2">
              {steps.map((step, index) => (
                <button
                  key={step.number}
                  onClick={() => handleStepChange(index)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-300 cursor-pointer w-full ${
                    activeStep === index
                      ? "bg-foreground text-background"
                      : "hover:bg-foreground/5 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className="font-mono text-xs">{step.number}</span>
                  <span className="text-sm font-medium hidden md:block">{step.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Step Content */}
          <div className="flex-1 p-6 md:p-8 overflow-y-auto max-h-[60vh]">
            <div
              key={activeStep}
              className={`transition-all duration-500 ${
                isAnimating ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
              }`}
            >
              {/* Step Header */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-xl bg-foreground/5 flex items-center justify-center">
                  <Icon className="w-7 h-7 text-foreground" />
                </div>
                <div>
                  <span className="font-mono text-xs text-orange-500">STEP {currentStep.number}</span>
                  <h3 className="text-xl font-heading font-medium tracking-[-0.02em]">{currentStep.title}</h3>
                </div>
              </div>

              {/* Description */}
              <p className="text-muted-foreground leading-relaxed mb-6 whitespace-pre-line">
                {currentStep.description}
              </p>

              {/* Items */}
              <div className="bg-foreground/[0.02] border border-foreground/10 rounded-xl p-5">
                <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-4 block">
                  {currentStep.label}
                </span>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {currentStep.items.map((item, idx) => (
                    <div
                      key={item}
                      className="flex items-center gap-2 text-sm animate-in fade-in slide-in-from-bottom-2"
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                      {item}
                    </div>
                  ))}
                </div>
                {currentStep.note && (
                  <p className="text-xs text-muted-foreground mt-4 pt-4 border-t border-foreground/10">
                    {currentStep.note}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-foreground/10 bg-foreground/[0.02]">
          <p className="text-center text-sm text-muted-foreground">
            TubeWatch는 데이터를 기반으로 유튜브 채널 성장 전략을 설계합니다.
          </p>
        </div>
      </div>
    </div>
  );
}
