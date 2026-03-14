import { supabaseAdmin } from "@/lib/supabase/admin";
import type {
  AdminDashboardData,
  AdminDashboardKpi,
  AdminQueueRow,
  AdminFailureRow,
} from "@/components/admin/types";

type QueueDbRow = {
  job_id: string;
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

/**
 * Admin Dashboard용 데이터 조회.
 * - users count, user_channels count, analysis_results count
 * - analysis_queue 최근 10건 (job_id, channel, status, created_at)
 * - analysis_results gemini_status=failed 최근 5건 (channel, error, created_at)
 */
export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const [usersCountRes, channelsCountRes, resultsCountRes, queueRes, failuresRes] =
    await Promise.all([
      supabaseAdmin.from("users").select("*", { count: "exact", head: true }),
      supabaseAdmin
        .from("user_channels")
        .select("*", { count: "exact", head: true }),
      supabaseAdmin
        .from("analysis_results")
        .select("*", { count: "exact", head: true }),
      supabaseAdmin
        .from("analysis_queue")
        .select("job_id, user_channel_id, status, created_at")
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
  };

  const queueData = (queueRes.data ?? []) as unknown as QueueDbRow[];
  const channelIds = Array.from(
    new Set(queueData.map((r) => r.user_channel_id).filter(Boolean))
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

  const queueRows: AdminQueueRow[] = queueData.map((r) => ({
    job_id: r.job_id,
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
