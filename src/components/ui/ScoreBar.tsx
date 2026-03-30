"use client"

interface ScoreBarProps {
  label: string
  /** 0–100 scale */
  score: number
  /** 점수 아래 해석 문장 (선택) */
  hint?: string
}

export function ScoreBar({ label, score, hint }: ScoreBarProps) {
  const safe = Math.max(0, Math.min(100, Math.round(score)))
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">{safe}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${safe}%` }}
        />
      </div>
      {hint && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  )
}
