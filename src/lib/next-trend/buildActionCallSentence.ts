import type { NextTrendPageViewModel } from "@/lib/next-trend/nextTrendPageViewModel"

/** 받침 여부에 따라 을/를 반환 */
function eul(word: string): string {
  const code = word.charCodeAt(word.length - 1)
  if (code >= 0xac00 && code <= 0xd7a3) {
    return (code - 0xac00) % 28 !== 0 ? "을" : "를"
  }
  return "을"
}

/** 받침 여부에 따라 으로/로 반환 (ㄹ 받침 → 로) */
function euro(word: string): string {
  const code = word.charCodeAt(word.length - 1)
  if (code >= 0xac00 && code <= 0xd7a3) {
    const j = (code - 0xac00) % 28
    if (j === 0 || j === 8) return "로"
    return "으로"
  }
  return "으로"
}

/**
 * Next Trend ViewModel → 한 줄 액션 문장 생성
 * ex) "금요일에 [ChatGPT 생산성]을 미드폼으로 올리세요."
 */
export function buildActionCallSentence(vm: NextTrendPageViewModel): string | null {
  const topic = vm.internal.candidates[0]?.topic
  if (!topic) return null

  const dayLabel = vm.temporalResonance?.dayLabel
  const fmt = vm.internal.format.recommendedFormat
  const hasFormat = !!fmt && fmt !== "-" && fmt.trim() !== ""

  if (dayLabel && hasFormat) {
    return `${dayLabel}에 [${topic}]${eul(topic)} ${fmt}${euro(fmt)} 올리세요.`
  }
  if (dayLabel) {
    return `${dayLabel}에 [${topic}]${eul(topic)} 바로 올리세요.`
  }
  if (hasFormat) {
    return `[${topic}]${eul(topic)} ${fmt}${euro(fmt)} 지금 올리세요.`
  }
  return `[${topic}]${eul(topic)} 지금 바로 올리세요.`
}
