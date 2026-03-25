import {
  fetchJsonWithRetry,
  getYouTubeApiKey,
  safeNullableString,
  safeString,
  safeTags,
  toNumber,
} from "./youtubeApi";
import type { VideoInfo } from "./types";

interface YouTubeChannelContentDetails {
  relatedPlaylists?: {
    uploads?: string;
  };
}

interface YouTubeChannelsContentDetailsItem {
  id?: string;
  contentDetails?: YouTubeChannelContentDetails;
}

interface YouTubeChannelsContentDetailsResponse {
  items?: YouTubeChannelsContentDetailsItem[];
}

interface YouTubePlaylistItemSnippet {
  title?: string;
  description?: string;
  publishedAt?: string;
  resourceId?: {
    videoId?: string;
  };
  thumbnails?: {
    default?: { url?: string };
    medium?: { url?: string };
    high?: { url?: string };
  };
}

interface YouTubePlaylistItemContentDetails {
  videoId?: string;
}

interface YouTubePlaylistItem {
  snippet?: YouTubePlaylistItemSnippet;
  contentDetails?: YouTubePlaylistItemContentDetails;
}

interface YouTubePlaylistItemsResponse {
  items?: YouTubePlaylistItem[];
}

interface YouTubeVideoSnippet {
  title?: string;
  description?: string;
  publishedAt?: string;
  tags?: string[];
  categoryId?: string;
  thumbnails?: {
    default?: { url?: string };
    medium?: { url?: string };
    high?: { url?: string };
  };
}

interface YouTubeVideoItem {
  id?: string;
  snippet?: YouTubeVideoSnippet;
  contentDetails?: {
    duration?: string;
  };
  statistics?: {
    viewCount?: string;
    likeCount?: string;
    commentCount?: string;
  };
}

interface YouTubeVideosResponse {
  items?: YouTubeVideoItem[];
}

function pickThumbnailUrl(snippet: YouTubeVideoSnippet | undefined): string | null {
  const thumbnails = snippet?.thumbnails;

  return (
    thumbnails?.high?.url ??
    thumbnails?.medium?.url ??
    thumbnails?.default?.url ??
    null
  );
}

/**
 * 채널의 최근 업로드 영상. **search.list 미사용**.
 * `channels.list`(uploads 플레이리스트 ID) → `playlistItems.list` → `videos.list` 조합이며,
 * 이후 분석 엔진의 `recent30dUploadCount`는 여기서 얻은 `published_at`을 정규화한 뒤 30일 이내로 필터해 집계합니다.
 */
export async function getRecentVideos(
  channelId: string,
  limit: number = 20
): Promise<VideoInfo[]> {
  const apiKey = getYouTubeApiKey();

  const safeLimit = Math.min(Math.max(limit, 1), 50);

  // 1) channels.list 로 uploads 플레이리스트 ID 조회
  const channelsUrl =
    "https://www.googleapis.com/youtube/v3/channels" +
    `?part=contentDetails&id=${encodeURIComponent(channelId)}` +
    `&key=${encodeURIComponent(apiKey)}`;

  const channelsData =
    await fetchJsonWithRetry<YouTubeChannelsContentDetailsResponse>(
      channelsUrl,
      {
        label: "YOUTUBE_API_CHANNELS_CONTENT_DETAILS",
      }
    );

  const channelItem = channelsData.items?.[0];
  const uploadsPlaylistId =
    channelItem?.contentDetails?.relatedPlaylists?.uploads;

  if (!uploadsPlaylistId) {
    throw new Error("YOUTUBE_UPLOADS_PLAYLIST_NOT_FOUND");
  }

  // 2) playlistItems.list 로 업로드 플레이리스트에서 최신 영상 목록 조회
  const playlistItemsUrl =
    "https://www.googleapis.com/youtube/v3/playlistItems" +
    `?part=snippet,contentDetails&playlistId=${encodeURIComponent(uploadsPlaylistId)}` +
    `&maxResults=${safeLimit}` +
    `&key=${encodeURIComponent(apiKey)}`;

  const playlistItemsData =
    await fetchJsonWithRetry<YouTubePlaylistItemsResponse>(playlistItemsUrl, {
      label: "YOUTUBE_API_PLAYLIST_ITEMS",
    });

  const playlistItems = playlistItemsData.items ?? [];

  const videoIds: string[] = [];

  for (const item of playlistItems) {
    const fromContent = item.contentDetails?.videoId;
    const fromResource = item.snippet?.resourceId?.videoId;
    const videoId = fromContent || fromResource;

    if (typeof videoId === "string" && videoId.length > 0) {
      videoIds.push(videoId);
    }
  }

  if (videoIds.length === 0) {
    return [];
  }

  const videosUrl =
    "https://www.googleapis.com/youtube/v3/videos" +
    "?part=snippet,contentDetails,statistics" +
    `&id=${encodeURIComponent(videoIds.join(","))}` +
    `&key=${encodeURIComponent(apiKey)}`;

  const videosData = await fetchJsonWithRetry<YouTubeVideosResponse>(
    videosUrl,
    {
      label: "YOUTUBE_API_VIDEOS_LIST",
    }
  );

  const detailMap = new Map<string, YouTubeVideoItem>();
  for (const item of videosData.items ?? []) {
    if (item.id) {
      detailMap.set(item.id, item);
    }
  }

  const videos: VideoInfo[] = [];

  // playlistItems 순서를 그대로 유지 → 최신 업로드 순서
  for (const item of playlistItems) {
    const fromContent = item.contentDetails?.videoId;
    const fromResource = item.snippet?.resourceId?.videoId;
    const videoId = fromContent || fromResource;

    if (!videoId || !detailMap.has(videoId)) {
      continue;
    }

    const detailItem = detailMap.get(videoId);
    const snippet = detailItem?.snippet;

    videos.push({
      video_id: videoId,
      title: safeString(snippet?.title),
      description: safeString(snippet?.description),
      published_at: safeNullableString(snippet?.publishedAt),
      view_count: toNumber(detailItem?.statistics?.viewCount),
      like_count: toNumber(detailItem?.statistics?.likeCount),
      comment_count: toNumber(detailItem?.statistics?.commentCount),
      duration: safeNullableString(detailItem?.contentDetails?.duration),
      tags: safeTags(snippet?.tags),
      category_id: safeNullableString(snippet?.categoryId),
      thumbnail_url: pickThumbnailUrl(snippet),
    });
  }

  return videos.slice(0, safeLimit);
}

