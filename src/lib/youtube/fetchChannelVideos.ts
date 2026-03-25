import type { YouTubeVideoData } from "./types";
import { getRecentVideos } from "./getRecentVideos";

/**
 * 채널의 최근 영상 목록.
 * 내부적으로 **uploads 플레이리스트 → playlistItems.list → videos.list** 경로만 사용합니다.
 * (search.list + publishedAt 필터 방식은 사용하지 않음 — 채널 분석·지표와 동일한 출처를 맞추기 위함.)
 */
export async function fetchChannelVideos(
  channelId: string,
  maxResults = 20
): Promise<YouTubeVideoData[]> {
  const rows = await getRecentVideos(channelId, maxResults);
  return rows.map((v) => ({
    videoId: v.video_id,
    title: v.title,
    description: v.description,
    publishedAt: v.published_at,
    thumbnailUrl: v.thumbnail_url,
    viewCount: v.view_count,
    likeCount: v.like_count,
    commentCount: v.comment_count,
    duration: v.duration,
    tags: v.tags,
    categoryId: v.category_id,
  }));
}
