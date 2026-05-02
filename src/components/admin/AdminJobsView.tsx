import type { AdminJobsData } from "./types";
import { formatDateTime } from "@/lib/format/formatDateTime";

const STATUS_STYLE: Record<string, string> = {
  pending:   "bg-yellow-500/10 text-yellow-600",
  running:   "bg-blue-500/10 text-blue-600",
  completed: "bg-green-500/10 text-green-600",
  failed:    "bg-red-500/10 text-red-600",
};

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_STYLE[status] ?? "bg-foreground/8 text-muted-foreground";
  return (
    <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${cls}`}>
      {status}
    </span>
  );
}

export default function AdminJobsView({ data, hideHeader }: { data: AdminJobsData; hideHeader?: boolean }): JSX.Element {
  const { kpi, rows, total } = data;

  return (
    <div className="space-y-6">
      {!hideHeader && (
        <div className="border-b border-foreground/8 pb-5">
          <h1 className="font-heading text-2xl font-medium tracking-[-0.03em] text-foreground">분석 작업</h1>
          <p className="mt-1 text-sm text-muted-foreground">분석 큐 — 최근 {total}건</p>
        </div>
      )}

      {/* Status KPI */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Pending",   value: kpi.pending,   color: "text-yellow-600" },
          { label: "Running",   value: kpi.running,   color: "text-blue-600" },
          { label: "Completed", value: kpi.completed, color: "text-green-600" },
          { label: "Failed",    value: kpi.failed,    color: "text-red-600" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border border-foreground/10 bg-foreground/[0.02] p-4">
            <p className="text-sm font-semibold text-muted-foreground">{label}</p>
            <p className={`mt-1.5 font-heading text-2xl font-medium tabular-nums tracking-[-0.03em] ${color}`}>
              {value.toLocaleString("ko-KR")}
            </p>
          </div>
        ))}
      </div>

      {/* Jobs Table */}
      <div className="rounded-xl border border-foreground/10 bg-foreground/[0.02]">
        <div className="border-b border-foreground/8 px-4 py-3">
          <p className="text-sm font-heading font-semibold tracking-[-0.01em] text-foreground">
            최근 분석 요청
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-foreground/8">
                <th className="px-4 pb-2 pt-3 font-semibold text-foreground">Job ID</th>
                <th className="px-4 pb-2 pt-3 font-semibold text-foreground">채널</th>
                <th className="px-4 pb-2 pt-3 font-semibold text-foreground">상태</th>
                <th className="px-4 pb-2 pt-3 font-semibold text-foreground">생성일</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-foreground/5">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground/60">
                    데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                rows.map((row, i) => (
                  <tr key={`${row.job_id}-${i}`} className="hover:bg-foreground/[0.02] transition-colors">
                    <td className="px-4 py-2.5 font-mono text-muted-foreground">
                      {row.job_id.slice(0, 8)}…
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-2.5 text-foreground/80">
                      {row.channel ?? "—"}
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 tabular-nums text-muted-foreground">
                      {row.created_at ? formatDateTime(row.created_at) : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
