import { supabaseAdmin } from "@/lib/supabase/admin";
import type { AdminJobsData, AdminJobRow, AdminJobsKpi } from "@/components/admin/types";

type QueueDbRow = {
  job_id: string;
  user_channel_id: string | null;
  status: string;
  created_at: string | null;
};

export async function getAdminJobsData(): Promise<AdminJobsData> {
  const [pendingRes, runningRes, completedRes, failedRes, jobsRes] =
    await Promise.all([
      supabaseAdmin
        .from("analysis_queue")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending"),
      supabaseAdmin
        .from("analysis_queue")
        .select("*", { count: "exact", head: true })
        .eq("status", "running"),
      supabaseAdmin
        .from("analysis_queue")
        .select("*", { count: "exact", head: true })
        .eq("status", "completed"),
      supabaseAdmin
        .from("analysis_queue")
        .select("*", { count: "exact", head: true })
        .eq("status", "failed"),
      supabaseAdmin
        .from("analysis_queue")
        .select("job_id, user_channel_id, status, created_at", { count: "exact" })
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

  const kpi: AdminJobsKpi = {
    pending: pendingRes.count ?? 0,
    running: runningRes.count ?? 0,
    completed: completedRes.count ?? 0,
    failed: failedRes.count ?? 0,
  };

  const jobData = (jobsRes.data ?? []) as QueueDbRow[];

  const channelIds = Array.from(
    new Set(jobData.map((r) => r.user_channel_id).filter((id): id is string => !!id))
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

  const rows: AdminJobRow[] = jobData.map((r) => ({
    job_id: r.job_id,
    channel: r.user_channel_id ? (channelTitleMap.get(r.user_channel_id) ?? null) : null,
    status: r.status,
    created_at: r.created_at,
  }));

  return { kpi, rows, total: jobsRes.count ?? rows.length };
}
