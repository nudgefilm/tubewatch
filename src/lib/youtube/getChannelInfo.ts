import {
  fetchJsonWithRetry,
  getYouTubeApiKey,
  safeNullableString,
  safeString,
  toNumber,
} from "./youtubeApi";
import type { ChannelInfo } from "./types";

type ChannelLookupInput =
  | { type: "handle"; value: string }
  | { type: "channelId"; value: string };

interface LegacyChannelInfo {
  channelId: string;
  title: string | null;
  thumbnailUrl: string | null;
  subscriberCount: number | null;
}

interface SearchResponseItem {
  id?: {
    channelId?: string;
  };
}

interface SearchResponse {
  items?: SearchResponseItem[];
}

interface ChannelsResponseItem {
  id?: string;
  snippet?: {
    title?: string;
    description?: string;
    publishedAt?: string;
    thumbnails?: {
      default?: { url?: string };
      medium?: { url?: string };
      high?: { url?: string };
    };
  };
  statistics?: {
    subscriberCount?: string;
    videoCount?: string;
    viewCount?: string;
  };
}

interface ChannelsResponse {
  items?: ChannelsResponseItem[];
}

async function resolveChannelId(
  input: ChannelLookupInput,
  apiKey: string
): Promise<string> {
  if (input.type === "channelId") {
    return input.value;
  }

  const query = `@${input.value}`;

  const url =
    "https://www.googleapis.com/youtube/v3/search" +
    `?part=snippet&type=channel&maxResults=1&q=${encodeURIComponent(query)}` +
    `&key=${encodeURIComponent(apiKey)}`;

  const data = await fetchJsonWithRetry<SearchResponse>(url, {
    label: "YOUTUBE_API_SEARCH_CHANNEL",
  });
  const channelId = data.items?.[0]?.id?.channelId;

  if (!channelId) {
    throw new Error("CHANNEL_NOT_FOUND_BY_HANDLE");
  }

  return channelId;
}

async function fetchChannelInfoById(
  channelId: string,
  apiKey: string
): Promise<ChannelInfo> {
  const url =
    "https://www.googleapis.com/youtube/v3/channels" +
    `?part=snippet,statistics&id=${encodeURIComponent(channelId)}` +
    `&key=${encodeURIComponent(apiKey)}`;

  const data = await fetchJsonWithRetry<ChannelsResponse>(url, {
    label: "YOUTUBE_API_CHANNELS_LIST",
  });
  const item = data.items?.[0];

  if (!item?.id) {
    throw new Error("CHANNEL_NOT_FOUND");
  }

  const thumbnails = item.snippet?.thumbnails;
  const thumbnailUrl =
    thumbnails?.high?.url ??
    thumbnails?.medium?.url ??
    thumbnails?.default?.url ??
    null;

  return {
    channel_id: item.id,
    channel_title: safeString(item.snippet?.title) || "Untitled Channel",
    description: safeNullableString(item.snippet?.description),
    subscriber_count: toNumber(item.statistics?.subscriberCount),
    video_count: toNumber(item.statistics?.videoCount),
    view_count: toNumber(item.statistics?.viewCount),
    thumbnail_url: thumbnailUrl,
  };
}

export async function getChannelInfo(
  channelId: string
): Promise<ChannelInfo>;
export async function getChannelInfo(
  input: ChannelLookupInput
): Promise<LegacyChannelInfo>;
export async function getChannelInfo(
  input: string | ChannelLookupInput
): Promise<ChannelInfo | LegacyChannelInfo> {
  const apiKey = getYouTubeApiKey();

  if (typeof input === "string") {
    return fetchChannelInfoById(input, apiKey);
  }

  const resolvedChannelId = await resolveChannelId(input, apiKey);
  const core = await fetchChannelInfoById(resolvedChannelId, apiKey);

  return {
    channelId: core.channel_id,
    title: core.channel_title,
    thumbnailUrl: core.thumbnail_url,
    subscriberCount: core.subscriber_count,
  };
}
