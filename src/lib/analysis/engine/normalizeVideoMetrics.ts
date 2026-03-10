import {
    daysBetween,
    parseIsoDate,
    safeArray,
    safeNumber,
    safeString,
  } from "./utils";
  import type {
    NormalizedChannel,
    NormalizedChannelDataset,
    NormalizedVideo,
  } from "./types";
  
  type RawChannelInput = {
    youtube_channel_id?: string | null;
    title?: string | null;
    description?: string | null;
    published_at?: string | null;
    subscriber_count?: number | string | null;
    video_count?: number | string | null;
    view_count?: number | string | null;
  };
  
  type RawVideoInput = {
    video_id?: string | null;
    title?: string | null;
    description?: string | null;
    published_at?: string | null;
    thumbnail?: string | null;
  
    view_count?: number | string | null;
    like_count?: number | string | null;
    comment_count?: number | string | null;
  
    duration?: string | null; // ISO8601, e.g. PT5M13S
    tags?: string[] | null;
    category_id?: string | null;
  };
  
  function parseDurationToSeconds(duration: string | null | undefined): number {
    if (!duration) return 0;
  
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
  
    const hours = Number(match[1] || 0);
    const minutes = Number(match[2] || 0);
    const seconds = Number(match[3] || 0);
  
    return hours * 3600 + minutes * 60 + seconds;
  }
  
  function calcViewsPerDay(viewCount: number, publishedAt: string | null): number {
    const publishedDate = parseIsoDate(publishedAt);
    if (!publishedDate) return 0;
  
    const now = new Date();
    const days = Math.max(1, daysBetween(publishedDate, now));
    return viewCount / days;
  }
  
  function calcEngagementRate(
    viewCount: number,
    likeCount: number,
    commentCount: number
  ): number {
    if (viewCount <= 0) return 0;
    return ((likeCount + commentCount) / viewCount) * 100;
  }
  
  export function normalizeVideoMetrics(params: {
    channel: RawChannelInput;
    videos: RawVideoInput[];
  }): NormalizedChannelDataset {
    const now = new Date();
  
    const channelPublishedDate = parseIsoDate(params.channel.published_at ?? null);
  
    const normalizedChannel: NormalizedChannel = {
      youtubeChannelId: safeString(params.channel.youtube_channel_id),
      title: safeString(params.channel.title),
      description: safeString(params.channel.description),
      publishedAt: params.channel.published_at ?? null,
  
      subscriberCount: safeNumber(params.channel.subscriber_count),
      videoCount: safeNumber(params.channel.video_count),
      viewCount: safeNumber(params.channel.view_count),
  
      channelAgeDays: channelPublishedDate
        ? Math.max(0, daysBetween(channelPublishedDate, now))
        : null,
    };
  
    const normalizedVideos: NormalizedVideo[] = safeArray<RawVideoInput>(
      params.videos,
      []
    )
      .slice(0, 20)
      .map((video) => {
        const title = safeString(video.title);
        const description = safeString(video.description);
        const publishedAt = video.published_at ?? null;
  
        const viewCount = safeNumber(video.view_count);
        const likeCount = safeNumber(video.like_count);
        const commentCount = safeNumber(video.comment_count);
  
        const tags = safeArray<string>(video.tags, []);
        const durationSeconds = parseDurationToSeconds(video.duration);
  
        const publishedDate = parseIsoDate(publishedAt);
        const daysSincePublished = publishedDate
          ? Math.max(0, daysBetween(publishedDate, now))
          : null;
  
        return {
          videoId: safeString(video.video_id),
          title,
          description,
          publishedAt,
          thumbnail: video.thumbnail ?? null,
  
          viewCount,
          likeCount,
          commentCount,
  
          durationSeconds,
          tags,
          categoryId: video.category_id ?? null,
  
          titleLength: title.length,
          descriptionLength: description.length,
          tagCount: tags.length,
  
          daysSincePublished,
          viewsPerDay: calcViewsPerDay(viewCount, publishedAt),
          engagementRate: calcEngagementRate(
            viewCount,
            likeCount,
            commentCount
          ),
        };
      });
  
    return {
      channel: normalizedChannel,
      videos: normalizedVideos,
      collectedVideoCount: normalizedVideos.length,
    };
  }