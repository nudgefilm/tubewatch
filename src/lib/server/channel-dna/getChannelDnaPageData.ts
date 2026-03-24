import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import {
  getDefaultAnalysisChannelWithClient,
  getUserChannelsForUser,
  type UserChannelRow,
} from "@/lib/analysis/getAnalysisPageData";
import {
  buildChannelDnaCompareItems,
  buildChannelDnaSummaries,
} from "./buildChannelDnaCompareItems";
import type {
  ChannelDnaPageData,
  ChannelDnaChannel,
  ChannelDnaResultRow,
} from "@/components/channel-dna/channelDnaPageTypes";

function mapChannel(row: UserChannelRow): ChannelDnaChannel {
  return {
    id: row.id,
    channel_title: row.channel_title ?? null,
    thumbnail_url: row.thumbnail_url ?? null,
    subscriber_count: row.subscriber_count ?? null,
    created_at: row.created_at ?? null,
    last_analyzed_at: row.last_analyzed_at ?? null,
  };
}

/**
 * user_channel_id 기준 최신 성공 분석 1건만 조회.
 * status=analyzed, gemini_status=success.
 */
async function getLatestSuccessfulResult(
  supabase: SupabaseClient,
  userChannelId: string,
  userId: string
): Promise<ChannelDnaResultRow | null> {
  const { data, error } = await supabase
    .from("analysis_results")
    .select("*")
    .eq("user_id", userId)
    .eq("user_channel_id", userChannelId)
    .eq("status", "analyzed")
    .eq("gemini_status", "success")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[getChannelDnaPageData] latest successful result error:", error);
    return null;
  }

  if (!data) return null;

  return data as unknown as ChannelDnaResultRow;
}

/**
 * 채널 DNA 페이지용 데이터 조회.
 */
export async function getChannelDnaPageData(
  selectedChannelId?: string
): Promise<ChannelDnaPageData | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const channels = await getUserChannelsForUser(supabase, user.id);
  const channelList: ChannelDnaChannel[] = channels.map(mapChannel);

  if (channels.length === 0) {
    return {
      channels: channelList,
      selectedChannel: null,
      latestResult: null,
      compareItems: [],
      summaries: ["아직 비교 데이터가 충분하지 않습니다."],
    };
  }

  let selectedChannel: UserChannelRow | null = null;
  if (selectedChannelId) {
    selectedChannel = channels.find((c) => c.id === selectedChannelId) ?? null;
  }
  if (!selectedChannel) {
    selectedChannel = await getDefaultAnalysisChannelWithClient(supabase, user.id, channels);
  }

  const latestResult = selectedChannel
    ? await getLatestSuccessfulResult(supabase, selectedChannel.id, user.id)
    : null;

  const compareItems = latestResult
    ? buildChannelDnaCompareItems(latestResult)
    : [];
  const summaries =
    compareItems.length > 0
      ? buildChannelDnaSummaries(compareItems)
      : ["아직 비교 데이터가 충분하지 않습니다."];

  return {
    channels: channelList,
    selectedChannel: selectedChannel ? mapChannel(selectedChannel) : null,
    latestResult,
    compareItems,
    summaries,
  };
}
