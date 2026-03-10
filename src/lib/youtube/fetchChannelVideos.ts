import { getYouTubeApiKey, toNumber } from "./youtubeApi";
import type { YouTubeVideoData } from "./types";

interface YouTubeSearchItemId {
  videoId?: string | null;
}

interface YouTubeSearchItem {
  id?: YouTubeSearchItemId | null;
}

interface YouTubeSearchResponse {
  items?: YouTubeSearchItem[] | null;
}

interface YouTubeThumbnail {
  url?: string | null;
}

interface YouTubeThumbnails {
  high?: YouTubeThumbnail | null;
  medium?: YouTubeThumbnail | null;
  default?: YouTubeThumbnail | null;
}

interface YouTubeVideoSnippet {
  title?: string | null;
  description?: string | null;
  publishedAt?: string | null;
  thumbnails?: YouTubeThumbnails | null;
  tags?: string[] | null;
  categoryId?: string | null;
}

interface YouTubeVideoStatistics {
  viewCount?: string | null;
  likeCount?: string | null;
  commentCount?: string | null;
}

interface YouTubeContentDetails {
  duration?: string | null;
}

interface YouTubeVideoItem {
  id?: string | null;
  snippet?: YouTubeVideoSnippet | null;
  statistics?: YouTubeVideoStatistics | null;
  contentDetails?: YouTubeContentDetails | null;
}

interface YouTubeVideosResponse {
  items?: YouTubeVideoItem[] | null;
}

function pickThumbnailUrl(
  thumbnails: YouTubeThumbnails | null | undefined
): string | null {
  const high = thumbnails?.high?.url;
  const medium = thumbnails?.medium?.url;
  const fallback = thumbnails?.default?.url;

  return high ?? medium ?? fallback ?? null;
}

function safeString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function safeNullableString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function safeTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((tag): tag is string => typeof tag === "string");
}

export async function fetchChannelVideos(
  channelId: string,
  maxResults = 20
): Promise<YouTubeVideoData[]> {
  const apiKey = getYouTubeApiKey();

  const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
  searchUrl.searchParams.set("key", apiKey);
  searchUrl.searchParams.set("part", "snippet");
  searchUrl.searchParams.set("channelId", channelId);
  searchUrl.searchParams.set("order", "date");
  searchUrl.searchParams.set("type", "video");
  searchUrl.searchParams.set("maxResults", String(maxResults));

  const searchResponse = await fetch(searchUrl.toString(), {
    method: "GET",
    cache: "no-store",
  });

  if (!searchResponse.ok) {
    const text = await searchResponse.text();
    throw new Error(
      `YouTube search API failed: ${searchResponse.status} ${text || ""}`.trim()
    );
  }

  const searchJson = (await searchResponse.json()) as YouTubeSearchResponse;

  const videoIds: string[] = (searchJson.items ?? [])
    .map((item) => item?.id?.videoId)
    .filter((id): id is string => typeof id === "string" && id.length > 0);

  if (videoIds.length === 0) {
    return [];
  }

  const videosUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
  videosUrl.searchParams.set("key", apiKey);
  videosUrl.searchParams.set("part", "snippet,statistics,contentDetails");
  videosUrl.searchParams.set("id", videoIds.join(","));

  const videosResponse = await fetch(videosUrl.toString(), {
    method: "GET",
    cache: "no-store",
  });

  if (!videosResponse.ok) {
    const text = await videosResponse.text();
    throw new Error(
      `YouTube videos API failed: ${videosResponse.status} ${text || ""}`.trim()
    );
  }

  const videosJson = (await videosResponse.json()) as YouTubeVideosResponse;

  const videos: YouTubeVideoData[] = (videosJson.items ?? []).map((item) => {
    const snippet = item.snippet ?? undefined;
    const statistics = item.statistics ?? undefined;
    const contentDetails = item.contentDetails ?? undefined;

    return {
      videoId: safeString(item.id),
      title: safeString(snippet?.title),
      description: safeString(snippet?.description),
      publishedAt: safeNullableString(snippet?.publishedAt),
      thumbnailUrl: pickThumbnailUrl(snippet?.thumbnails ?? null),
      viewCount: toNumber(statistics?.viewCount),
      likeCount: toNumber(statistics?.likeCount),
      commentCount: toNumber(statistics?.commentCount),
      duration: safeNullableString(contentDetails?.duration),
      tags: safeTags(snippet?.tags),
      categoryId: safeNullableString(snippet?.categoryId),
    };
  });

  videos.sort((a, b) => {
    const aTime = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const bTime = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return bTime - aTime;
  });

  return videos.slice(0, maxResults);
}

