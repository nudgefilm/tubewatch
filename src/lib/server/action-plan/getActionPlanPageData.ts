import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import {
  getDefaultAnalysisChannelWithClient,
  getUserChannelsForUser,
  type UserChannelRow,
} from "@/lib/analysis/getAnalysisPageData";
import { buildActionPlanSpecFromItems } from "@/lib/action-plan/buildActionPlanSpecFromItems";
import { buildActionItemsFromResult } from "./buildActionItemsFromResult";
import type {
  ActionPlanPageData,
  ActionPlanChannel,
  ActionPlanResultRow,
} from "@/components/action-plan/types";

function mapChannel(row: UserChannelRow): ActionPlanChannel {
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
): Promise<ActionPlanResultRow | null> {
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
    console.error("[getActionPlanPageData] latest successful result error:", error);
    return null;
  }

  if (!data) return null;

  return data as unknown as ActionPlanResultRow;
}

/**
 * @deprecated [STEP 4-3A] channelId 기반 독립 fetch — 사용하지 않는 함수.
 * 모든 데이터는 getAnalysisPageData({ channelId, snapshotId }) 단일 진입점으로 공급해야 한다.
 * TODO(4-3B): 이 함수 및 파일 전체 삭제.
 *
 * 액션 플랜 페이지용 데이터 조회 (구버전).
 */
export async function getActionPlanPageData(
  selectedChannelId?: string
): Promise<ActionPlanPageData | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const channels = await getUserChannelsForUser(supabase, user.id);
  const channelList: ActionPlanChannel[] = channels.map(mapChannel);

  if (channels.length === 0) {
    return {
      channels: channelList,
      selectedChannel: null,
      latestResult: null,
      actions: [],
      specItems: [],
      checklist: { dos: [], donts: [], core_single_action: "" },
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

  const actions = latestResult ? buildActionItemsFromResult(latestResult) : [];
  const { specItems, checklist } = buildActionPlanSpecFromItems(actions, latestResult);

  return {
    channels: channelList,
    selectedChannel: selectedChannel ? mapChannel(selectedChannel) : null,
    latestResult,
    actions,
    specItems,
    checklist,
  };
}
