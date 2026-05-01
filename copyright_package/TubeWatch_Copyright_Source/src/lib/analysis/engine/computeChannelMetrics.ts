import type { ChannelMetrics, NormalizedChannelDataset } from "./types";
import { average, median } from "./utils";

/**
 * `recent30dUploadCount`: 표본 영상 각각의 `publishedAt`으로부터 계산한 `daysSincePublished`가
 * 30일 이하인 편 수입니다. 표본은 수집 시점에 **채널 uploads 플레이리스트 → playlistItems** 기준으로
 * 가져온 목록(검색 API 기반 목록과 혼용하지 않음)이어야 동일 파이프라인과 일치합니다.
 */
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
