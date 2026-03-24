import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
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

/** `buildYoutubeFeatureAccessSnapshot()` 로그인 성공 시와 동일(추가 네트워크 없이 재사용). */
const CORE_LOGGED_IN_YOUTUBE_ACCESS: YoutubeFeatureAccessSnapshot = {
  canUseCoreAnalysisFeatures: true,
  profile: null,
  liveCheck: null,
  ui: {
    variant: "verified",
    badgeLabel: "분석 준비",
    message: "등록한 채널에 대해 분석을 실행할 수 있습니다.",
    detail: null,
  },
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

async function getLatestAnalysisResultMapWithClient(
  supabase: SupabaseClient,
  userId: string,
  userChannelIds: string[]
): Promise<Record<string, AnalysisResultRow | null>> {
  if (userChannelIds.length === 0) {
    return {};
  }

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

async function fetchLatestResultForChannel(
  supabase: SupabaseClient,
  userId: string,
  userChannelId: string
): Promise<AnalysisResultRow | null> {
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

async function fetchRecentResultsForChannel(
  supabase: SupabaseClient,
  userId: string,
  userChannelId: string,
  limit: number
): Promise<AnalysisResultRow[]> {
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

/** 동일 Supabase 클라이언트로 채널 목록만 조회 (추가 `getUser` 없음). */
export async function getUserChannelsForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<UserChannelRow[]> {
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

export async function getDefaultAnalysisChannelWithClient(
  supabase: SupabaseClient,
  userId: string,
  channels: UserChannelRow[]
): Promise<UserChannelRow | null> {
  if (channels.length === 0) {
    return null;
  }

  const latestResultMap = await getLatestAnalysisResultMapWithClient(
    supabase,
    userId,
    channels.map((channel) => channel.id)
  );

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

export async function getUserChannels(): Promise<UserChannelRow[]> {
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return [];
  }

  const supabase = await createClient();

  return getUserChannelsForUser(supabase, userId);
}

export async function getLatestAnalysisResultByUserChannelId(
  userChannelId: string
): Promise<AnalysisResultRow | null> {
  const userId = await getAuthenticatedUserId();

  if (!userId || !userChannelId) {
    return null;
  }

  const supabase = await createClient();

  return fetchLatestResultForChannel(supabase, userId, userChannelId);
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

  return fetchRecentResultsForChannel(supabase, userId, userChannelId, limit);
}

export async function getLatestAnalysisResultMap(
  userChannelIds: string[]
): Promise<Record<string, AnalysisResultRow | null>> {
  const userId = await getAuthenticatedUserId();

  if (!userId || userChannelIds.length === 0) {
    return {};
  }

  const supabase = await createClient();

  return getLatestAnalysisResultMapWithClient(supabase, userId, userChannelIds);
}

export async function getDefaultAnalysisChannel(
  channels: UserChannelRow[]
): Promise<UserChannelRow | null> {
  if (channels.length === 0) {
    return null;
  }

  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return channels[0];
  }

  const supabase = await createClient();

  return getDefaultAnalysisChannelWithClient(supabase, userId, channels);
}

/**
 * 분석 페이지 데이터: 한 번의 `getUser` + 공유 Supabase 클라이언트로 조회하고,
 * 선택 채널에 대한 최신/최근 결과·runs는 병렬로 가져온다.
 */
export async function getAnalysisPageData(
  selectedChannelId?: string
): Promise<AnalysisPageData | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  const userId = user.id;
  const youtubeFeatureAccess = CORE_LOGGED_IN_YOUTUBE_ACCESS;

  const channels = await getUserChannelsForUser(supabase, userId);

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
    selectedChannel = channels.find((c) => c.id === selectedChannelId) ?? null;
  }

  if (!selectedChannel) {
    selectedChannel = await getDefaultAnalysisChannelWithClient(supabase, userId, channels);
  }

  if (!selectedChannel) {
    return {
      userId,
      channels,
      selectedChannel: null,
      latestResult: null,
      recentAnalysisResults: [],
      analysisRuns: [],
      youtubeFeatureAccess,
    };
  }

  const cid = selectedChannel.id;

  const [latestResult, recentAnalysisResults, runsRaw] = await Promise.all([
    fetchLatestResultForChannel(supabase, userId, cid),
    fetchRecentResultsForChannel(supabase, userId, cid, 20),
    fetchAnalysisRunsForUserChannel(supabase, userId, cid),
  ]);

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
