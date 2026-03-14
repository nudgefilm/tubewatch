export const ANALYSIS_QUEUE_STATUS = {
  QUEUED: "queued",
  PENDING: "pending",
  PROCESSING: "processing",
  DONE: "done",
  FAILED: "failed",
} as const;

export const ANALYSIS_JOB_STATUS = {
  QUEUED: "queued",
  RUNNING: "running",
  SUCCESS: "success",
  FAILED: "failed",
} as const;

export const ANALYSIS_RESULT_STATUS = {
  ANALYZED: "analyzed",
} as const;

export const ACTIVE_JOB_STATUSES: readonly string[] = [
  ANALYSIS_JOB_STATUS.QUEUED,
  ANALYSIS_JOB_STATUS.RUNNING,
];

/** analysis_queue에서 대기·진행 중으로 간주하는 상태 (queued, pending, processing) */
export const ACTIVE_QUEUE_STATUSES: readonly string[] = [
  ANALYSIS_QUEUE_STATUS.QUEUED,
  ANALYSIS_QUEUE_STATUS.PENDING,
  ANALYSIS_QUEUE_STATUS.PROCESSING,
];