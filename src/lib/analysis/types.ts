/**
 * 메뉴별 분석 실행·표시 상태 (베이스 분석 + 확장 run 공통)
 */
export type AnalysisStatus =
  | "not_started"
  | "ready_from_base"
  | "needs_refresh"
  /** DB `analysis_runs.status === "queued"` — 워커/큐 대기 */
  | "queued"
  | "running"
  | "completed"
  | "failed";
