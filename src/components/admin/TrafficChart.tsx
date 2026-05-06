"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { TrafficDayRow } from "./types";

type Props = { data: TrafficDayRow[] };

function fmtDate(dateStr: string): string {
  const parts = dateStr.split("-");
  if (parts.length < 3) return dateStr;
  return `${parts[1]}/${parts[2]}`;
}

export default function TrafficChart({ data }: Props): JSX.Element {
  const chartData = data.map((d) => ({ date: fmtDate(d.date), visitors: d.visitors }));
  const total = data.reduce((s, d) => s + d.visitors, 0);
  const peak = Math.max(...data.map((d) => d.visitors));

  return (
    <div className="rounded-xl border border-foreground/8 bg-card p-5">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">트래픽 (최근 30일)</p>
          <p className="mt-0.5 text-xs text-muted-foreground">일별 순 방문자 수</p>
        </div>
        <div className="flex gap-4 text-right">
          <div>
            <p className="text-xs text-muted-foreground">30일 합계</p>
            <p className="text-base font-semibold text-foreground">{total.toLocaleString("ko-KR")}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">최고 단일일</p>
            <p className="text-base font-semibold text-foreground">{peak.toLocaleString("ko-KR")}</p>
          </div>
        </div>
      </div>

      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="trafficGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--foreground) / 0.06)" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={{ stroke: "hsl(var(--foreground) / 0.08)" }}
              interval={Math.max(0, Math.floor(chartData.length / 8) - 1)}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                fontSize: 11,
                borderRadius: 8,
                border: "1px solid hsl(var(--foreground) / 0.1)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                backgroundColor: "hsl(var(--card))",
                color: "hsl(var(--foreground))",
              }}
              formatter={(v: unknown) => [`${Number(v).toLocaleString("ko-KR")}명`, "방문자"]}
            />
            <Area
              type="monotone"
              dataKey="visitors"
              stroke="#6366f1"
              strokeWidth={1.5}
              fill="url(#trafficGrad)"
              dot={false}
              activeDot={{ r: 4, fill: "#6366f1", strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
