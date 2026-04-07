import type { AdminMonitorData } from "@/lib/server/admin/getAdminMonitorData";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

function StatusIcon({ status }: { status: "ok" | "warn" | "error" }) {
  if (status === "ok")
    return <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />;
  if (status === "warn")
    return <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />;
  return <XCircle className="h-5 w-5 text-red-500 shrink-0" />;
}

function statusBorder(status: "ok" | "warn" | "error") {
  if (status === "ok") return "border-foreground/10";
  if (status === "warn") return "border-amber-400/40 bg-amber-50/40 dark:bg-amber-950/10";
  return "border-red-400/40 bg-red-50/40 dark:bg-red-950/10";
}

function valueColor(status: "ok" | "warn" | "error") {
  if (status === "ok") return "text-foreground";
  if (status === "warn") return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function overallStatus(items: AdminMonitorData["items"]): "ok" | "warn" | "error" {
  if (items.some((i) => i.status === "error")) return "error";
  if (items.some((i) => i.status === "warn")) return "warn";
  return "ok";
}

export default function AdminMonitorView({ data }: { data: AdminMonitorData }) {
  const overall = overallStatus(data.items);
  const checkedAt = new Date(data.checkedAt).toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">System Monitor</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            기준 시각: {checkedAt} (KST)
          </p>
        </div>
        <div
          className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium ${
            overall === "ok"
              ? "border-emerald-400/40 bg-emerald-50/40 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400"
              : overall === "warn"
                ? "border-amber-400/40 bg-amber-50/40 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400"
                : "border-red-400/40 bg-red-50/40 text-red-700 dark:bg-red-950/20 dark:text-red-400"
          }`}
        >
          <StatusIcon status={overall} />
          {overall === "ok" ? "전체 정상" : overall === "warn" ? "주의 필요" : "오류 감지"}
        </div>
      </div>

      {/* Items grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data.items.map((item) => (
          <div
            key={item.label}
            className={`rounded-xl border p-5 ${statusBorder(item.status)}`}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-foreground leading-snug">
                {item.label}
              </p>
              <StatusIcon status={item.status} />
            </div>
            <p className={`mt-3 font-heading text-3xl font-medium tabular-nums tracking-[-0.03em] ${valueColor(item.status)}`}>
              {item.displayValue ?? item.value.toLocaleString("ko-KR")}
              {!item.displayValue && item.unit && (
                <span className="ml-1 text-base font-normal text-muted-foreground">
                  {item.unit}
                </span>
              )}
            </p>
            <p className="mt-1.5 text-xs text-muted-foreground">{item.description}</p>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 rounded-lg border border-foreground/10 bg-foreground/[0.02] px-4 py-3">
        <p className="text-xs font-medium text-muted-foreground">판정 기준</p>
        <div className="flex flex-wrap gap-x-6 gap-y-1">
          {[
            { icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />, label: "정상" },
            { icon: <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />, label: "주의 (확인 권장)" },
            { icon: <XCircle className="h-3.5 w-3.5 text-red-500" />, label: "위험 (즉시 조치 필요)" },
          ].map(({ icon, label }) => (
            <span key={label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {icon}
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
