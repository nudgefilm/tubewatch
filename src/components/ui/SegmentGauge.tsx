"use client"

interface SegmentGaugeProps {
  /** 0–100 scale */
  score: number
  /** 총 세그먼트 수 (기본 10) */
  segments?: number
  /** 게이지 우측 레이블 (기본: 퍼센트). false 전달 시 숨김 */
  label?: string | false
  /** 하단 1줄 해석 문장 */
  hint?: string
  /** 강점(고성과)용: primary, 약점(저성과)용: destructive, 보조용: subtle */
  variant?: "primary" | "destructive" | "subtle"
  /** true 시 블록이 컨테이너 너비에 꽉 차도록 stretch */
  stretch?: boolean
  /** variant 대신 채운 블록 색상을 직접 지정 (예: "bg-sky-400/70 border-sky-400/70") */
  filledClassName?: string
}

export function SegmentGauge({ score, segments = 10, label, hint, variant = "primary", stretch = false, filledClassName }: SegmentGaugeProps) {
  const safe = Math.max(0, Math.min(100, Math.round(score)))
  const filled = Math.round((safe / 100) * segments)
  const displayLabel = label === false ? null : (label ?? `${safe}%`)

  const filledClass = filledClassName ?? (
    variant === "destructive"
      ? "bg-red-500 border-red-500"
      : variant === "subtle"
      ? "bg-primary/40 border-primary/40"
      : "bg-primary border-primary"
  )

  return (
    <div className="space-y-1.5">
      <div className={`flex items-center gap-2${stretch ? " w-full" : ""}`}>
        <div className={`flex gap-1${stretch ? " flex-1" : ""}`}>
          {Array.from({ length: segments }).map((_, i) => (
            <div
              key={i}
              className={`h-2.5 rounded-sm border transition-colors ${stretch ? "flex-1" : "w-2.5"} ${
                i < filled ? filledClass : "border-foreground/25 bg-transparent"
              }`}
            />
          ))}
        </div>
        {displayLabel != null && (
          <span className="text-sm font-semibold tabular-nums shrink-0">
            {displayLabel}
          </span>
        )}
      </div>
      {hint && (
        <p className="text-xs text-muted-foreground leading-snug">{hint}</p>
      )}
    </div>
  )
}
