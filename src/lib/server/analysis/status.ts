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
  COMPLETED: "completed",
  FAILED: "failed",
} as const;

export const ANALYSIS_RESULT_STATUS = {
  ANALYZED: "analyzed",
} as const;