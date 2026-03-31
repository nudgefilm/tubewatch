"use client"

interface StatusBarProps {
  /** 0–100 scale */
  score: number
  /** 항목 라벨 */
  label: string
  /** 하단 1줄 해석 문장 */
  hint?: string
}

function getStatus(score: number): { label: string; colorClass: string; barClass: string } {
  if (score >= 70) {
    return { label: "강점", colorClass: "text-emerald-600", barClass: "bg-emerald-500" }
  }
  if (score >= 40) {
    return { label: "보통", colorClass: "text-amber-600", barClass: "bg-amber-400" }
  }
  return { label: "위험", colorClass: "text-red-600", barClass: "bg-red-500" }
}

export function StatusBar({ score, label, hint }: StatusBarProps) {
  const safe = Math.max(0, Math.min(100, Math.round(score)))
  const { label: statusLabel, colorClass, barClass } = getStatus(safe)

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-foreground font-medium">{label}</span>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold ${colorClass}`}>{statusLabel}</span>
          <span className="tabular-nums font-semibold">{safe}</span>
        </div>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={`h-full rounded-full transition-all ${barClass}`}
          style={{ width: `${safe}%` }}
        />
      </div>
      {hint && (
        <p className="text-xs text-muted-foreground leading-snug">{hint}</p>
      )}
    </div>
  )
}
