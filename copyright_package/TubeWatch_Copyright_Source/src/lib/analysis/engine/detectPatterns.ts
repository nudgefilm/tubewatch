import type {
  ChannelFeatureMap,
  ChannelMetrics,
  ChannelPatternFlag,
  ChannelPatterns,
} from "./types";

const ALL_FLAGS: ChannelPatternFlag[] = [
  "low_upload_frequency",
  "irregular_upload_interval",
  "short_video_dominant",
  "long_video_dominant",
  "high_view_variance",
  "repeated_topic_pattern",
  "low_tag_usage",
];

export function detectPatterns(
  metrics: ChannelMetrics,
  features: ChannelFeatureMap
): ChannelPatterns {
  const details: Record<ChannelPatternFlag, boolean> = {
    low_upload_frequency: metrics.recent30dUploadCount < 2,
    irregular_upload_interval: features.consistencyScore < 0.4,
    short_video_dominant: features.shortsRatio > 0.6,
    long_video_dominant:
      metrics.avgVideoDuration > 600 && features.shortsRatio < 0.2,
    high_view_variance: features.viewDistributionBalance < 0.4,
    repeated_topic_pattern: features.keywordTitleRatio > 0.5,
    low_tag_usage: features.tagUsageRatio < 0.3,
  };

  const flags = ALL_FLAGS.filter((flag) => details[flag]);

  return { flags, details };
}
