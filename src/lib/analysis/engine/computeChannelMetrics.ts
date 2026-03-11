import type { ChannelMetrics, NormalizedChannelDataset } from "./types";
import { average, median } from "./utils";

export function computeChannelMetrics(
  dataset: NormalizedChannelDataset
): ChannelMetrics {
  const videos = dataset.videos;

  const views = videos.map((v) => v.viewCount);
  const durations = videos.map((v) => v.durationSeconds);
  const titleLengths = videos.map((v) => v.titleLength);
  const tagCounts = videos.map((v) => v.tagCount);

  const likeRatios = videos.map((v) =>
    v.viewCount > 0 ? v.likeCount / v.viewCount : 0
  );
  const commentRatios = videos.map((v) =>
    v.viewCount > 0 ? v.commentCount / v.viewCount : 0
  );

  const sortedByDate = [...videos]
    .filter((v) => v.publishedAt)
    .sort(
      (a, b) =>
        new Date(a.publishedAt as string).getTime() -
        new Date(b.publishedAt as string).getTime()
    );

  const gaps: number[] = [];
  for (let i = 1; i < sortedByDate.length; i++) {
    const prev = new Date(sortedByDate[i - 1].publishedAt as string);
    const curr = new Date(sortedByDate[i].publishedAt as string);
    gaps.push((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
  }

  const recent30 = videos.filter(
    (v) => v.daysSincePublished !== null && v.daysSincePublished <= 30
  );

  return {
    avgViewCount: average(views),
    medianViewCount: median(views),
    avgLikeRatio: average(likeRatios),
    avgCommentRatio: average(commentRatios),
    avgVideoDuration: average(durations),
    avgUploadIntervalDays: average(gaps),
    recent30dUploadCount: recent30.length,
    avgTitleLength: average(titleLengths),
    avgTagCount: average(tagCounts),
  };
}
