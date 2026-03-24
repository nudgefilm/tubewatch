"use client";

import { formatDateTime } from "@/lib/format/formatDateTime";

export type AnalysisHistoryItem = {
  id: string;
  job_id: string;
  created_at: string | null;
  feature_total_score: number | null;
  status: string | null;
  gemini_status: string | null;
};

type AnalysisHistoryListProps = {
  items: AnalysisHistoryItem[];
  currentResultId?: string | null;
};

function getStatusLabel(
  status: string | null | undefined,
  geminiStatus: string | null | undefined
): { text: string; className: string } {
  if (status === "analyzed" && geminiStatus === "success") {
    return { text: "성공", className: "bg-emerald-100 text-emerald-700" };
  }
  if (geminiStatus === "failed" || status === "failed") {
    return { text: "실패", className: "bg-red-100 text-red-700" };
  }
  if (status === "analyzed") {
    return { text: "완료", className: "bg-blue-100 text-blue-700" };
  }
  return { text: "진행 중", className: "bg-amber-100 text-amber-700" };
}

export default function AnalysisHistoryList({
  items,
  currentResultId,
}: AnalysisHistoryListProps): JSX.Element {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500">
        분석 이력이 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item, index) => {
        const isCurrent = item.id === currentResultId;
        const isLatest = index === 0;
        const statusInfo = getStatusLabel(item.status, item.gemini_status);

        return (
          <div
            key={item.id}
            className={[
              "flex flex-wrap items-center justify-between gap-4 rounded-xl border px-4 py-3 text-sm transition",
              isCurrent
                ? "border-indigo-200 bg-indigo-50"
                : "border-gray-200 bg-white hover:bg-gray-50",
            ].join(" ")}
          >
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-gray-400">
                #{items.length - index}
              </span>
              <span className="font-medium text-gray-900">
                {formatDateTime(item.created_at)}
              </span>
              {isCurrent ? (
                <span className="rounded-md bg-indigo-100 px-1.5 py-0.5 text-xs font-semibold text-indigo-700">
                  현재 보고서
                </span>
              ) : null}
              {isLatest && !isCurrent ? (
                <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-xs font-semibold text-gray-600">
                  최신
                </span>
              ) : null}
            </div>

            <div className="flex items-center gap-3">
              {item.feature_total_score != null ? (
                <span className="text-sm font-semibold tabular-nums text-gray-700">
                  {Math.round(item.feature_total_score)}점
                </span>
              ) : (
                <span className="text-xs text-gray-400">—</span>
              )}
              <span
                className={`rounded-md px-1.5 py-0.5 text-xs font-semibold ${statusInfo.className}`}
              >
                {statusInfo.text}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
