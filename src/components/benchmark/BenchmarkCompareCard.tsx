import type { BenchmarkCompareItem } from "./types";

type BenchmarkCompareCardProps = {
  item: BenchmarkCompareItem;
};

function getStatusClass(status: string): string {
  if (status === "기준 이상") return "border-emerald-200 bg-emerald-50/50 text-emerald-800";
  if (status === "근접") return "border-amber-200 bg-amber-50/50 text-amber-800";
  return "border-slate-200 bg-slate-50/50 text-slate-700";
}

export default function BenchmarkCompareCard({
  item,
}: BenchmarkCompareCardProps): JSX.Element {
  const statusClass = getStatusClass(item.status_label);

  return (
    <div
      className={`rounded-xl border p-4 shadow-sm ${statusClass}`}
    >
      <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">
        {item.title}
      </h3>
      <div className="mt-2 flex flex-wrap items-baseline gap-2">
        <span className="text-2xl font-bold tabular-nums text-slate-900">
          {item.current_score}
        </span>
        <span className="text-sm text-slate-500">
          / {item.benchmark_score}점 기준
        </span>
      </div>
      <p className="mt-1.5 text-xs font-medium text-slate-600">
        {item.status_label}
      </p>
    </div>
  );
}
