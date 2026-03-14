import type { ReactNode } from "react";

type AdminStatCardProps = {
  label: string;
  value: number | string;
  subtitle?: string;
};

export default function AdminStatCard({
  label,
  value,
  subtitle,
}: AdminStatCardProps): JSX.Element {
  const displayValue: ReactNode =
    typeof value === "number" ? value.toLocaleString("ko-KR") : value;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      {subtitle ? (
        <p className="mt-0.5 text-[10px] text-gray-400">{subtitle}</p>
      ) : null}
      <p className="mt-1 text-2xl font-semibold tabular-nums text-gray-900">
        {displayValue}
      </p>
    </div>
  );
}
