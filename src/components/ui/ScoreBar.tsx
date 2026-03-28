"use client"

interface ScoreBarProps {
  label: string
  /** 0–100 scale */
  score: number
}

export function ScoreBar({ label, score }: ScoreBarProps) {
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
    </div>
  )
}
