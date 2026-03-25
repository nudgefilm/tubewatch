import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import {
  getDefaultAnalysisChannelWithClient,
  getUserChannelsForUser,
  type UserChannelRow,
} from "@/lib/analysis/getAnalysisPageData";
import { buildSeoLabSpecViewModel } from "@/lib/seo-lab/buildSeoLabSpecViewModel";
import { buildSeoLabItemsFromResult } from "./buildSeoLabItemsFromResult";
import type {
  SeoLabPageData,
  SeoLabChannel,
  SeoLabResultRow,
} from "@/components/seo-lab/types";

function mapChannel(row: UserChannelRow): SeoLabChannel {
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
): Promise<SeoLabResultRow | null> {
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
    console.error("[getSeoLabPageData] latest successful result error:", error);
    return null;
  }

  if (!data) return null;

  return data as unknown as SeoLabResultRow;
}

/**
 * SEO 랩 페이지용 데이터 조회.
 * - 현재 사용자 user_channels 목록
 * - 선택 채널(쿼리 또는 최근 분석 채널)
 * - 해당 채널의 최신 성공 분석 1건
 * - SEO 카드 3개 (결과 있으면 매핑, 없으면 빈 배열)
 */
export async function getSeoLabPageData(
  selectedChannelId?: string
): Promise<SeoLabPageData | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const channels = await getUserChannelsForUser(supabase, user.id);
  const channelList: SeoLabChannel[] = channels.map(mapChannel);

  if (channels.length === 0) {
    return {
      channels: channelList,
      selectedChannel: null,
      latestResult: null,
      cards: [],
      spec: buildSeoLabSpecViewModel(null, null),
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

  const cards = latestResult ? buildSeoLabItemsFromResult(latestResult) : [];
  const spec = buildSeoLabSpecViewModel(
    latestResult,
    selectedChannel?.channel_title ?? null
  );

  return {
    channels: channelList,
    selectedChannel: selectedChannel ? mapChannel(selectedChannel) : null,
    latestResult,
    cards,
    spec,
  };
}
