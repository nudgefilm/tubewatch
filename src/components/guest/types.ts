/**
 * Guest preview report data shape.
 * Preview: channel overview, subscriber_count, video_count, radar_scores, strengths, weaknesses.
 * Locked: action_plan, seo_insights, channel_dna (not included in payload; UI shows GuestLockedSection).
 * Note: Legacy guest reports store channel_dna comparison data under "benchmark_items" key — see guestReportTypes.ts.
 */

export type GuestRadarMetrics = {
  avgViewCount: number;
  avgLikeRatio: number;
  avgCommentRatio: number;
  avgUploadIntervalDays: number;
  recent30dUploadCount: number;
  avgTagCount: number;
};

export interface GuestReportData {
  channel_title: string;
  subscriber_count: number | null;
  video_count: number | null;
  radar_scores: GuestRadarMetrics;
  strengths: string[];
  weaknesses: string[];
}

export type GuestReportSuccess = {
  ok: true;
  data: GuestReportData;
};

export type GuestReportFailure = {
  ok: false;
  error: string;
};

export type GuestReportResult = GuestReportSuccess | GuestReportFailure;
