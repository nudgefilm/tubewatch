import * as React from "react"

type BadgeVariant = "default" | "outline" | "secondary" | "destructive"

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant
}

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps): JSX.Element {
  const base =
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors"
  const styles: Record<BadgeVariant, string> = {
    default: "border-transparent bg-slate-900 text-slate-50",
    outline: "border-slate-200 bg-slate-50 text-slate-700",
    secondary: "border-transparent bg-slate-100 text-slate-900",
    destructive: "border-transparent bg-red-500 text-white",
  }

  return (
    <span
      className={[base, styles[variant], className ?? ""].join(" ")}
      {...props}
    />
  )
}
