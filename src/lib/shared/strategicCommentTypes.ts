/**
 * TubeWatch 전략 코멘트 공통 타입
 * 모든 하위 페이지 ViewModel에서 이 타입을 사용해 strategicComment 필드를 채운다.
 */
export type StrategicCommentVm = {
  /** 한 줄 핵심 판단 — 사용자가 가장 먼저 읽는 문장 */
  headline: string
  /** 2-4문장 전략 요약 — 추상적 리포트가 아닌 이해 가능한 문장으로 */
  summary: string
  /** 핵심 takeaway 칩 (2-4개) */
  keyTakeaways: string[]
  /** 지금 실행할 포인트 (선택) */
  priorityAction: string | null
  /** 주의 포인트 (선택) */
  caution: string | null
}
