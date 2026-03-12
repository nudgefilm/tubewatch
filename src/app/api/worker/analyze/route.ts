import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  analyzeChannelWithGemini,
  type ChannelVideoSample,
} from "@/lib/ai/analyzeChannelWithGemini";
import { normalizeVideoMetrics } from "@/lib/analysis/engine/normalizeVideoMetrics";
import { buildChannelFeatures } from "@/lib/analysis/engine/buildChannelFeatures";
import { featureScoring } from "@/lib/analysis/engine/featureScoring";
import { computeChannelMetrics } from "@/lib/analysis/engine/computeChannelMetrics";
import { detectPatterns } from "@/lib/analysis/engine/detectPatterns";
import { buildAnalysisContext } from "@/lib/analysis/engine/buildAnalysisContext";
import {
  ANALYSIS_QUEUE_STATUS,
  ANALYSIS_JOB_STATUS,
  ANALYSIS_RESULT_STATUS,
} from "@/lib/server/analysis/status";
import { getRecentVideos, type VideoInfo } from "@/lib/youtube";
import { saveAnalysisResult } from "@/lib/server/analysis/saveAnalysisResult";
import type { JsonValue } from "@/lib/server/analysis/storageTypes";

type QueueRow = {
  id: string;
  job_id: string;
  user_id: string;
  user_channel_id: string;
  channel_id: string;
  channel_url: string | null;
  status: string;
};

type UserChannelRow = {
  id: string;
  channel_id: string;
  channel_title: string | null;
  thumbnail_url: string | null;
  subscriber_count: number | null;
};

type AnalysisResultRow = {
  id: string;
  job_id: string;
  queue_id: string;
  gemini_status: string | null;
  gemini_attempt_count: number | null;
};

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not defined`);
  }

  return value;
}

function getAdminClient() {
  const supabaseUrl = getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

function toChannelVideoSamples(videos: VideoInfo[]): ChannelVideoSample[] {
  return videos.map((video) => ({
    videoId: video.video_id,
    title: video.title,
    publishedAt: video.published_at,
    viewCount: video.view_count,
    likeCount: video.like_count,
    commentCount: video.comment_count,
    duration: video.duration,
    description: video.description,
    thumbnail: video.thumbnail_url ?? null,
    tags: video.tags,
    categoryId: video.category_id,
  }));
}

export async function POST(req: Request) {
  let runningQueueId: string | null = null;
  let runningJobId: string | null = null;

  try {
    const workerSecret = getRequiredEnv("WORKER_SECRET");
    const authHeader = req.headers.get("authorization");

    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length)
      : null;

    if (!authHeader || !token || token !== workerSecret) {
      return NextResponse.json(
        {
          ok: false,
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const supabase = getAdminClient();

    const { data: queueRow, error: queueError } = await supabase
      .from("analysis_queue")
      .select("id, job_id, user_id, user_channel_id, channel_id, channel_url, status")
      .in("status", [
        ANALYSIS_QUEUE_STATUS.QUEUED,
        ANALYSIS_QUEUE_STATUS.PENDING,
      ])
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle<QueueRow>();

    if (queueError) {
      throw new Error(`analysis_queue select failed: ${queueError.message}`);
    }

    if (!queueRow) {
      return NextResponse.json({
        ok: true,
        message: "No queued jobs",
      });
    }

    console.log("[worker.analyze] picked queue", {
      queueId: queueRow.id,
      jobId: queueRow.job_id,
      status: queueRow.status,
      userChannelId: queueRow.user_channel_id,
    });

    runningQueueId = queueRow.id;
    runningJobId = queueRow.job_id;

    const startedAt = new Date().toISOString();

    const { error: queueRunningError } = await supabase
      .from("analysis_queue")
      .update({
        status: ANALYSIS_QUEUE_STATUS.PROCESSING,
        started_at: startedAt,
        error_message: null,
      })
      .eq("id", queueRow.id);

    if (queueRunningError) {
      throw new Error(
        `analysis_queue processing update failed: ${queueRunningError.message}`
      );
    }

    console.log("[worker.analyze] queue set processing", {
      queueId: queueRow.id,
      status: ANALYSIS_QUEUE_STATUS.PROCESSING,
    });

    const { error: jobRunningError } = await supabase
      .from("analysis_jobs")
      .update({
        status: ANALYSIS_JOB_STATUS.RUNNING,
        started_at: startedAt,
        error_message: null,
      })
      .eq("id", queueRow.job_id);

    if (jobRunningError) {
      throw new Error(
        `analysis_jobs processing update failed: ${jobRunningError.message}`
      );
    }

    const { data: userChannel, error: channelError } = await supabase
      .from("user_channels")
      .select("id, channel_id, channel_title, thumbnail_url, subscriber_count")
      .eq("id", queueRow.user_channel_id)
      .single<UserChannelRow>();

    if (channelError || !userChannel) {
      throw new Error(channelError?.message || "Channel not found");
    }

    const youtubeVideos = await getRecentVideos(userChannel.channel_id, 20);

    const normalizedDataset = normalizeVideoMetrics({
      channel: {
        youtube_channel_id: userChannel.channel_id,
        title: userChannel.channel_title,
        description: "",
        published_at: null,
        subscriber_count: userChannel.subscriber_count,
        video_count: null,
        view_count: null,
      },
      videos: youtubeVideos.map((video) => ({
        video_id: video.video_id,
        title: video.title,
        description: video.description,
        published_at: video.published_at,
        thumbnail: video.thumbnail_url,
        view_count: video.view_count,
        like_count: video.like_count,
        comment_count: video.comment_count,
        duration: video.duration,
        tags: video.tags,
        category_id: video.category_id,
      })),
    });

    const featureMap = buildChannelFeatures(normalizedDataset);
    const scoreResult = featureScoring(featureMap);

    const channelMetrics = computeChannelMetrics(normalizedDataset);
    const channelPatterns = detectPatterns(channelMetrics, featureMap);
    const analysisContext = buildAnalysisContext(
      channelMetrics,
      channelPatterns,
      scoreResult,
      {
        subscriberCount: userChannel.subscriber_count ?? undefined,
        sampleVideoCount: youtubeVideos.length,
        collectedVideoCount: normalizedDataset.collectedVideoCount,
      }
    );

    const gemini = await analyzeChannelWithGemini({
      channelTitle: userChannel.channel_title || "Untitled Channel",
      subscriberCount: userChannel.subscriber_count,
      videos: toChannelVideoSamples(youtubeVideos),
      analysisContext,
    });

    if (!gemini.ok) {
      throw new Error(gemini.error);
    }

    const finishedAt = new Date().toISOString();

    const savedResult = await saveAnalysisResult({
      userId: queueRow.user_id,
      userChannelId: queueRow.user_channel_id,
      jobId: queueRow.job_id,

      channelId: queueRow.channel_id,
      channelUrl:
        queueRow.channel_url ||
        `https://www.youtube.com/channel/${queueRow.channel_id}`,
      channelTitle: userChannel.channel_title,
      thumbnailUrl: userChannel.thumbnail_url,

      sampleVideoCount: youtubeVideos.length,
      analysisConfidence: gemini.result.analysis_confidence,

      status: ANALYSIS_RESULT_STATUS.ANALYZED,

      geminiModel: gemini.model,
      geminiStatus: "success",
      geminiAnalyzedAt: finishedAt,
      geminiRawJson: gemini.rawJson,
      geminiAttemptCount: 1,

      channelSummary: gemini.result.channel_summary,
      contentPatternSummary: gemini.result.content_pattern_summary,
      contentPatterns: gemini.result.content_patterns,
      strengths: gemini.result.strengths,
      weaknesses: gemini.result.weaknesses,
      bottlenecks: gemini.result.bottlenecks,
      recommendedTopics: gemini.result.recommended_topics,
      growthActionPlan: gemini.result.growth_action_plan,
      targetAudience: gemini.result.target_audience,
      sampleSizeNote: gemini.result.sample_size_note,
      interpretationMode: gemini.result.interpretation_mode,

      featureSnapshot: {
        collectedVideoCount: normalizedDataset.collectedVideoCount,
        sampleVideoCount: youtubeVideos.length,
        metrics: channelMetrics,
        patterns: channelPatterns.flags,
      } as JsonValue,
      featureTotalScore: scoreResult.totalScore,
      featureSectionScores: scoreResult.sectionScores as JsonValue,
    });

    const { error: queueDoneError } = await supabase
      .from("analysis_queue")
      .update({
        status: ANALYSIS_QUEUE_STATUS.DONE,
        finished_at: finishedAt,
      })
      .eq("id", queueRow.id);

    if (queueDoneError) {
      throw new Error(`analysis_queue done update failed: ${queueDoneError.message}`);
    }

    const { error: jobDoneError } = await supabase
      .from("analysis_jobs")
      .update({
        status: ANALYSIS_JOB_STATUS.SUCCESS,
        finished_at: finishedAt,
      })
      .eq("id", queueRow.job_id);

    if (jobDoneError) {
      throw new Error(`analysis_jobs done update failed: ${jobDoneError.message}`);
    }

    const { error: channelDoneError } = await supabase
      .from("user_channels")
      .update({
        last_analyzed_at: finishedAt,
      })
      .eq("id", queueRow.user_channel_id);

    if (channelDoneError) {
      throw new Error(
        `user_channels last_analyzed_at update failed: ${channelDoneError.message}`
      );
    }

    console.log("[worker.analyze] finished", {
      queueId: queueRow.id,
      jobId: queueRow.job_id,
      finishedAt,
      analysisResultId: savedResult.id,
    });

    return NextResponse.json({
      ok: true,
      processedJob: queueRow.job_id,
      queueStatusBeforeRun: queueRow.status,
      videoCount: youtubeVideos.length,
      analysisResultId: savedResult.id,
      featureEngine: {
        collectedVideoCount: normalizedDataset.collectedVideoCount,
        totalScore: scoreResult.totalScore,
        sectionScores: scoreResult.sectionScores,
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Worker error full:", error);
    // eslint-disable-next-line no-console
    console.error(
      "Worker error message:",
      error instanceof Error ? error.message : String(error)
    );
    // eslint-disable-next-line no-console
    console.error(
      "Worker error stack:",
      error instanceof Error ? error.stack : null
    );

    try {
      if (runningQueueId && runningJobId) {
        const supabase = getAdminClient();

        await supabase
          .from("analysis_queue")
          .update({
            status: ANALYSIS_QUEUE_STATUS.FAILED,
            error_message:
              error instanceof Error
                ? error.message
                : "Unknown worker error",
            finished_at: new Date().toISOString(),
          })
          .eq("id", runningQueueId);

        await supabase
          .from("analysis_jobs")
          .update({
            status: ANALYSIS_JOB_STATUS.FAILED,
            error_message:
              error instanceof Error
                ? error.message
                : "Unknown worker error",
            finished_at: new Date().toISOString(),
          })
          .eq("id", runningJobId);
      }
    } catch (rollbackError) {
      // eslint-disable-next-line no-console
      console.error("Worker rollback error:", rollbackError);
    }

    const message =
      error instanceof Error ? error.message : "Worker failed: unknown error";
    const stack =
      error instanceof Error && process.env.NODE_ENV === "development"
        ? error.stack
        : undefined;

    return NextResponse.json(
      {
        ok: false,
        error: message,
        stack,
      },
      { status: 500 }
    );
  }
}
