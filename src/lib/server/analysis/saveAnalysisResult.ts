import { supabaseAdmin } from "@/lib/supabase/admin";
import { logStorageError } from "./storageUtils";
import type {
  AnalysisResultRecord,
  SaveAnalysisResultPayload,
} from "./storageTypes";

export async function saveAnalysisResult(
  payload: SaveAnalysisResultPayload
): Promise<AnalysisResultRecord> {
  const insertPayload = {
    user_id: payload.userId,
    user_channel_id: payload.userChannelId,
    job_id: payload.jobId,
    feature_scores: payload.featureScores,
    ai_insights: payload.aiInsights,
    analysis_timestamp: payload.analysisTimestamp,
  };

  const { data, error } = await supabaseAdmin
    .from<AnalysisResultRecord>("analysis_results")
    .upsert(insertPayload, { onConflict: "job_id" })
    .select(
      "id, user_id, user_channel_id, job_id, feature_scores, ai_insights, analysis_timestamp, created_at"
    )
    .single();

  if (error) {
    logStorageError({
      operation: "analysis_results.insert",
      table: "analysis_results",
      error,
      extra: {
        user_id: payload.userId,
        user_channel_id: payload.userChannelId,
        job_id: payload.jobId,
      },
    });

    throw new Error(`Storage error (analysis_results.upsert): ${error.message}`);
  }

  if (!data) {
    throw new Error("Storage error (analysis_results.upsert): no data");
  }

  return data;
}
