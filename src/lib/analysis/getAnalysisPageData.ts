import { createClient } from "@/lib/supabase/server";
import { buildYoutubeFeatureAccessSnapshot } from "@/lib/auth/featureAccess";
import type { YoutubeFeatureAccessSnapshot } from "@/lib/auth/youtubeVerificationTypes";
import {
  fetchAnalysisRunsForUserChannel,
  type AnalysisRunRecord,
} from "@/lib/analysis/analysisRun";

export type UserChannelRow = {
  id: string;
  user_id?: string;
  channel_id?: string | null;
  channel_title?: string | null;
  thumbnail_url?: string | null;
  subscriber_count?: number | null;
  view_count?: number | null;
  video_count?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  last_analysis_requested_at?: string | null;
  last_analyzed_at?: string | null;
};

export type AnalysisResultRow = {
  id: string;
  user_channel_id: string;
  user_id?: string;
  created_at?: string | null;
  updated_at?: string | null;

  // 현재 analysis_results에 어떤 컬럼이 들어있든 최대한 호환되도록 유연하게 둡니다.
  [key: string]: unknown;
};

export type AnalysisPageData = {
  userId: string;
  channels: UserChannelRow[];
  selectedChannel: UserChannelRow | null;
  latestResult: AnalysisResultRow | null;
  /** 선택 채널 기준 최근 분석 결과(최신순, 리포트 이력·비교용) */
  recentAnalysisResults: AnalysisResultRow[];
  /**
   * `null` — analysis_runs 조회 전이거나 아직 로드하지 않음(placeholder fetch).
   * `[]` — 조회 완료, 해당 채널에 저장된 run 없음.
   */
  analysisRuns: AnalysisRunRecord[] | null;
  /** YouTube `channels.list?mine=true` 기반 핵심 기능(분석 실행) 가드 */
  youtubeFeatureAccess: YoutubeFeatureAccessSnapshot;
};

async function getAuthenticatedUserId() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user.id;
}

export async function getUserChannels(): Promise<UserChannelRow[]> {
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return [];
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("user_channels")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[getUserChannels] error:", error);
    return [];
  }

  return (data ?? []) as UserChannelRow[];
}

export async function getLatestAnalysisResultByUserChannelId(
  userChannelId: string
): Promise<AnalysisResultRow | null> {
  const userId = await getAuthenticatedUserId();

  if (!userId || !userChannelId) {
    return null;
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("analysis_results")
    .select("*")
    .eq("user_id", userId)
    .eq("user_channel_id", userChannelId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[getLatestAnalysisResultByUserChannelId] error:", error);
    return null;
  }

  return (data as AnalysisResultRow | null) ?? null;
}

export async function getRecentAnalysisResultsByUserChannelId(
  userChannelId: string,
  limit = 20
): Promise<AnalysisResultRow[]> {
  const userId = await getAuthenticatedUserId();

  if (!userId || !userChannelId) {
    return [];
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("analysis_results")
    .select("*")
    .eq("user_id", userId)
    .eq("user_channel_id", userChannelId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return [];
  }

  return (data ?? []) as AnalysisResultRow[];
}

export async function getLatestAnalysisResultMap(
  userChannelIds: string[]
): Promise<Record<string, AnalysisResultRow | null>> {
  const userId = await getAuthenticatedUserId();

  if (!userId || userChannelIds.length === 0) {
    return {};
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("analysis_results")
    .select("*")
    .eq("user_id", userId)
    .in("user_channel_id", userChannelIds)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getLatestAnalysisResultMap] error:", error);
    return {};
  }

  const resultMap: Record<string, AnalysisResultRow | null> = {};

  for (const channelId of userChannelIds) {
    resultMap[channelId] = null;
  }

  for (const row of (data ?? []) as AnalysisResultRow[]) {
    const channelId = row.user_channel_id;
    if (!channelId) continue;

    // created_at desc 상태이므로 첫 번째 row만 최신값으로 채택
    if (!resultMap[channelId]) {
      resultMap[channelId] = row;
    }
  }

  return resultMap;
}

export async function getDefaultAnalysisChannel(
  channels: UserChannelRow[]
): Promise<UserChannelRow | null> {
  if (channels.length === 0) {
    return null;
  }

  const latestResultMap = await getLatestAnalysisResultMap(
    channels.map((channel) => channel.id)
  );

  // 우선순위
  // 1) 최신 분석 결과가 있는 채널
  // 2) 없다면 첫 등록 채널
  const channelsWithLatestAnalysis = channels
    .map((channel) => ({
      channel,
      latestResult: latestResultMap[channel.id],
    }))
    .filter((item) => item.latestResult)
    .sort((a, b) => {
      const aCreatedAt = a.latestResult?.created_at
        ? new Date(a.latestResult.created_at).getTime()
        : 0;
      const bCreatedAt = b.latestResult?.created_at
        ? new Date(b.latestResult.created_at).getTime()
        : 0;

      return bCreatedAt - aCreatedAt;
    });

  if (channelsWithLatestAnalysis.length > 0) {
    return channelsWithLatestAnalysis[0].channel;
  }

  return channels[0];
}

export async function getAnalysisPageData(
  selectedChannelId?: string
): Promise<AnalysisPageData | null> {
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return null;
  }

  const youtubeFeatureAccess = await buildYoutubeFeatureAccessSnapshot();
  const supabase = await createClient();

  const channels = await getUserChannels();

  if (channels.length === 0) {
    return {
      userId,
      channels: [],
      selectedChannel: null,
      latestResult: null,
      recentAnalysisResults: [],
      analysisRuns: [],
      youtubeFeatureAccess,
    };
  }

  let selectedChannel: UserChannelRow | null = null;

  if (selectedChannelId) {
    selectedChannel =
      channels.find((channel) => channel.id === selectedChannelId) ?? null;
  }

  if (!selectedChannel) {
    selectedChannel = await getDefaultAnalysisChannel(channels);
  }

  const latestResult = selectedChannel
    ? await getLatestAnalysisResultByUserChannelId(selectedChannel.id)
    : null;

  const recentAnalysisResults = selectedChannel
    ? await getRecentAnalysisResultsByUserChannelId(selectedChannel.id, 20)
    : [];

  const runsRaw = selectedChannel
    ? await fetchAnalysisRunsForUserChannel(
        supabase,
        userId,
        selectedChannel.id
      )
    : null;

  const analysisRuns: AnalysisRunRecord[] | null =
    runsRaw === null ? null : [...runsRaw];

  return {
    userId,
    channels,
    selectedChannel,
    latestResult,
    recentAnalysisResults,
    analysisRuns,
    youtubeFeatureAccess,
  };
}