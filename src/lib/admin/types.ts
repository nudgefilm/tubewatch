// ── Admin Dashboard Types ──

export type AdminKpi = {
  totalUsers: number;
  totalChannels: number;
  totalAnalysisResults: number;
  recentAnalysisRequests7d: number;
  activeJobs: number;
  failedJobs: number;
};

export type RecentJob = {
  id: string;
  status: string;
  created_at: string | null;
  user_id: string;
  user_channel_id: string;
  user_email: string;
  channel_title: string | null;
  error_message: string | null;
};

export type RecentUser = {
  id: string;
  email: string;
  created_at: string;
};

export type AdminOverviewData = {
  kpi: AdminKpi;
  recentJobs: RecentJob[];
  recentFailedJobs: RecentJob[];
  recentUsers: RecentUser[];
};

// ── Admin Jobs Page ──

export type AdminJobRow = {
  id: string;
  user_id: string;
  user_channel_id: string;
  status: string;
  created_at: string | null;
  started_at: string | null;
  finished_at: string | null;
  error_message: string | null;
  user_email: string;
  channel_title: string | null;
};

export type JobStatusFilter = "all" | "queued" | "running" | "success" | "failed";

export const JOB_STATUS_FILTERS: readonly JobStatusFilter[] = [
  "all",
  "queued",
  "running",
  "success",
  "failed",
];

export type AdminJobsData = {
  jobs: AdminJobRow[];
  totalCount: number;
};

// ── Admin Users Page ──

export type AdminUserRow = {
  id: string;
  email: string;
  created_at: string;
  channelCount: number;
  jobCount: number;
  lastJobAt: string | null;
  isAdmin: boolean;
};

export type AdminUsersData = {
  users: AdminUserRow[];
  totalCount: number;
};

// ── Admin Channels Page ──

export type AdminChannelRow = {
  id: string;
  channel_title: string | null;
  owner_email: string;
  subscriber_count: number | null;
  created_at: string | null;
  lastJobAt: string | null;
  lastJobStatus: string | null;
  jobCount: number;
};

export type AdminChannelsData = {
  channels: AdminChannelRow[];
  totalCount: number;
};

// ── Admin Metrics Page ──

export type MetricsKpi = {
  requests7d: number;
  success7d: number;
  failed7d: number;
  requests30d: number;
  success30d: number;
  failed30d: number;
};

export type DailyMetricRow = {
  date: string;
  total: number;
  success: number;
  failed: number;
};

export type AdminMetricsData = {
  kpi: MetricsKpi;
  daily: DailyMetricRow[];
};
