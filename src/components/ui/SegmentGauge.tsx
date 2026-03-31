"use client"

interface SegmentGaugeProps {
  /** 0–100 scale */
  score: number
  /** 게이지 우측 레이블 (기본: 퍼센트) */
  label?: string
  /** 하단 1줄 해석 문장 */
  hint?: string
  /** 강점(고성과)용: primary, 약점(저성과)용: destructive */
  variant?: "primary" | "destructive"
}

export function SegmentGauge({ score, label, hint, variant = "primary" }: SegmentGaugeProps) {
  const safe = Math.max(0, Math.min(100, Math.round(score)))
  const filled = Math.round(safe / 10)
  const displayLabel = label ?? `${safe}%`

  const filledClass =
    variant === "destructive"
      ? "bg-red-500"
      : "bg-primary"

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-[3px] flex-1">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className={`h-3 flex-1 rounded-sm transition-colors ${
                i < filled ? filledClass : "bg-muted"
              }`}
            />
          ))}
        </div>
        <span className="text-sm font-semibold tabular-nums w-10 text-right shrink-0">
          {displayLabel}
        </span>
      </div>
      {hint && (
        <p className="text-xs text-muted-foreground leading-snug">{hint}</p>
      )}
    </div>
  )
}
