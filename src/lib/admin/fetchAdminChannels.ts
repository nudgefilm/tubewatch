import { supabaseAdmin } from "@/lib/supabase/admin";
import type { AdminChannelsData, AdminChannelRow } from "./types";

type ChannelRow = {
  id: string;
  user_id: string;
  channel_title: string | null;
  subscriber_count: number | null;
  created_at: string | null;
};

type JobRow = {
  user_channel_id: string;
  status: string;
  created_at: string | null;
};

type ChannelJobAgg = {
  count: number;
  latestAt: string | null;
  latestStatus: string | null;
};

export async function fetchAdminChannels(): Promise<AdminChannelsData> {
  const [channelsResult, authUsersResult, jobsResult] = await Promise.all([
    supabaseAdmin
      .from("user_channels")
      .select("id, user_id, channel_title, subscriber_count, created_at"),
    supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    supabaseAdmin
      .from("analysis_jobs")
      .select("user_channel_id, status, created_at"),
  ]);

  const rawChannels = (channelsResult.data ?? []) as unknown as ChannelRow[];

  const userEmailMap = new Map<string, string>();
  for (const u of authUsersResult.data?.users ?? []) {
    userEmailMap.set(u.id, u.email ?? "—");
  }

  const jobAggMap = new Map<string, ChannelJobAgg>();
  for (const row of (jobsResult.data ?? []) as unknown as JobRow[]) {
    const existing = jobAggMap.get(row.user_channel_id);
    if (!existing) {
      jobAggMap.set(row.user_channel_id, {
        count: 1,
        latestAt: row.created_at,
        latestStatus: row.status,
      });
    } else {
      existing.count += 1;
      if (row.created_at && (!existing.latestAt || row.created_at > existing.latestAt)) {
        existing.latestAt = row.created_at;
        existing.latestStatus = row.status;
      }
    }
  }

  const channels: AdminChannelRow[] = rawChannels.map((ch) => {
    const agg = jobAggMap.get(ch.id);
    return {
      id: ch.id,
      channel_title: ch.channel_title,
      owner_email: userEmailMap.get(ch.user_id) ?? "—",
      subscriber_count: ch.subscriber_count,
      created_at: ch.created_at,
      lastJobAt: agg?.latestAt ?? null,
      lastJobStatus: agg?.latestStatus ?? null,
      jobCount: agg?.count ?? 0,
    };
  });

  channels.sort((a, b) => {
    if (a.lastJobAt && b.lastJobAt) return b.lastJobAt.localeCompare(a.lastJobAt);
    if (a.lastJobAt && !b.lastJobAt) return -1;
    if (!a.lastJobAt && b.lastJobAt) return 1;
    const aCreated = a.created_at ?? "";
    const bCreated = b.created_at ?? "";
    return bCreated.localeCompare(aCreated);
  });

  return { channels, totalCount: channels.length };
}
