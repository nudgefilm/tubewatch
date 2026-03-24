"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { AnalysisHistoryItem } from "@/components/analysis/AnalysisHistoryList";

type GrowthTrendChartProps = {
  points: AnalysisHistoryItem[];
};

function formatShortDate(value: string | null): string {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";

  const KST_OFFSET = 9 * 60 * 60 * 1000;
  const kst = new Date(d.getTime() + KST_OFFSET);
  const m = String(kst.getUTCMonth() + 1).padStart(2, "0");
  const day = String(kst.getUTCDate()).padStart(2, "0");
  return `${m}/${day}`;
}

type ChartDatum = {
  date: string;
  score: number;
  fullDate: string;
};

export default function GrowthTrendChart({
  points,
}: GrowthTrendChartProps): JSX.Element {
  const chartData: ChartDatum[] = [...points]
    .filter(
      (p): p is AnalysisHistoryItem & { feature_total_score: number } =>
        p.feature_total_score != null &&
        p.status === "analyzed"
    )
    .sort(
      (a, b) =>
        new Date(a.created_at ?? 0).getTime() -
        new Date(b.created_at ?? 0).getTime()
    )
    .map((p) => ({
      date: formatShortDate(p.created_at),
      score: Math.round(p.feature_total_score),
      fullDate: p.created_at ?? "",
    }));

  if (chartData.length < 2) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500">
        분석 이력이 2건 이상이어야 성장 추이를 표시할 수 있습니다.
      </div>
    );
  }

  const scores = chartData.map((d) => d.score);
  const minScore = Math.max(0, Math.floor(Math.min(...scores) / 10) * 10 - 10);
  const maxScore = Math.min(100, Math.ceil(Math.max(...scores) / 10) * 10 + 10);

  return (
    <div className="h-64 w-full sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 8, right: 12, left: -8, bottom: 4 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "#6b7280" }}
            tickLine={false}
            axisLine={{ stroke: "#d1d5db" }}
          />
          <YAxis
            domain={[minScore, maxScore]}
            tick={{ fontSize: 11, fill: "#6b7280" }}
            tickLine={false}
            axisLine={{ stroke: "#d1d5db" }}
            width={36}
          />
          <Tooltip
            contentStyle={{
              fontSize: 12,
              borderRadius: 8,
              border: "1px solid #e5e7eb",
            }}
            formatter={(value: unknown) => [`${value}점`, "Score"]}
            labelFormatter={(_label: unknown, payload: unknown) => {
              const items = payload as { payload?: ChartDatum }[] | undefined;
              const item = items?.[0]?.payload;
              if (!item?.fullDate) return String(_label ?? "");
              const d = new Date(item.fullDate);
              if (Number.isNaN(d.getTime())) return String(_label ?? "");
              const KST = 9 * 60 * 60 * 1000;
              const kst = new Date(d.getTime() + KST);
              const y = kst.getUTCFullYear();
              const m = String(kst.getUTCMonth() + 1).padStart(2, "0");
              const day = String(kst.getUTCDate()).padStart(2, "0");
              const h = String(kst.getUTCHours()).padStart(2, "0");
              const min = String(kst.getUTCMinutes()).padStart(2, "0");
              return `${y}. ${m}. ${day}. ${h}:${min}`;
            }}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#4f46e5"
            strokeWidth={2}
            dot={{ r: 4, fill: "#4f46e5", strokeWidth: 0 }}
            activeDot={{ r: 6, fill: "#4f46e5", stroke: "#fff", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
