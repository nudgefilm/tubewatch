import { supabaseAdmin } from "@/lib/supabase/admin";
import { ACTIVE_JOB_STATUSES } from "@/lib/server/analysis/status";
import type {
  AdminOverviewData,
  AdminKpi,
  RecentJob,
  RecentUser,
} from "./types";

type JobRow = {
  id: string;
  status: string;
  created_at: string | null;
  user_id: string;
  user_channel_id: string;
  error_message: string | null;
};

export async function fetchAdminOverview(): Promise<AdminOverviewData> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoIso = sevenDaysAgo.toISOString();

  const [
    authUsersResult,
    channelCountResult,
    analysisResultCountResult,
    recentJobsCountResult,
    activeJobsCountResult,
    failedJobsCountResult,
    recentJobsResult,
    recentFailedJobsResult,
  ] = await Promise.all([
    supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 }),

    supabaseAdmin
      .from("user_channels")
      .select("*", { count: "exact", head: true }),

    supabaseAdmin
      .from("analysis_results")
      .select("*", { count: "exact", head: true }),

    supabaseAdmin
      .from("analysis_jobs")
      .select("*", { count: "exact", head: true })
      .gte("created_at", sevenDaysAgoIso),

    supabaseAdmin
      .from("analysis_jobs")
      .select("*", { count: "exact", head: true })
      .in("status", [...ACTIVE_JOB_STATUSES]),

    supabaseAdmin
      .from("analysis_jobs")
      .select("*", { count: "exact", head: true })
      .eq("status", "failed"),

    supabaseAdmin
      .from("analysis_jobs")
      .select("id, status, created_at, user_id, user_channel_id, error_message")
      .order("created_at", { ascending: false })
      .limit(5),

    supabaseAdmin
      .from("analysis_jobs")
      .select("id, status, created_at, user_id, user_channel_id, error_message")
      .eq("status", "failed")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const authUsers = authUsersResult.data?.users ?? [];

  const userEmailMap = new Map<string, string>();
  for (const u of authUsers) {
    userEmailMap.set(u.id, u.email ?? "—");
  }

  const recentUsers: RecentUser[] = [...authUsers]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 5)
    .map((u) => ({
      id: u.id,
      email: u.email ?? "—",
      created_at: u.created_at,
    }));

  const kpi: AdminKpi = {
    totalUsers: authUsers.length,
    totalChannels: channelCountResult.count ?? 0,
    totalAnalysisResults: analysisResultCountResult.count ?? 0,
    recentAnalysisRequests7d: recentJobsCountResult.count ?? 0,
    activeJobs: activeJobsCountResult.count ?? 0,
    failedJobs: failedJobsCountResult.count ?? 0,
  };

  const rawJobs = (recentJobsResult.data ?? []) as unknown as JobRow[];
  const rawFailedJobs = (recentFailedJobsResult.data ?? []) as unknown as JobRow[];

  const allRawJobs = [...rawJobs, ...rawFailedJobs];
  const uniqueChannelIds = Array.from(new Set(allRawJobs.map((j) => j.user_channel_id)));

  const channelTitleMap = new Map<string, string>();
  if (uniqueChannelIds.length > 0) {
    const { data: channelRows } = await supabaseAdmin
      .from("user_channels")
      .select("id, channel_title")
      .in("id", uniqueChannelIds);

    for (const row of (channelRows ?? []) as { id: string; channel_title: string | null }[]) {
      channelTitleMap.set(row.id, row.channel_title ?? "—");
    }
  }

  function enrichJob(row: JobRow): RecentJob {
    return {
      id: row.id,
      status: row.status,
      created_at: row.created_at,
      user_id: row.user_id,
      user_channel_id: row.user_channel_id,
      user_email: userEmailMap.get(row.user_id) ?? "—",
      channel_title: channelTitleMap.get(row.user_channel_id) ?? null,
      error_message: row.error_message,
    };
  }

  const recentJobs: RecentJob[] = rawJobs.map(enrichJob);
  const recentFailedJobs: RecentJob[] = rawFailedJobs.map(enrichJob);

  return { kpi, recentJobs, recentFailedJobs, recentUsers };
}
