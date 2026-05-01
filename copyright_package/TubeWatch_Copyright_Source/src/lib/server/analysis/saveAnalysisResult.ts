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
    channel_id: payload.channelId,
    channel_url: payload.channelUrl,
    channel_title: payload.channelTitle,
    thumbnail_url: payload.thumbnailUrl,
    sample_video_count: payload.sampleVideoCount,
    analysis_confidence: payload.analysisConfidence,
    status: payload.status,
    gemini_model: payload.geminiModel,
    gemini_status: payload.geminiStatus,
    gemini_analyzed_at: payload.geminiAnalyzedAt,
    gemini_raw_json: payload.geminiRawJson,
    gemini_attempt_count: payload.geminiAttemptCount,
    channel_summary: payload.channelSummary,
    content_pattern_summary: payload.contentPatternSummary,
    content_patterns: payload.contentPatterns,
    strengths: payload.strengths,
    weaknesses: payload.weaknesses,
    bottlenecks: payload.bottlenecks,
    recommended_topics: payload.recommendedTopics,
    growth_action_plan: payload.growthActionPlan,
    target_audience: payload.targetAudience,
    sample_size_note: payload.sampleSizeNote,
    interpretation_mode: payload.interpretationMode,
    feature_snapshot: payload.featureSnapshot,
    feature_total_score: payload.featureTotalScore,
    feature_section_scores: payload.featureSectionScores,
    engine_version: payload.engineVersion,
  };

  // ── 진단 로그 ──
  const undefinedKeys = Object.entries(insertPayload)
    .filter(([, v]) => v === undefined)
    .map(([k]) => k);
  console.log("[SAVE] payload keys:", Object.keys(insertPayload));
  console.log("[SAVE] undefined keys:", undefinedKeys);
  console.log("[SAVE] payload sample:", JSON.stringify(insertPayload).slice(0, 500));
  console.log("[SAVE] job_id:", insertPayload.job_id);
  console.log("[SAVE] user_channel_id:", insertPayload.user_channel_id);
  console.log("[SAVE] feature_total_score type:", typeof insertPayload.feature_total_score, "value:", insertPayload.feature_total_score);
  console.log("[SAVE] gemini_raw_json length:", insertPayload.gemini_raw_json?.length ?? 0);

  const { data, error } = await supabaseAdmin
    .from("analysis_results")
    .upsert(insertPayload, { onConflict: "job_id" })
    .select(
      [
        "id",
        "user_id",
        "user_channel_id",
        "job_id",
        "channel_id",
        "channel_url",
        "channel_title",
        "thumbnail_url",
        "sample_video_count",
        "analysis_confidence",
        "status",
        "gemini_model",
        "gemini_status",
        "gemini_analyzed_at",
        "gemini_raw_json",
        "gemini_attempt_count",
        "channel_summary",
        "content_pattern_summary",
        "content_patterns",
        "strengths",
        "weaknesses",
        "bottlenecks",
        "recommended_topics",
        "growth_action_plan",
        "target_audience",
        "sample_size_note",
        "feature_snapshot",
        "feature_total_score",
        "feature_section_scores",
        "engine_version",
        "created_at",
      ].join(", ")
    )
    .single();

  if (error) {
    console.error("[SAVE] insert error code:", error.code);
    console.error("[SAVE] insert error message:", error.message);
    console.error("[SAVE] insert error details:", error.details);
    console.error("[SAVE] insert error hint:", error.hint);
    console.error("[SAVE] insert error full:", JSON.stringify(error));

    logStorageError({
      operation: "analysis_results.upsert",
      table: "analysis_results",
      error,
      extra: {
        user_id: payload.userId,
        user_channel_id: payload.userChannelId,
        job_id: payload.jobId,
      },
    });

    throw new Error(
      `Storage error (analysis_results.upsert): ${error.message}`
    );
  }

  if (!data) {
    throw new Error("Storage error (analysis_results.upsert): no data");
  }

  return data as unknown as AnalysisResultRecord;
}
