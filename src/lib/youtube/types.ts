export interface YouTubeChannelData {
  youtubeChannelId: string;
  title: string;
  description: string | null;
  publishedAt: string | null;
  thumbnailUrl: string | null;

  subscriberCount: number | null;
  videoCount: number | null;
  viewCount: number | null;
}

export interface YouTubeVideoData {
  videoId: string;
  title: string;
  description: string;
  publishedAt: string | null;
  thumbnailUrl: string | null;

  viewCount: number | null;
  likeCount: number | null;
  commentCount: number | null;

  duration: string | null;
  tags: string[];
  categoryId: string | null;
}

export interface ChannelInfo {
  channel_id: string;
  channel_title: string;
  description: string | null;
  published_at: string | null;
  subscriber_count: number | null;
  video_count: number | null;
  view_count: number | null;
  thumbnail_url: string | null;
  channel_handle: string | null;
}

export interface VideoInfo {
  video_id: string;
  title: string;
  description: string;
  published_at: string | null;
  view_count: number | null;
  like_count: number | null;
  comment_count: number | null;
  duration: string | null;
  tags: string[];
  category_id: string | null;
  thumbnail_url: string | null;
}

export interface AnalysisInput {
  channel: ChannelInfo;
  videos: VideoInfo[];
}

