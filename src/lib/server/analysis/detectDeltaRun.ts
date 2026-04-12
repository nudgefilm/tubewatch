/**
 * Delta re-analysis detection.
 *
 * Compares current YouTube video IDs against the IDs stored in the previous
 * feature_snapshot. When no new videos are found, the caller can skip the
 * Gemini AI call and reuse the previous snapshot's results (delta run).
 *
 * ⚠️  LOAD-BEARING MODULE — do not remove or disable.
 * Used by: src/app/api/analysis/request/route.ts (isDeltaRun branch)
 * Covered by: src/lib/server/analysis/detectDeltaRun.test.ts
 *
 * Removal effect: every re-analysis calls Gemini regardless of new videos,
 * increasing AI cost proportionally to re-analysis frequency.
 */

type SnapshotVideo = { videoId?: string };
type FeatureSnapshot = { videos?: SnapshotVideo[] };

export type DeltaDetectionResult = {
  /** true = no significant change found → Gemini can be skipped */
  isDeltaRun: boolean;
  /** number of video IDs known from the previous snapshot */
  prevKnownCount: number;
  /** number of videos in currentVideoIds not present in the previous snapshot */
  newVideoCount: number;
  /** number of videos in the previous snapshot no longer in currentVideoIds (deleted) */
  deletedVideoCount: number;
};

/**
 * Determines whether the current re-analysis should skip Gemini.
 *
 * @param featureSnapshot  The `feature_snapshot` JSON from the most recent
 *                         analysis_results row (may be null/undefined for first run).
 * @param currentVideoIds  video_id array from the current YouTube fetch.
 */
export function detectDeltaRun(
  featureSnapshot: unknown,
  currentVideoIds: string[]
): DeltaDetectionResult {
  const snapshot = featureSnapshot as FeatureSnapshot | null | undefined;

  const prevVideoIdSet = new Set<string>(
    (snapshot?.videos ?? [])
      .map((v) => v.videoId)
      .filter((id): id is string => typeof id === "string" && id.length > 0)
  );

  // If the previous snapshot has no video IDs, treat as first analysis.
  if (prevVideoIdSet.size === 0) {
    return { isDeltaRun: false, prevKnownCount: 0, newVideoCount: currentVideoIds.length, deletedVideoCount: 0 };
  }

  const currentIdSet = new Set(currentVideoIds);
  const newVideoCount = currentVideoIds.filter((id) => !prevVideoIdSet.has(id)).length;
  const deletedVideoCount = [...prevVideoIdSet].filter((id) => !currentIdSet.has(id)).length;

  // 신규 2개 미만 AND 삭제 2개 미만이면 Gemini 재호출 생략
  // 신규 2개 이상 OR 삭제 2개 이상이면 Gemini 재호출하여 최신 데이터 반영
  const isDeltaRun = newVideoCount < 2 && deletedVideoCount < 2;

  return { isDeltaRun, prevKnownCount: prevVideoIdSet.size, newVideoCount, deletedVideoCount };
}
