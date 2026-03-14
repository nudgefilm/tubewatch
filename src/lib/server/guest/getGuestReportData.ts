import { parseChannelUrl } from "@/lib/youtube/parseChannelUrl";
import { getChannelInfo } from "@/lib/youtube/getChannelInfo";
import { getRecentVideos, type VideoInfo } from "@/lib/youtube";
import { normalizeVideoMetrics } from "@/lib/analysis/engine/normalizeVideoMetrics";
import { buildChannelFeatures } from "@/lib/analysis/engine/buildChannelFeatures";
import { featureScoring } from "@/lib/analysis/engine/featureScoring";
import { computeChannelMetrics } from "@/lib/analysis/engine/computeChannelMetrics";
import { detectPatterns } from "@/lib/analysis/engine/detectPatterns";
import { buildAnalysisContext } from "@/lib/analysis/engine/buildAnalysisContext";
import {
  analyzeChannelWithGemini,
  type ChannelVideoSample,
} from "@/lib/ai/analyzeChannelWithGemini";
import type { GuestReportData, GuestReportResult } from "@/components/guest/types";

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX_REQUESTS = 3;

type RateLimitEntry = {
  count: number;
  windowStart: number;
};

const guestRateLimitMap = new Map<string, RateLimitEntry>();

function checkGuestRateLimit(clientIp: string | null): { allowed: boolean } {
  if (!clientIp || clientIp.trim() === "") {
    return { allowed: true };
  }
  const now = Date.now();
  let entry = guestRateLimitMap.get(clientIp);
  if (entry) {
    if (now - entry.windowStart >= RATE_LIMIT_WINDOW_MS) {
      entry = { count: 0, windowStart: now };
      guestRateLimitMap.set(clientIp, entry);
    }
    if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
      return { allowed: false };
    }
    entry.count += 1;
  } else {
    guestRateLimitMap.set(clientIp, { count: 1, windowStart: now });
  }
  return { allowed: true };
}

function toChannelVideoSamples(videos: VideoInfo[]): ChannelVideoSample[] {
  return videos.map((video) => ({
    videoId: video.video_id,
    title: video.title,
    publishedAt: video.published_at,
    viewCount: video.view_count,
    likeCount: video.like_count,
    commentCount: video.comment_count,
    duration: video.duration,
    description: video.description,
    thumbnail: video.thumbnail_url ?? null,
    tags: video.tags,
    categoryId: video.category_id,
  }));
}

function toGuestRadarMetrics(
  metrics: ReturnType<typeof computeChannelMetrics>
): GuestReportData["radar_scores"] {
  return {
    avgViewCount: metrics.avgViewCount,
    avgLikeRatio: metrics.avgLikeRatio,
    avgCommentRatio: metrics.avgCommentRatio,
    avgUploadIntervalDays: metrics.avgUploadIntervalDays,
    recent30dUploadCount: metrics.recent30dUploadCount,
    avgTagCount: metrics.avgTagCount,
  };
}

/**
 * Fetches channel + recent videos, runs analysis pipeline (no DB write), returns guest preview data.
 * Rate limit: 3 requests per hour per IP.
 */
export async function getGuestReportData(
  channelUrl: string,
  clientIp: string | null
): Promise<GuestReportResult> {
  const { allowed } = checkGuestRateLimit(clientIp);
  if (!allowed) {
    return { ok: false, error: "잠시 후 다시 시도해주세요." };
  }

  const trimmed = channelUrl.trim();
  if (!trimmed) {
    return { ok: false, error: "채널 URL을 입력해 주세요." };
  }

  const parsed = parseChannelUrl(trimmed);
  if (!parsed) {
    return {
      ok: false,
      error:
        "지원하지 않는 유튜브 채널 URL 형식입니다. /@handle 또는 /channel/UC... 형식을 사용해 주세요.",
    };
  }

  let channel;
  try {
    channel = await getChannelInfo(parsed);
  } catch (e) {
    const message = e instanceof Error ? e.message : "채널 정보를 가져올 수 없습니다.";
    return { ok: false, error: message };
  }

  let youtubeVideos: VideoInfo[];
  try {
    youtubeVideos = await getRecentVideos(channel.channel_id, 20);
  } catch (e) {
    const message = e instanceof Error ? e.message : "최근 영상 목록을 가져올 수 없습니다.";
    return { ok: false, error: message };
  }

  const normalizedDataset = normalizeVideoMetrics({
    channel: {
      youtube_channel_id: channel.channel_id,
      title: channel.channel_title,
      description: channel.description ?? "",
      published_at: null,
      subscriber_count: channel.subscriber_count,
      video_count: channel.video_count,
      view_count: channel.view_count,
    },
    videos: youtubeVideos.map((v) => ({
      video_id: v.video_id,
      title: v.title,
      description: v.description,
      published_at: v.published_at,
      thumbnail: v.thumbnail_url,
      view_count: v.view_count,
      like_count: v.like_count,
      comment_count: v.comment_count,
      duration: v.duration,
      tags: v.tags,
      category_id: v.category_id,
    })),
  });

  const featureMap = buildChannelFeatures(normalizedDataset);
  const scoreResult = featureScoring(featureMap);
  const channelMetrics = computeChannelMetrics(normalizedDataset);
  const channelPatterns = detectPatterns(channelMetrics, featureMap);
  const analysisContext = buildAnalysisContext(
    channelMetrics,
    channelPatterns,
    scoreResult,
    {
      subscriberCount: channel.subscriber_count ?? undefined,
      sampleVideoCount: youtubeVideos.length,
      collectedVideoCount: normalizedDataset.collectedVideoCount,
    }
  );

  const gemini = await analyzeChannelWithGemini({
    channelTitle: channel.channel_title || "Untitled Channel",
    subscriberCount: channel.subscriber_count,
    videos: toChannelVideoSamples(youtubeVideos),
    analysisContext,
  });

  if (!gemini.ok) {
    return { ok: false, error: gemini.error };
  }

  const data: GuestReportData = {
    channel_title: channel.channel_title,
    subscriber_count: channel.subscriber_count,
    video_count: channel.video_count,
    radar_scores: toGuestRadarMetrics(channelMetrics),
    strengths: gemini.result.strengths ?? [],
    weaknesses: gemini.result.weaknesses ?? [],
  };

  return { ok: true, data };
}
