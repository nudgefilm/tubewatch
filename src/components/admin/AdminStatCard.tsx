import type { ReactNode } from "react";

type AdminStatCardProps = {
  label: string;
  value: number | string;
  subtitle?: string;
  secondary?: string;
  variant?: "default" | "danger" | "highlight" | "success";
};

export default function AdminStatCard({
  label,
  value,
  subtitle,
  secondary,
  variant = "default",
}: AdminStatCardProps): JSX.Element {
  const displayValue: ReactNode =
    typeof value === "number" ? value.toLocaleString("ko-KR") : value;

  const valueColor =
    variant === "success"
      ? "text-green-500"
      : variant === "danger" && typeof value === "number" && value > 0
        ? "text-red-500"
        : variant === "highlight"
          ? "text-primary"
          : "text-foreground";

  return (
    <div className="rounded-xl border border-foreground/10 bg-foreground/[0.02] p-5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      {subtitle ? (
        <p className="mt-0.5 text-[10px] text-muted-foreground/60">{subtitle}</p>
      ) : null}
      <p className={`mt-2 font-heading text-3xl font-medium tabular-nums tracking-[-0.03em] ${valueColor}`}>
        {displayValue}
      </p>
      {secondary ? (
        <p className="mt-1 text-[10px] text-muted-foreground/60">{secondary}</p>
      ) : null}
    </div>
  );
}
