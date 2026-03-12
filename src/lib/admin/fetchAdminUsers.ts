import { supabaseAdmin } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/config/admin";
import type { AdminUsersData, AdminUserRow } from "./types";

type ChannelRow = { user_id: string };
type JobRow = { user_id: string; created_at: string | null };

export async function fetchAdminUsers(): Promise<AdminUsersData> {
  const [authUsersResult, channelsResult, jobsResult] = await Promise.all([
    supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    supabaseAdmin.from("user_channels").select("user_id"),
    supabaseAdmin.from("analysis_jobs").select("user_id, created_at"),
  ]);

  const authUsers = authUsersResult.data?.users ?? [];

  const channelRows = (channelsResult.data ?? []) as unknown as ChannelRow[];
  const channelCountMap = new Map<string, number>();
  for (const row of channelRows) {
    channelCountMap.set(row.user_id, (channelCountMap.get(row.user_id) ?? 0) + 1);
  }

  const jobRows = (jobsResult.data ?? []) as unknown as JobRow[];
  const jobCountMap = new Map<string, number>();
  const lastJobMap = new Map<string, string>();
  for (const row of jobRows) {
    jobCountMap.set(row.user_id, (jobCountMap.get(row.user_id) ?? 0) + 1);

    if (row.created_at) {
      const prev = lastJobMap.get(row.user_id);
      if (!prev || row.created_at > prev) {
        lastJobMap.set(row.user_id, row.created_at);
      }
    }
  }

  const users: AdminUserRow[] = authUsers.map((u) => ({
    id: u.id,
    email: u.email ?? "—",
    created_at: u.created_at,
    channelCount: channelCountMap.get(u.id) ?? 0,
    jobCount: jobCountMap.get(u.id) ?? 0,
    lastJobAt: lastJobMap.get(u.id) ?? null,
    isAdmin: isAdmin(u.email),
  }));

  users.sort((a, b) => {
    if (a.lastJobAt && b.lastJobAt) return b.lastJobAt.localeCompare(a.lastJobAt);
    if (a.lastJobAt && !b.lastJobAt) return -1;
    if (!a.lastJobAt && b.lastJobAt) return 1;
    return b.created_at.localeCompare(a.created_at);
  });

  return { users, totalCount: users.length };
}
