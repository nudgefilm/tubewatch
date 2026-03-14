/**
 * Server-only types for guest full report (report_data jsonb).
 */

export type GuestReportDataMetrics = {
  avgViewCount: number;
  avgLikeRatio: number;
  avgCommentRatio: number;
  avgUploadIntervalDays: number;
  recent30dUploadCount: number;
  avgTagCount: number;
};

export type GuestReportActionItem = {
  title: string;
  reason: string;
  expected_impact: string;
  source: string;
};

export type GuestReportSeoCard = {
  title: string;
  current_status: string;
  recommendation: string;
  source: string;
};

export type GuestReportBenchmarkItem = {
  title: string;
  current_score: number;
  benchmark_score: number;
  status_label: string;
  source: string;
};

export type GuestFullReportData = {
  channel_title: string;
  subscriber_count: number | null;
  video_count: number | null;
  channel_summary: string;
  content_pattern_summary: string;
  content_patterns: string[];
  strengths: string[];
  weaknesses: string[];
  bottlenecks: string[];
  recommended_topics: string[];
  growth_action_plan: string[];
  target_audience: string[];
  sample_size_note: string;
  interpretation_mode: string;
  analysis_confidence: string;
  metrics: GuestReportDataMetrics;
  action_plan_items: GuestReportActionItem[];
  seo_items: GuestReportSeoCard[];
  benchmark_items: GuestReportBenchmarkItem[];
};
