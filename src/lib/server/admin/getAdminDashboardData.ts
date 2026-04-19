import { supabaseAdmin } from "@/lib/supabase/admin";
import type {
  AdminDashboardData,
  AdminDashboardKpi,
  AdminQueueRow,
  AdminFailureRow,
} from "@/components/admin/types";

type JobDbRow = {
  id: string;
  user_channel_id: string;
  status: string;
  created_at: string | null;
};

type FailureDbRow = {
  channel_title: string | null;
  created_at: string | null;
  gemini_raw_json: string | null;
};

function truncateError(raw: string | null, maxLen: number): string | null {
  if (raw == null || raw === "") return null;
  const s = String(raw).trim();
  if (s.length <= maxLen) return s;
  return s.slice(0, maxLen) + "…";
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const [
    usersCountRes,
    channelsCountRes,
    resultsCountRes,
    failedJobsRes,
    activeSubsRes,
    jobsRes,
    failuresRes,
  ] = await Promise.all([
    supabaseAdmin.from("users").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("user_channels").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("analysis_results").select("*", { count: "exact", head: true }),
    supabaseAdmin
      .from("analysis_jobs")
      .select("*", { count: "exact", head: true })
      .eq("status", "failed"),
    supabaseAdmin
      .from("user_subscriptions")
      .select("*", { count: "exact", head: true })
      .in("subscription_status", ["active", "trialing"]),
    supabaseAdmin
      .from("analysis_jobs")
      .select("id, user_channel_id, status, created_at")
      .order("created_at", { ascending: false })
      .limit(10),
    supabaseAdmin
      .from("analysis_results")
      .select("channel_title, created_at, gemini_raw_json")
      .eq("gemini_status", "failed")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const kpi: AdminDashboardKpi = {
    usersCount: usersCountRes.count ?? 0,
    channelsCount: channelsCountRes.count ?? 0,
    analysisRunsCount: resultsCountRes.count ?? 0,
    failedJobsCount: failedJobsRes.count ?? 0,
    activeSubscribersCount: activeSubsRes.count ?? 0,
  };

  const jobData = (jobsRes.data ?? []) as unknown as JobDbRow[];
  const channelIds = Array.from(
    new Set(jobData.map((r) => r.user_channel_id).filter(Boolean))
  );

  const channelTitleMap = new Map<string, string>();
  if (channelIds.length > 0) {
    const { data: channelRows } = await supabaseAdmin
      .from("user_channels")
      .select("id, channel_title")
      .in("id", channelIds);

    for (const row of (channelRows ?? []) as { id: string; channel_title: string | null }[]) {
      channelTitleMap.set(row.id, row.channel_title ?? "—");
    }
  }

  const queueRows: AdminQueueRow[] = jobData.map((r) => ({
    job_id: r.id,
    channel: r.user_channel_id ? channelTitleMap.get(r.user_channel_id) ?? null : null,
    status: r.status,
    created_at: r.created_at,
  }));

  const failureData = (failuresRes.data ?? []) as unknown as FailureDbRow[];
  const failureRows: AdminFailureRow[] = failureData.map((r) => ({
    channel: r.channel_title,
    error: truncateError(r.gemini_raw_json, 120),
    created_at: r.created_at,
  }));

  return { kpi, queueRows, failureRows };
}
