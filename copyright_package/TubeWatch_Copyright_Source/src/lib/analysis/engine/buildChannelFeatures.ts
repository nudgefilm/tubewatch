import type { ChannelFeatureMap, NormalizedChannelDataset } from "./types";
import {
  average,
  coefficientOfVariation,
  median,
  ratio,
} from "./utils";

function hasSeriesPattern(title: string): boolean {
  return /(\d+화|\d+편|ep\.?\s?\d+|episode\s?\d+|part\s?\d+)/i.test(title);
}

function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s]/g, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 2);
}

export function buildChannelFeatures(
  dataset: NormalizedChannelDataset
): ChannelFeatureMap {
  const videos = dataset.videos;
  const total = videos.length || 1;

  const sortedByDate = [...videos]
    .filter((video) => video.publishedAt)
    .sort((a, b) => {
      return (
        new Date(a.publishedAt as string).getTime() -
        new Date(b.publishedAt as string).getTime()
      );
    });

  const gaps: number[] = [];
  for (let i = 1; i < sortedByDate.length; i++) {
    const prev = new Date(sortedByDate[i - 1].publishedAt as string);
    const curr = new Date(sortedByDate[i].publishedAt as string);
    const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    gaps.push(diffDays);
  }

  const recent30 = videos.filter(
    (video) =>
      video.daysSincePublished !== null && video.daysSincePublished <= 30
  );

  const recent90 = videos.filter(
    (video) =>
      video.daysSincePublished !== null && video.daysSincePublished <= 90
  );

  const activeDaySet = new Set(
    recent90
      .filter((video) => video.publishedAt)
      .map((video) => String(video.publishedAt).slice(0, 10))
  );

  const views = videos.map((video) => video.viewCount);
  const likes = videos.map((video) => video.likeCount);
  const comments = videos.map((video) => video.commentCount);
  const engagementRates = videos.map((video) => video.engagementRate);
  const titleLengths = videos.map((video) => video.titleLength);
  const descriptionLengths = videos.map((video) => video.descriptionLength);
  const tagCounts = videos.map((video) => video.tagCount);

  const categoryMap = new Map<string, number>();
  videos.forEach((video) => {
    if (!video.categoryId) return;
    categoryMap.set(
      video.categoryId,
      (categoryMap.get(video.categoryId) || 0) + 1
    );
  });
  const maxCategoryCount = Math.max(0, ...Array.from(categoryMap.values()));

  const keywordPool = new Map<string, number>();
  videos.forEach((video) => {
    extractKeywords(video.title).forEach((keyword) => {
      keywordPool.set(keyword, (keywordPool.get(keyword) || 0) + 1);
    });
  });

  const repeatedKeywords = Array.from(keywordPool.entries())
    .filter(([, count]) => count >= 3)
    .map(([keyword]) => keyword);

  const keywordTitleHits = videos.filter((video) =>
    repeatedKeywords.some((keyword) =>
      video.title.toLowerCase().includes(keyword)
    )
  ).length;

  const keywordDescriptionHits = videos.filter((video) =>
    repeatedKeywords.some((keyword) =>
      video.description.toLowerCase().includes(keyword)
    )
  ).length;

  const datedVideos = videos
    .filter((video) => video.daysSincePublished !== null)
    .sort(
      (a, b) =>
        (a.daysSincePublished ?? Number.MAX_SAFE_INTEGER) -
        (b.daysSincePublished ?? Number.MAX_SAFE_INTEGER)
    );

  const splitIndex = Math.max(1, Math.floor(datedVideos.length / 2));

  const recentHalf = datedVideos.slice(0, splitIndex);
  const olderHalf = datedVideos.slice(splitIndex);

  const recentViewsPerDayAvg = average(
    recentHalf.map((video) => video.viewsPerDay)
  );
  const olderViewsPerDayAvg = average(
    olderHalf.map((video) => video.viewsPerDay)
  );

  const totalViews = views.reduce((sum, value) => sum + value, 0);
  const maxViews = Math.max(0, ...views);
  const avgViews = average(views);
  const avgEngRate = average(engagementRates);

  return {
    uploadFrequency30d: recent30.length,
    avgPublishingGapDays: average(gaps),
    recentUploadRatio: ratio(recent30.length, total),
    consistencyScore: Math.max(0, 1 - coefficientOfVariation(gaps)),
    activeDaysRatio: ratio(activeDaySet.size, 90),
    shortsRatio: ratio(
      videos.filter(
        (video) => video.durationSeconds > 0 && video.durationSeconds <= 60
      ).length,
      total
    ),

    avgViews,
    medianViews: median(views),
    avgLikes: average(likes),
    avgComments: average(comments),
    avgEngagementRate: average(engagementRates),
    engagementConsistency: Math.max(
      0,
      1 - coefficientOfVariation(engagementRates)
    ),

    avgTitleLength: average(titleLengths),
    avgDescriptionLength: average(descriptionLengths),
    avgTagCount: average(tagCounts),
    categoryConcentration: ratio(maxCategoryCount, total),
    titleFormatConsistency: Math.max(
      0,
      1 - coefficientOfVariation(titleLengths)
    ),
    seriesContentRatio: ratio(
      videos.filter((video) => hasSeriesPattern(video.title)).length,
      total
    ),

    keywordTitleRatio: ratio(keywordTitleHits, total),
    keywordDescriptionRatio: ratio(keywordDescriptionHits, total),
    tagUsageRatio: ratio(
      videos.filter((video) => video.tagCount > 0).length,
      total
    ),
    metadataCompleteness: ratio(
      videos.filter(
        (video) =>
          video.title &&
          video.description &&
          video.durationSeconds > 0 &&
          video.categoryId &&
          video.tagCount >= 1
      ).length,
      total
    ),
    searchableTitleRatio: ratio(
      videos.filter(
        (video) => video.titleLength >= 20 && video.titleLength <= 70
      ).length,
      total
    ),
    categoryUsageRatio: ratio(
      videos.filter((video) => !!video.categoryId).length,
      total
    ),

    recentViewsPerDayAvg,
    olderViewsPerDayAvg,
    momentumLift:
      olderViewsPerDayAvg > 0 ? recentViewsPerDayAvg / olderViewsPerDayAvg : 0,
    topVideoDependence: ratio(maxViews, totalViews),
    viewDistributionBalance: Math.max(0, 1 - coefficientOfVariation(views)),
    breakoutVideoRatio: ratio(
      videos.filter((video) => avgViews > 0 && video.viewCount >= avgViews * 1.8)
        .length,
      total
    ),

    highEngagementVideoRatio: ratio(
      videos.filter(
        (video) => avgEngRate > 0 && video.engagementRate >= avgEngRate * 1.5
      ).length,
      total
    ),
    commentToLikeRatio: Math.min(
      1,
      average(likes) > 0
        ? average(comments) / (average(likes) + 0.001)
        : 0
    ),
  };
}