import { getYouTubeApiKey, toNumber } from "./youtubeApi";
import type { YouTubeChannelData } from "./types";

interface YouTubeChannelSnippet {
  title?: string | null;
  description?: string | null;
  publishedAt?: string | null;
  thumbnails?: {
    default?: { url?: string | null } | null;
    medium?: { url?: string | null } | null;
    high?: { url?: string | null } | null;
  } | null;
}

interface YouTubeChannelStatistics {
  subscriberCount?: string | null;
  videoCount?: string | null;
  viewCount?: string | null;
}

interface YouTubeChannelItem {
  id?: string | null;
  snippet?: YouTubeChannelSnippet | null;
  statistics?: YouTubeChannelStatistics | null;
}

interface YouTubeChannelsResponse {
  items?: YouTubeChannelItem[] | null;
}

function safeString(value: unknown, fallback: string): string {
  if (typeof value === "string" && value.length > 0) {
    return value;
  }

  return fallback;
}

function safeNullableString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

export async function fetchChannelData(
  channelId: string
): Promise<YouTubeChannelData> {
  const apiKey = getYouTubeApiKey();

  const url = new URL("https://www.googleapis.com/youtube/v3/channels");
  url.searchParams.set("key", apiKey);
  url.searchParams.set("part", "snippet,statistics");
  url.searchParams.set("id", channelId);

  const response = await fetch(url.toString(), {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `YouTube channels API failed: ${response.status} ${text || ""}`.trim()
    );
  }

  const json = (await response.json()) as YouTubeChannelsResponse;
  const item = (json.items ?? [])[0];

  if (!item) {
    throw new Error("YouTube channel not found");
  }

  const snippet = item.snippet ?? undefined;
  const statistics = item.statistics ?? undefined;

  return {
    youtubeChannelId: safeString(item.id, channelId),
    title: safeString(snippet?.title, "Untitled Channel"),
    description: safeNullableString(snippet?.description),
    publishedAt: safeNullableString(snippet?.publishedAt),
    thumbnailUrl:
      safeNullableString(snippet?.thumbnails?.medium?.url) ??
      safeNullableString(snippet?.thumbnails?.default?.url),
    subscriberCount: toNumber(statistics?.subscriberCount),
    videoCount: toNumber(statistics?.videoCount),
    viewCount: toNumber(statistics?.viewCount),
  };
}

