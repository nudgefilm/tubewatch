import { getRecentVideos } from "./getRecentVideos";

export type RecentVideo = {
  videoId: string;
  title: string | null;
  description: string | null;
  publishedAt: string | null;
  thumbnailUrl: string | null;
  duration: string | null;
  viewCount: number | null;
  likeCount: number | null;
  commentCount: number | null;
};

/**
 * 최근 영상 목록. **search.list를 쓰지 않고** uploads 플레이리스트 → playlistItems.list와 동일한 경로입니다.
 */
export async function getRecentChannelVideos(
  channelId: string,
  maxResults = 50
): Promise<RecentVideo[]> {
  const safeMax = Math.min(Math.max(maxResults, 1), 50);
  const rows = await getRecentVideos(channelId, safeMax);
  return rows.map((v) => ({
    videoId: v.video_id,
    title: v.title || null,
    description: v.description || null,
    publishedAt: v.published_at,
    thumbnailUrl: v.thumbnail_url,
    duration: v.duration,
    viewCount: v.view_count,
    likeCount: v.like_count,
    commentCount: v.comment_count,
  }));
}
