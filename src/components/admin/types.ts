/**
 * Admin Dashboard 전용 타입.
 * 실제 Supabase 데이터 구조에 맞춤.
 */

export type AdminDashboardKpi = {
  usersCount: number;
  channelsCount: number;
  analysisRunsCount: number;
};

export type AdminQueueRow = {
  job_id: string;
  channel: string | null;
  status: string;
  created_at: string | null;
};

export type AdminFailureRow = {
  channel: string | null;
  error: string | null;
  created_at: string | null;
};

export type AdminDashboardData = {
  kpi: AdminDashboardKpi;
  queueRows: AdminQueueRow[];
  failureRows: AdminFailureRow[];
};
