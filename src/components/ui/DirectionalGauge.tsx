"use client"

interface DirectionalGaugeProps {
  /** 0–100 scale. 50 = center. >50 = 강점, <50 = 약점 */
  score: number
  /** 하단 1줄 해석 문장 */
  hint?: string
  /** 강점 방향 레이블 */
  strengthLabel?: string
  /** 약점 방향 레이블 */
  weaknessLabel?: string
}

/**
 * 중앙(50) 기준 양방향 게이지.
 * score > 50 → 오른쪽(강점) 방향으로 채움 (green)
 * score < 50 → 왼쪽(약점) 방향으로 채움 (red)
 * score = 50 → 중앙 단일 블록
 *
 * 10개 블록. 왼쪽 5개 = 약점 구간, 오른쪽 5개 = 강점 구간
 */
export function DirectionalGauge({
  score,
  hint,
  strengthLabel = "강점",
  weaknessLabel = "약점",
}: DirectionalGaugeProps) {
  const safe = Math.max(0, Math.min(100, Math.round(score)))

  // 중앙 기준: 0~50 → 약점 블록 수 (0~5), 50~100 → 강점 블록 수 (0~5)
  const strengthBlocks = safe > 50 ? Math.round((safe - 50) / 10) : 0
  const weaknessBlocks = safe < 50 ? Math.round((50 - safe) / 10) : 0

  const isStrength = safe >= 50
  const displayPct = `${safe}%`

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1">
        {/* 약점 구간 (왼쪽 5칸) */}
        {Array.from({ length: 5 }).map((_, i) => {
          // 약점은 오른쪽(중앙 근처)부터 채워짐 — 인덱스 4가 중앙에 가장 가까움
          const filled = i >= 5 - weaknessBlocks
          return (
            <div
              key={`w-${i}`}
              className={`h-2.5 w-2.5 rounded-sm transition-colors ${
                filled ? "bg-red-500" : "bg-muted"
              }`}
            />
          )
        })}

        {/* 중앙 구분선 */}
        <div className="w-px h-4 bg-border shrink-0 mx-0.5" />

        {/* 강점 구간 (오른쪽 5칸) */}
        {Array.from({ length: 5 }).map((_, i) => {
          // 강점은 왼쪽(중앙 근처)부터 채워짐 — 인덱스 0이 중앙에 가장 가까움
          const filled = i < strengthBlocks
          return (
            <div
              key={`s-${i}`}
              className={`h-2.5 w-2.5 rounded-sm transition-colors ${
                filled ? "bg-emerald-500" : "bg-muted"
              }`}
            />
          )
        })}
      </div>

      {/* 방향 레이블 + 퍼센트 */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="text-red-500 font-medium">{weaknessLabel}</span>
        <span
          className={`font-semibold tabular-nums ${
            isStrength ? "text-emerald-600" : "text-red-600"
          }`}
        >
          {displayPct}
        </span>
        <span className="text-emerald-600 font-medium">{strengthLabel}</span>
      </div>

      {hint && (
        <p className="text-xs text-muted-foreground leading-snug">{hint}</p>
      )}
    </div>
  )
}
