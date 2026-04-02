export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export interface SaveAnalysisResultPayload {
  userId: string;
  userChannelId: string;
  jobId: string;

  channelId: string;
  channelUrl: string;
  channelTitle: string | null;
  thumbnailUrl: string | null;

  sampleVideoCount: number;
  analysisConfidence: string | null;

  status: string;

  geminiModel: string;
  geminiStatus: string;
  geminiAnalyzedAt: string;
  geminiRawJson: string;
  geminiAttemptCount: number;

  channelSummary: string;
  contentPatternSummary: string;
  contentPatterns: string[];
  strengths: string[];
  weaknesses: string[];
  bottlenecks: string[];
  recommendedTopics: string[];
  growthActionPlan: string[];
  targetAudience: string[];
  sampleSizeNote: string;
  interpretationMode: string;

  featureSnapshot: JsonValue;
  featureTotalScore: number;
  featureSectionScores: JsonValue;
  engineVersion: string;
}

export interface AnalysisResultRecord {
  id: string;
  user_id: string;
  user_channel_id: string;
  job_id: string;
  channel_id: string;
  channel_url: string;
  channel_title: string | null;
  thumbnail_url: string | null;
  sample_video_count: number | null;
  analysis_confidence: string | null;
  status: string | null;
  gemini_model: string | null;
  gemini_status: string | null;
  gemini_analyzed_at: string | null;
  gemini_raw_json: string | null;
  gemini_attempt_count: number | null;
  channel_summary: string | null;
  content_pattern_summary: string | null;
  content_patterns: string[] | null;
  strengths: string[] | null;
  weaknesses: string[] | null;
  bottlenecks: string[] | null;
  recommended_topics: string[] | null;
  growth_action_plan: string[] | null;
  target_audience: string[] | null;
  sample_size_note: string | null;
  feature_snapshot: JsonValue | null;
  feature_total_score: number | null;
  feature_section_scores: JsonValue | null;
  engine_version: string | null;
  created_at: string | null;
}
