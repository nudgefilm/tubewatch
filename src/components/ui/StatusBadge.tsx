export type StatusBadgeStatus = "queued" | "running" | "completed" | "failed";

const STATUS_CONFIG: Record<
  StatusBadgeStatus,
  { className: string; subtle: string; label: string }
> = {
  queued: {
    className: "bg-yellow-100 text-yellow-700",
    subtle: "bg-slate-100 text-slate-600",
    label: "대기 중",
  },
  running: {
    className: "bg-blue-100 text-blue-700",
    subtle: "bg-slate-100 text-slate-700",
    label: "진행 중",
  },
  completed: {
    className: "bg-green-100 text-green-700",
    subtle: "bg-slate-100 text-slate-700",
    label: "완료",
  },
  failed: {
    className: "bg-red-100 text-red-700",
    subtle: "bg-slate-100 text-slate-600",
    label: "실패",
  },
};

/**
 * Maps API/DB analysis status (and optional gemini_status) to StatusBadgeStatus.
 * Use when displaying analysis_results.status or job status in the UI.
 */
export function toStatusBadgeStatus(
  status: string | null | undefined,
  geminiStatus?: string | null
): StatusBadgeStatus {
  if (status === "analyzed" || geminiStatus === "success") return "completed";
  if (status === "failed" || geminiStatus === "failed") return "failed";
  if (status === "queued") return "queued";
  if (
    status === "running" ||
    status === "processing" ||
    geminiStatus === "processing"
  ) {
    return "running";
  }
  return "queued";
}

export interface StatusBadgeProps {
  status: StatusBadgeStatus;
  /** Use subtle slate tones for app UI */
  variant?: "default" | "subtle";
}

/**
 * Application status badge used across the TubeWatch product UI.
 * Existing behavior preserved for analysis/admin surfaces.
 */
export function StatusBadge({
  status,
  variant = "default",
}: StatusBadgeProps): JSX.Element {
  const config = STATUS_CONFIG[status];
  const className =
    variant === "subtle" ? config.subtle : config.className;
  return (
    <span
      className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ${className}`}
    >
      {config.label}
    </span>
  );
}

export type MarketingStatusVariant =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info";

export interface MarketingStatusBadgeProps {
  label: string;
  variant?: MarketingStatusVariant;
}

const VARIANT_CLASSNAMES: Record<MarketingStatusVariant, string> = {
  default: "bg-foreground/5 text-muted-foreground",
  success: "bg-emerald-500/10 text-emerald-600",
  warning: "bg-amber-500/10 text-amber-600",
  danger: "bg-red-500/10 text-red-600",
  info: "bg-blue-500/10 text-blue-600",
};

/**
 * Small marketing status/label pill aligned with v0 tokens.
 * Uses subtle neutral background by default and soft semantic tints for variants.
 */
export function MarketingStatusBadge({
  label,
  variant = "default",
}: MarketingStatusBadgeProps): JSX.Element {
  const variantClass = VARIANT_CLASSNAMES[variant];
  return (
    <span
      className={[
        "inline-flex items-center rounded-full",
        "px-2.5 py-0.5 text-[11px] font-medium",
        "uppercase tracking-[0.12em]",
        variantClass,
      ].join(" ")}
    >
      {label}
    </span>
  );
}
