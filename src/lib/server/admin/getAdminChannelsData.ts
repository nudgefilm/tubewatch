import { supabaseAdmin } from "@/lib/supabase/admin";
import type { AdminChannelsData, AdminChannelRow } from "@/components/admin/types";

type ChannelDbRow = {
  id: string;
  channel_title: string | null;
  channel_id: string | null;
  subscriber_count: number | null;
  video_count: number | null;
  user_id: string | null;
  last_analyzed_at: string | null;
  created_at: string | null;
};

export async function getAdminChannelsData(): Promise<AdminChannelsData> {
  const { data: channelRows, count } = await supabaseAdmin
    .from("user_channels")
    .select(
      "id, channel_title, channel_id, subscriber_count, video_count, user_id, last_analyzed_at, created_at",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .limit(100);

  const channels = (channelRows ?? []) as ChannelDbRow[];

  // collect unique user_ids to map email
  const userIds = Array.from(
    new Set(channels.map((c) => c.user_id).filter((id): id is string => !!id))
  );

  const emailMap = new Map<string, string>();
  if (userIds.length > 0) {
    const authRes = await supabaseAdmin.auth.admin.listUsers({ perPage: 200 });
    for (const u of authRes.data?.users ?? []) {
      if (userIds.includes(u.id)) {
        emailMap.set(u.id, u.email ?? "—");
      }
    }
  }

  const rows: AdminChannelRow[] = channels.map((c) => ({
    id: c.id,
    channel_title: c.channel_title,
    youtube_channel_id: c.channel_id,
    subscriber_count: c.subscriber_count,
    video_count: c.video_count,
    owner_email: c.user_id ? (emailMap.get(c.user_id) ?? null) : null,
    last_analyzed_at: c.last_analyzed_at,
    created_at: c.created_at,
  }));

  return { rows, total: count ?? rows.length };
}
