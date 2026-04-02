"use client";

import React, { useEffect, useState } from "react";
import { X, UserPlus, BarChart3, Lightbulb, Rocket } from "lucide-react";

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = {
  number: string;
  title: string;
  description: string;
  icon: React.ElementType;
  items: string[];
  label: string;
  modules?: { name: string; desc: string }[];
  note?: string;
};

const steps: Step[] = [
  {
    number: "01",
    title: "채널 등록",
    description: "YouTube 채널 URL을 등록하면 끝입니다.\n튜브워치가 YouTube 공식 API를 통해 최근 영상 50개와 채널 활동 데이터를 자동으로 수집합니다.",
    icon: UserPlus,
    items: ["채널 기본 정보", "최근 영상 50개", "조회수·좋아요·댓글", "업로드 패턴", "영상 제목·태그·설명", "시청 지속 시간"],
    label: "수집되는 데이터",
  },
  {
    number: "02",
    title: "80개 신호 분석",
    description: "수집된 데이터를 튜브워치 엔진이 80개 성장 신호로 분해해 채널의 현재 상태를 진단합니다.\n단순 통계가 아닌 채널 구조 자체를 분석합니다.",
    icon: BarChart3,
    items: ["콘텐츠 주제 일관성", "시청자 반응 구조", "채널 활동 패턴", "SEO 최적화 상태", "성장 모멘텀", "구독 전환 구조", "업로드 주기", "키워드 밀도"],
    label: "분석 신호 영역",
    note: "80개 신호는 8개 성장 지표로 점수화되어 채널 종합 성장 점수(100점 만점)를 산출합니다.",
  },
  {
    number: "03",
    title: "튜브워치 엔진 인사이트",
    description: "튜브워치 엔진이 분석 결과를 실행 가능한 전략 언어로 번역합니다.\n어떤 콘텐츠가 반응이 좋은지, 무엇을 바꿔야 성장하는지 구체적으로 제안합니다.",
    icon: Lightbulb,
    items: ["채널 강점·약점 진단", "콘텐츠 주제 방향", "제목·SEO 개선안", "업로드 전략", "성장 시나리오", "다음 영상 아이디어"],
    label: "생성되는 인사이트",
    note: "분석 결과는 추상적인 평가가 아닌, 오늘 당장 실행할 수 있는 구체적인 액션으로 제공됩니다.",
  },
  {
    number: "04",
    title: "4가지 분석 도구 제공",
    description: "튜브워치는 분석 결과를 4개의 전문 도구로 나눠 제공합니다.\n채널 현황부터 다음 영상 주제까지, 성장의 전 과정을 다룹니다.",
    icon: Rocket,
    items: [],
    label: "4가지 분석 모듈",
    modules: [
      { name: "Channel Analysis", desc: "채널 종합 진단" },
      { name: "Channel DNA",      desc: "성과 패턴 분석" },
      { name: "Action Plan",      desc: "실행 전략 제안" },
      { name: "Next Trend",       desc: "다음 영상 주제 추천" },
    ],
    note: "각 모듈은 동일한 분석 데이터를 기반으로 연결되어, 진단부터 실행까지 일관된 전략을 제공합니다.",
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
            <h2 className="text-2xl font-heading font-medium tracking-[-0.03em] leading-[1.1] mt-1">TubeWatch 작동 방식</h2>
            <p className="text-sm text-muted-foreground mt-1">채널 URL 등록부터 실행 전략까지 — 데이터가 성장의 답을 알고 있습니다.</p>
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
                  <h3 className="text-xl font-heading font-medium tracking-[-0.03em]">{currentStep.title}</h3>
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

                {currentStep.modules ? (
                  <div className="grid grid-cols-2 gap-3">
                    {currentStep.modules.map((mod, idx) => (
                      <div
                        key={mod.name}
                        className="flex items-start gap-2 animate-in fade-in slide-in-from-bottom-2"
                        style={{ animationDelay: `${idx * 50}ms` }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 shrink-0" />
                        <div className="flex flex-col">
                          <span className="text-sm">{mod.name}</span>
                          <span className="text-xs text-muted-foreground">{mod.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
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
                )}

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
            튜브워치 엔진 — 영상 50개 · 신호 80개 · 성장 지표 8개 · 분석 모듈 4개
          </p>
        </div>
      </div>
    </div>
  );
}
