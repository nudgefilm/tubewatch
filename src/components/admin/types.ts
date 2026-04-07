/**
 * Admin Dashboard 전용 타입.
 * 실제 Supabase 데이터 구조에 맞춤.
 */

export type AdminDashboardKpi = {
  usersCount: number;
  channelsCount: number;
  analysisRunsCount: number;
  failedJobsCount: number;
  activeSubscribersCount: number;
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

// ── Users ──────────────────────────────────────────────
export type AdminUserRow = {
  id: string;
  email: string | null;
  display_name: string | null;
  created_at: string | null;
  last_sign_in_at: string | null;
  channel_count: number;
  role: string | null;
  lifetime_analyses_used: number | null;
  purchased_credits: number | null;
  plan_id: string | null;
  subscription_status: string | null;
  total_analyses_count: number;
};

export type AdminUsersData = {
  rows: AdminUserRow[];
  total: number;
};

// ── Channels ───────────────────────────────────────────
export type AdminChannelRow = {
  id: string;
  channel_title: string | null;
  youtube_channel_id: string | null;
  subscriber_count: number | null;
  video_count: number | null;
  owner_email: string | null;
  last_analyzed_at: string | null;
  created_at: string | null;
};

export type AdminChannelsData = {
  rows: AdminChannelRow[];
  total: number;
};

// ── Jobs ───────────────────────────────────────────────
export type AdminJobRow = {
  job_id: string;
  channel: string | null;
  status: string;
  created_at: string | null;
};

export type AdminJobsKpi = {
  pending: number;
  running: number;
  completed: number;
  failed: number;
};

export type AdminJobsData = {
  kpi: AdminJobsKpi;
  rows: AdminJobRow[];
  total: number;
};
