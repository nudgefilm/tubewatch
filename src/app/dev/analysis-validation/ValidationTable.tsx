"use client";

import { useState } from "react";
import type {
  ValidationIssue,
  ValidationIssueType,
} from "@/lib/analysis/validation/analysisQualityCheck";
import type { EnrichedValidationResult } from "./page";

type ValidationTableProps = {
  results: EnrichedValidationResult[];
};

const ISSUE_TYPE_LABEL: Record<ValidationIssueType, string> = {
  missing_metric: "메트릭 누락",
  empty_insight: "인사이트 누락",
  inconsistency: "불일치",
  generic_text: "추상적 표현",
  channel_size_mismatch: "규모 불일치",
};

const ISSUE_TYPE_STYLE: Record<ValidationIssueType, string> = {
  missing_metric: "bg-orange-100 text-orange-700",
  empty_insight: "bg-amber-100 text-amber-700",
  inconsistency: "bg-red-100 text-red-700",
  generic_text: "bg-violet-100 text-violet-700",
  channel_size_mismatch: "bg-sky-100 text-sky-700",
};

function getScoreColor(score: number): string {
  if (score >= 80) return "text-emerald-600";
  if (score >= 50) return "text-amber-600";
  return "text-red-500";
}

function getScoreBg(score: number): string {
  if (score >= 80) return "bg-emerald-50";
  if (score >= 50) return "bg-amber-50";
  return "bg-red-50";
}

function getConfBadgeClass(level: string): string {
  if (level === "high") return "bg-emerald-50 text-emerald-700";
  if (level === "medium") return "bg-amber-50 text-amber-700";
  return "bg-red-50 text-red-700";
}

function getConfLabel(level: string): string {
  if (level === "high") return "높음";
  if (level === "medium") return "보통";
  return "낮음";
}

function formatDate(value: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function summarizeIssues(issues: ValidationIssue[]): string {
  if (issues.length === 0) return "이슈 없음";

  const counts: Partial<Record<ValidationIssueType, number>> = {};
  for (const issue of issues) {
    counts[issue.type] = (counts[issue.type] ?? 0) + 1;
  }

  return Object.entries(counts)
    .map(([type, count]) => `${ISSUE_TYPE_LABEL[type as ValidationIssueType]} ${count}`)
    .join(", ");
}

function IssueTag({ issue }: { issue: ValidationIssue }): JSX.Element {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${ISSUE_TYPE_STYLE[issue.type]}`}
    >
      {ISSUE_TYPE_LABEL[issue.type]}
    </span>
  );
}

export default function ValidationTable({ results }: ValidationTableProps): JSX.Element {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function toggleRow(id: string): void {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="hidden grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_72px_72px_72px_minmax(0,2fr)] gap-3 border-b border-gray-100 bg-gray-50 px-5 py-3 text-xs font-semibold text-gray-500 sm:grid">
        <span>채널</span>
        <span>분석 일시</span>
        <span className="text-center">점수</span>
        <span className="text-center">신뢰도</span>
        <span className="text-center">이슈</span>
        <span>이슈 요약</span>
      </div>

      {/* Rows */}
      {results.map((result) => {
        const isExpanded = expandedId === result.analysis_id;
        return (
          <div key={result.analysis_id} className="border-b border-gray-100 last:border-b-0">
            {/* Summary row */}
            <button
              type="button"
              onClick={() => toggleRow(result.analysis_id)}
              className="w-full px-5 py-3.5 text-left transition-colors hover:bg-gray-50"
            >
              {/* Mobile layout */}
              <div className="flex items-center justify-between sm:hidden">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900">
                    {result.channel_title}
                    {result.lowConfidenceWarning ? (
                      <span className="ml-1.5 inline-flex items-center rounded bg-red-100 px-1 py-0.5 text-[9px] font-bold text-red-600">
                        경고
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-400">
                    {formatDate(result.created_at)} · 신뢰도 {getConfLabel(result.confidence.confidenceLevel)} ({result.confidence.confidenceScore})
                  </p>
                </div>
                <div className="ml-3 flex items-center gap-2">
                  <span
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold tabular-nums ${getScoreBg(result.score)} ${getScoreColor(result.score)}`}
                  >
                    {result.score}
                  </span>
                  {result.issues.length > 0 ? (
                    <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-100 px-1.5 text-[11px] font-bold text-red-600">
                      {result.issues.length}
                    </span>
                  ) : (
                    <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-100 px-1.5 text-[11px] font-bold text-emerald-600">
                      0
                    </span>
                  )}
                  <svg
                    className={`h-4 w-4 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Desktop layout */}
              <div className="hidden grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_72px_72px_72px_minmax(0,2fr)] items-center gap-3 sm:grid">
                <span className="flex items-center gap-1.5 truncate text-sm font-semibold text-gray-900">
                  {result.channel_title}
                  {result.lowConfidenceWarning ? (
                    <span className="inline-flex items-center rounded bg-red-100 px-1 py-0.5 text-[9px] font-bold text-red-600">
                      경고
                    </span>
                  ) : null}
                </span>
                <span className="text-sm text-gray-500">{formatDate(result.created_at)}</span>
                <span className="text-center">
                  <span
                    className={`inline-flex h-7 w-9 items-center justify-center rounded-md text-sm font-bold tabular-nums ${getScoreBg(result.score)} ${getScoreColor(result.score)}`}
                  >
                    {result.score}
                  </span>
                </span>
                <span className="text-center">
                  <span
                    className={`inline-flex h-7 min-w-[36px] items-center justify-center rounded-md text-[11px] font-bold tabular-nums ${getConfBadgeClass(result.confidence.confidenceLevel)}`}
                  >
                    {result.confidence.confidenceScore}
                  </span>
                </span>
                <span className="text-center">
                  {result.issues.length > 0 ? (
                    <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-100 px-1.5 text-xs font-bold text-red-600">
                      {result.issues.length}
                    </span>
                  ) : (
                    <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-100 px-1.5 text-xs font-bold text-emerald-600">
                      0
                    </span>
                  )}
                </span>
                <div className="flex items-center gap-2">
                  <span className="truncate text-xs text-gray-500">
                    {summarizeIssues(result.issues)}
                  </span>
                  <svg
                    className={`ml-auto h-4 w-4 flex-shrink-0 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </button>

            {/* Expanded detail */}
            {isExpanded ? (
              <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-4">
                <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:gap-8">
                  <div>
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                      Analysis ID
                    </p>
                    <p className="font-mono text-xs text-gray-500">{result.analysis_id}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                      신뢰도
                    </p>
                    <p className="text-xs text-gray-600">
                      <span className={`font-bold ${getConfBadgeClass(result.confidence.confidenceLevel)} rounded px-1.5 py-0.5`}>
                        {getConfLabel(result.confidence.confidenceLevel)} ({result.confidence.confidenceScore})
                      </span>
                    </p>
                  </div>
                </div>

                {result.lowConfidenceWarning ? (
                  <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
                    신뢰도가 낮지만 인사이트에서 강한 결론을 제시하고 있습니다. 리뷰가 필요합니다.
                  </div>
                ) : null}

                {result.confidence.reasons.length > 0 ? (
                  <div className="mb-4">
                    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                      신뢰도 근거
                    </p>
                    <ul className="space-y-1">
                      {result.confidence.reasons.map((reason, i) => (
                        <li key={i} className="text-xs leading-relaxed text-gray-600">
                          · {reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {result.issues.length === 0 ? (
                  <p className="text-sm text-emerald-600">모든 검증 항목을 통과했습니다.</p>
                ) : (
                  <ul className="space-y-2">
                    {result.issues.map((issue, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2.5 rounded-lg border border-gray-200 bg-white px-3.5 py-2.5"
                      >
                        <IssueTag issue={issue} />
                        <span className="text-sm leading-relaxed text-gray-700">
                          {issue.message}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
