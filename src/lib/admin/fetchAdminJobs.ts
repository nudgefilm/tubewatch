import { supabaseAdmin } from "@/lib/supabase/admin";
import type { AdminJobsData, AdminJobRow, JobStatusFilter } from "./types";

type RawJobRow = {
  id: string;
  user_id: string;
  user_channel_id: string;
  status: string;
  created_at: string | null;
  started_at: string | null;
  finished_at: string | null;
  error_message: string | null;
};

const JOBS_PER_PAGE = 50;

export async function fetchAdminJobs(
  statusFilter: JobStatusFilter = "all"
): Promise<AdminJobsData> {
  let query = supabaseAdmin
    .from("analysis_jobs")
    .select("id, user_id, user_channel_id, status, created_at, started_at, finished_at, error_message", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .limit(JOBS_PER_PAGE);

  if (statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  const [jobsResult, authUsersResult] = await Promise.all([
    query,
    supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ]);

  const rawJobs = (jobsResult.data ?? []) as unknown as RawJobRow[];
  const totalCount = jobsResult.count ?? 0;

  const userEmailMap = new Map<string, string>();
  for (const u of authUsersResult.data?.users ?? []) {
    userEmailMap.set(u.id, u.email ?? "—");
  }

  const uniqueChannelIds = Array.from(
    new Set(rawJobs.map((j) => j.user_channel_id))
  );

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

  const jobs: AdminJobRow[] = rawJobs.map((row) => ({
    id: row.id,
    user_id: row.user_id,
    user_channel_id: row.user_channel_id,
    status: row.status,
    created_at: row.created_at,
    started_at: row.started_at,
    finished_at: row.finished_at,
    error_message: row.error_message,
    user_email: userEmailMap.get(row.user_id) ?? "—",
    channel_title: channelTitleMap.get(row.user_channel_id) ?? null,
  }));

  return { jobs, totalCount };
}
