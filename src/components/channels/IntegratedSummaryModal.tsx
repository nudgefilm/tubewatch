"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

// 모달이 필요로 하는 채널 정보만 최소 정의
interface ChannelInfo {
  id: string;
  channel_title: string | null;
}

interface Props {
  isOpen: boolean;
  channel: ChannelInfo;
  onClose: () => void;
}

type Status = "loading" | "no_analysis" | "error" | "done";

interface SummarySection {
  label: string;
  content: string;
}

// 섹션별 아이콘 및 강조 색상
const SECTION_META: Record<string, { icon: string; color: string }> = {
  "현황":         { icon: "📊", color: "text-blue-600" },
  "핵심 원인":    { icon: "🔍", color: "text-orange-600" },
  "전략적 타겟":  { icon: "🎯", color: "text-purple-600" },
  "치트키 Action": { icon: "⚡", color: "text-primary" },
  "성장 예측":    { icon: "📈", color: "text-green-600" },
};

/**
 * AI가 반환한 텍스트를 5개 섹션으로 파싱합니다.
 * 형식: **섹션명:** 내용
 */
function parseSummary(text: string): SummarySection[] {
  // **레이블:** 구분자로 분리
  const parts = text.split(/\*\*(.+?):\*\*/);
  // parts: ["앞 텍스트(보통 공백)", "현황", " 내용...\n\n", "핵심 원인", ...]
  const sections: SummarySection[] = [];
  for (let i = 1; i < parts.length; i += 2) {
    const label   = parts[i].trim();
    const content = (parts[i + 1] ?? "").replace(/^\s+|\s+$/g, "");
    if (label && content) {
      sections.push({ label, content });
    }
  }
  return sections;
}

export function IntegratedSummaryModal({ isOpen, channel, onClose }: Props) {
  const [status,   setStatus]   = useState<Status>("loading");
  const [sections, setSections] = useState<SummarySection[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    setStatus("loading");
    setSections([]);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/analysis/integrated-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userChannelId: channel.id }),
      });

      const data = (await res.json()) as Record<string, unknown>;

      if (data.noAnalysis === true) {
        setStatus("no_analysis");
        return;
      }
      if (!res.ok || typeof data.summary !== "string") {
        setErrorMsg(
          typeof data.error === "string"
            ? data.error
            : "알 수 없는 오류가 발생했습니다."
        );
        setStatus("error");
        return;
      }

      const parsed = parseSummary(data.summary);
      setSections(parsed.length > 0 ? parsed : [{ label: "요약", content: data.summary }]);
      setStatus("done");
    } catch {
      setErrorMsg("네트워크 오류가 발생했습니다. 인터넷 연결을 확인해 주세요.");
      setStatus("error");
    }
  }, [channel.id]);

  // 모달 열릴 때마다 새로 fetch (캐싱 없이 항상 최신 분석 기준)
  useEffect(() => {
    if (!isOpen) return;
    void fetchSummary();
  }, [isOpen, fetchSummary]);

  // ESC 키 닫기
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 백드롭 */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* 모달 카드 */}
      <div className="relative w-full max-w-lg bg-background border border-border rounded-2xl shadow-2xl animate-in zoom-in-95 fade-in duration-200 overflow-hidden">

        {/* ── 헤더 ── */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              {/* 스파클 아이콘 (인라인 SVG) */}
              <svg
                className="size-4 text-primary"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z"
                />
              </svg>
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-foreground">튜브워치 AI 통합 요약</h2>
              <p className="truncate text-xs text-muted-foreground">
                {channel.channel_title ?? "채널"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="닫기"
          >
            <svg className="size-4" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {/* ── 본문 ── */}
        <div className="px-5 py-5 max-h-[65vh] overflow-y-auto">

          {/* 로딩 */}
          {status === "loading" && (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <Loader2 className="size-7 animate-spin text-primary" />
              <p className="text-sm font-medium text-foreground">
                AI가 4개 리포트를 통합 분석 중입니다…
              </p>
              <p className="text-xs text-muted-foreground">
                채널 성장 치트키와 핵심 인사이트를 추출하고 있습니다.
              </p>
            </div>
          )}

          {/* 분석 데이터 없음 */}
          {status === "no_analysis" && (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-amber-50">
                <svg
                  className="size-6 text-amber-500"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                  />
                </svg>
              </div>
              <p className="text-sm font-semibold text-foreground">
                아직 분석 리포트가 생성되지 않았습니다.
              </p>
              <p className="text-sm text-muted-foreground">
                위 <span className="font-medium text-foreground">채널 분석 시작</span> 버튼을 먼저 눌러<br />
                채널 분석을 완료하면 통합 요약을 확인할 수 있습니다.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
              >
                확인
              </button>
            </div>
          )}

          {/* 에러 */}
          {status === "error" && (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-red-50">
                <svg
                  className="size-6 text-red-500"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
                  />
                </svg>
              </div>
              <p className="text-sm font-semibold text-foreground">
                요약 생성에 실패했습니다
              </p>
              <p className="text-sm text-muted-foreground">
                {errorMsg ?? "알 수 없는 오류가 발생했습니다."}
              </p>
              <button
                type="button"
                onClick={() => void fetchSummary()}
                className="mt-1 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                다시 시도
              </button>
            </div>
          )}

          {/* 완료 — 5개 섹션 렌더 */}
          {status === "done" && sections.length > 0 && (
            <div className="space-y-4">
              {sections.map((sec) => {
                const meta = SECTION_META[sec.label];
                return (
                  <div key={sec.label} className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      {meta && (
                        <span className="text-base leading-none" aria-hidden="true">
                          {meta.icon}
                        </span>
                      )}
                      <span
                        className={`text-xs font-semibold ${meta ? meta.color : "text-foreground/60"}`}
                      >
                        {sec.label}
                      </span>
                    </div>
                    <p className="pl-6 text-sm leading-relaxed text-foreground">
                      {sec.content}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── 푸터 (완료 시만 표시) ── */}
        {status === "done" && (
          <div className="border-t border-border bg-muted/30 px-5 py-3">
            <p className="text-xs text-muted-foreground">
              TubeWatch가 채널 분석·DNA·액션 플랜·넥스트 트렌드 4개 리포트를 통합 분석했습니다.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
