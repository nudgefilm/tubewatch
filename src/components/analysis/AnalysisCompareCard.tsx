"use client";

import { formatDateTime } from "@/lib/format/formatDateTime";

export type CompareAnalysis = {
  id: string;
  created_at: string | null;
  feature_total_score: number | null;
  feature_section_scores: Record<string, number> | null;
};

type AnalysisCompareCardProps = {
  current: CompareAnalysis;
  previous: CompareAnalysis | null;
};

const COMPARE_KEYS: { key: string; label: string }[] = [
  { key: "_total", label: "종합 점수" },
  { key: "channelActivity", label: "채널 활동" },
  { key: "audienceResponse", label: "시청자 반응" },
  { key: "contentStructure", label: "콘텐츠 구조" },
  { key: "seoOptimization", label: "SEO 최적화" },
  { key: "growthMomentum", label: "성장 모멘텀" },
];

function getScore(
  analysis: CompareAnalysis,
  key: string
): number | null {
  if (key === "_total") return analysis.feature_total_score;
  return analysis.feature_section_scores?.[key] ?? null;
}

function DeltaBadge({ diff }: { diff: number }): JSX.Element {
  if (diff > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
        ▲ +{diff}
      </span>
    );
  }
  if (diff < 0) {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-md bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
        ▼ {diff}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500">
      — 0
    </span>
  );
}

export default function AnalysisCompareCard({
  current,
  previous,
}: AnalysisCompareCardProps): JSX.Element {
  if (!previous) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-8 text-center text-sm text-gray-500">
        이전 분석 기록이 없어 비교를 표시할 수 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
        <div>
          <span className="font-medium text-gray-700">이전</span>{" "}
          {formatDateTime(previous.created_at)}
        </div>
        <span className="text-gray-300">→</span>
        <div>
          <span className="font-medium text-gray-700">현재</span>{" "}
          {formatDateTime(current.created_at)}
        </div>
      </div>

      <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
        {COMPARE_KEYS.map(({ key, label }) => {
          const prevScore = getScore(previous, key);
          const currScore = getScore(current, key);
          const isTotal = key === "_total";

          const hasBoth = prevScore != null && currScore != null;
          const diff = hasBoth ? Math.round(currScore - prevScore) : null;

          return (
            <div
              key={key}
              className={[
                "flex items-center justify-between gap-3 px-4 py-3",
                isTotal ? "bg-gray-50" : "",
              ].join(" ")}
            >
              <span
                className={[
                  "text-sm",
                  isTotal ? "font-semibold text-gray-900" : "font-medium text-gray-700",
                ].join(" ")}
              >
                {label}
              </span>

              <div className="flex items-center gap-3">
                <span className="text-xs tabular-nums text-gray-400">
                  {prevScore != null ? Math.round(prevScore) : "—"}
                </span>
                <span className="text-gray-300">→</span>
                <span className="text-sm font-semibold tabular-nums text-gray-900">
                  {currScore != null ? Math.round(currScore) : "—"}
                </span>
                {diff != null ? (
                  <DeltaBadge diff={diff} />
                ) : (
                  <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-0.5 text-xs text-gray-400">
                    —
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
