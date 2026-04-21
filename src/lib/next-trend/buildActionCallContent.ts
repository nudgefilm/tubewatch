import type { NextTrendPageViewModel } from "@/lib/next-trend/nextTrendPageViewModel"

export type ActionCallContent = {
  /** "수요일에" or null */
  timing: string | null
  /** 데이터 기반 스펙 칩: ["#여행 2.4×", "미드폼 8분대", "댓글 +35%"] */
  specs: string[]
  /** 제목 후보 (최대 3개) — titleCandidates 기반 YouTube 제목 형식 */
  titles: string[]
}

export function buildActionCallContent(
  vm: NextTrendPageViewModel
): ActionCallContent | null {
  // ── timing: 요일 ──────────────────────────────────────────────
  const timing = vm.temporalResonance?.dayLabel
    ? `${vm.temporalResonance.dayLabel}에`
    : null

  // ── specs: 태그 효율 · 영상 길이 · 반응도 ─────────────────────
  const specs: string[] = []

  const topTag = vm.tagEfficiency[0]
  if (topTag) {
    const x = topTag.multiplier.toFixed(1)
    specs.push(`#${topTag.tag} ${x}×`)
  }

  const wt = vm.watchTimeCatalyst
  if (wt) {
    const min = Math.round(wt.sweetSpotAvgSec / 60)
    specs.push(`${wt.formatLabel} ${min}분대`)
  }

  const tr = vm.temporalResonance
  if (tr) {
    specs.push(`${tr.metric} +${tr.liftPercent}%`)
  }

  // ── titles: YouTube 제목 후보 ─────────────────────────────────
  // titleCandidates는 AI plan 또는 template 기반 YouTube 제목 형식
  const rawTitles: string[] = vm.internal.actions.titleCandidates ?? []
  const titles = rawTitles
    .filter((t) => t && t.trim() !== "" && t !== "-")
    .slice(0, 3)
    .map((t) => {
      const clean = t.trim().replace(/^["'"']+|["'"']+$/g, "")
      // 65자 초과 시 말줄임
      return clean.length > 65 ? clean.slice(0, 62) + "…" : clean
    })

  if (!timing && specs.length === 0 && titles.length === 0) return null

  return { timing, specs, titles }
}
