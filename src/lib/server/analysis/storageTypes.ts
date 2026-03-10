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
  featureScores: JsonValue;
  aiInsights: JsonValue;
  analysisTimestamp: string;
}

export interface AnalysisResultRecord {
  id: string;
  user_id: string;
  user_channel_id: string;
  job_id: string;
  feature_scores: JsonValue;
  ai_insights: JsonValue;
  analysis_timestamp: string | null;
  created_at: string | null;
}

