import type { ReactNode } from "react";

type EmptyStateProps = {
  message: string;
  title?: string;
  icon?: ReactNode;
  dashed?: boolean;
  action?: ReactNode;
  /** App-style slate palette; default keeps existing gray/indigo */
  variant?: "default" | "app";
};

/**
 * Application empty state used inside the product UI.
 * Existing behavior preserved for /channels, /analysis, /admin, etc.
 */
export default function EmptyState({
  message,
  title,
  icon,
  dashed = false,
  action,
  variant = "default",
}: EmptyStateProps): JSX.Element {
  const isApp = variant === "app";
  return (
    <div
      className={[
        "rounded-xl bg-white px-6 py-10 text-center",
        dashed
          ? "border-2 border-dashed border-slate-200"
          : "border border-slate-200 shadow-sm",
      ].join(" ")}
    >
      {icon ? (
        <div
          className={
            isApp
              ? "mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500"
              : "mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-indigo-500"
          }
        >
          {icon}
        </div>
      ) : null}
      {title ? (
        <h3
          className={
            isApp
              ? "text-base font-semibold text-slate-900"
              : "text-base font-semibold text-gray-900"
          }
        >
          {title}
        </h3>
      ) : null}
      <p
        className={`${title ? "mt-2" : ""} mx-auto max-w-xs text-sm ${
          isApp ? "text-slate-500" : "text-gray-500"
        }`}
      >
        {message}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

/**
 * Marketing-style empty state aligned with v0 card and typography tokens.
 * Use this for landing / marketing pages to mirror v0 visuals.
 */
export interface MarketingEmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function MarketingEmptyState({
  title,
  description,
  icon,
  action,
}: MarketingEmptyStateProps): JSX.Element {
  return (
    <div className="rounded-2xl border border-foreground/10 bg-background/80 px-6 py-10 text-center shadow-sm">
      {icon ? (
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-foreground/5 text-foreground/80">
          {icon}
        </div>
      ) : null}
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description ? (
        <p className="mt-2 mx-auto max-w-md text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  );
}
