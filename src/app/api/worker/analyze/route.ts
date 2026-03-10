import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  analyzeChannelWithGemini,
  type ChannelVideoSample,
} from "@/lib/ai/analyzeChannelWithGemini";
import { normalizeVideoMetrics } from "@/lib/analysis/engine/normalizeVideoMetrics";
import { buildChannelFeatures } from "@/lib/analysis/engine/buildChannelFeatures";
import { featureScoring } from "@/lib/analysis/engine/featureScoring";
import {
  ANALYSIS_QUEUE_STATUS,
  ANALYSIS_JOB_STATUS,
  ANALYSIS_RESULT_STATUS,
} from "@/lib/server/analysis/status";

type QueueRow = {
  id: string;
  job_id: string;
  user_id: string;
  user_channel_id: string;
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

function getRequiredEnv(name: string) {
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

function toNumber(value: unknown): number | null {
  if (value == null) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

async function fetchRecentVideosFromYouTube(
  channelId: string,
  maxResults = 20
): Promise<ChannelVideoSample[]> {
  const youtubeApiKey = getRequiredEnv("YOUTUBE_API_KEY");

  const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
  searchUrl.searchParams.set("key", youtubeApiKey);
  searchUrl.searchParams.set("part", "snippet");
  searchUrl.searchParams.set("channelId", channelId);
  searchUrl.searchParams.set("order", "date");
  searchUrl.searchParams.set("type", "video");
  searchUrl.searchParams.set("maxResults", String(maxResults));

  const searchRes = await fetch(searchUrl.toString(), {
    method: "GET",
    cache: "no-store",
  });

  if (!searchRes.ok) {
    const text = await searchRes.text();
    throw new Error(`YouTube search API failed: ${searchRes.status} ${text}`);
  }

  const searchJson = await searchRes.json();

  const videoIds: string[] = (searchJson.items || [])
    .map((item: any) => item?.id?.videoId)
    .filter(Boolean);

  if (videoIds.length === 0) {
    return [];
  }

  const videosUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
  videosUrl.searchParams.set("key", youtubeApiKey);
  videosUrl.searchParams.set("part", "snippet,statistics,contentDetails");
  videosUrl.searchParams.set("id", videoIds.join(","));

  const videosRes = await fetch(videosUrl.toString(), {
    method: "GET",
    cache: "no-store",
  });

  if (!videosRes.ok) {
    const text = await videosRes.text();
    throw new Error(`YouTube videos API failed: ${videosRes.status} ${text}`);
  }

  const videosJson = await videosRes.json();

  const result: ChannelVideoSample[] = (videosJson.items || []).map((item: any) => ({
    videoId: item.id,
    title: item?.snippet?.title || "",
    publishedAt: item?.snippet?.publishedAt || null,
    viewCount: toNumber(item?.statistics?.viewCount),
    likeCount: toNumber(item?.statistics?.likeCount),
    commentCount: toNumber(item?.statistics?.commentCount),
    duration: item?.contentDetails?.duration || null,
    description: item?.snippet?.description || "",
    thumbnail:
      item?.snippet?.thumbnails?.high?.url ||
      item?.snippet?.thumbnails?.medium?.url ||
      item?.snippet?.thumbnails?.default?.url ||
      null,
    tags: Array.isArray(item?.snippet?.tags) ? item.snippet.tags : [],
    categoryId: item?.snippet?.categoryId || null,
  }));

  result.sort((a, b) => {
    const aTime = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const bTime = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return bTime - aTime;
  });

  return result.slice(0, maxResults);
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
      .select("id, job_id, user_id, user_channel_id, status")
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
        status: ANALYSIS_JOB_STATUS.PROCESSING,
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

    const videos = await fetchRecentVideosFromYouTube(userChannel.channel_id, 20);

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
      videos: videos.map((video) => ({
        video_id: video.videoId,
        title: video.title,
        description: video.description ?? "",
        published_at: video.publishedAt,
        thumbnail: video.thumbnail ?? null,
        view_count: video.viewCount,
        like_count: video.likeCount,
        comment_count: video.commentCount,
        duration: video.duration,
        tags: video.tags ?? [],
        category_id: video.categoryId ?? null,
      })),
    });

    const featureMap = buildChannelFeatures(normalizedDataset);
    const scoreResult = featureScoring(featureMap);

    const analysisInsertPayload = {
      job_id: queueRow.job_id,
      queue_id: queueRow.id,
      user_id: queueRow.user_id,
      user_channel_id: queueRow.user_channel_id,
      channel_id: userChannel.channel_id,
      channel_title: userChannel.channel_title,
      thumbnail_url: userChannel.thumbnail_url,
      subscriber_count: userChannel.subscriber_count,
      sample_video_count: videos.length,
      analysis_confidence:
        videos.length >= 15 ? "high" : videos.length >= 8 ? "medium" : "low",
      raw_videos_payload: videos,
      feature_snapshot: featureMap,
      feature_total_score: scoreResult.totalScore,
      feature_section_scores: scoreResult.sectionScores,
      status: ANALYSIS_RESULT_STATUS.COLLECTED,
      collected_at: new Date().toISOString(),
      gemini_status: "pending",
      gemini_error: null,
      gemini_skipped_reason: null,
    };

    const { data: analysisResult, error: analysisInsertError } = await supabase
      .from("analysis_results")
      .upsert(analysisInsertPayload, { onConflict: "job_id" })
      .select("id, job_id, queue_id, gemini_status, gemini_attempt_count")
      .single<AnalysisResultRow>();

    if (analysisInsertError) {
      throw new Error(`analysis_results upsert failed: ${analysisInsertError.message}`);
    }

    if (!analysisResult) {
      throw new Error("analysis_results upsert returned no row");
    }

    console.log("[worker.analyze] analysis result upserted", {
      analysisResultId: analysisResult.id,
      queueId: queueRow.id,
      jobId: queueRow.job_id,
      videoCount: videos.length,
    });

    const gemini = await analyzeChannelWithGemini({
      channelTitle: userChannel.channel_title || "Untitled Channel",
      subscriberCount: userChannel.subscriber_count,
      videos,
    });

    if (!gemini.ok) {
      const { error: geminiFailSaveError } = await supabase
        .from("analysis_results")
        .update({
          gemini_status: "failed",
          gemini_model: gemini.model,
          gemini_error: gemini.error,
          gemini_analyzed_at: new Date().toISOString(),
          gemini_raw_json: gemini.rawJson,
          gemini_attempt_count: (analysisResult.gemini_attempt_count ?? 0) + 1,
          gemini_skipped_reason: null,
          status: ANALYSIS_RESULT_STATUS.FAILED,
        })
        .eq("id", analysisResult.id);

      if (geminiFailSaveError) {
        throw new Error(
          `analysis_results gemini fail update failed: ${geminiFailSaveError.message}`
        );
      }

      throw new Error(gemini.error);
    }

    const { error: geminiSaveError } = await supabase
      .from("analysis_results")
      .update({
        gemini_status: "success",
        gemini_model: gemini.model,
        gemini_error: null,
        gemini_analyzed_at: new Date().toISOString(),
        channel_summary: gemini.result.channel_summary,
        content_pattern_summary: gemini.result.content_pattern_summary,
        content_patterns: gemini.result.content_patterns,
        strengths: gemini.result.strengths,
        weaknesses: gemini.result.weaknesses,
        bottlenecks: gemini.result.bottlenecks,
        recommended_topics: gemini.result.recommended_topics,
        growth_action_plan: gemini.result.growth_action_plan,
        target_audience: gemini.result.target_audience,
        interpretation_mode: gemini.result.interpretation_mode,
        sample_size_note: gemini.result.sample_size_note,
        gemini_raw_json: gemini.rawJson,
        gemini_attempt_count: (analysisResult.gemini_attempt_count ?? 0) + 1,
        gemini_skipped_reason: null,
        status: ANALYSIS_RESULT_STATUS.ANALYZED,
      })
      .eq("id", analysisResult.id);

    if (geminiSaveError) {
      throw new Error(`analysis_results gemini update failed: ${geminiSaveError.message}`);
    }

    const finishedAt = new Date().toISOString();

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
      analysisResultId: analysisResult.id,
    });

    return NextResponse.json({
      ok: true,
      processedJob: queueRow.job_id,
      queueStatusBeforeRun: queueRow.status,
      videoCount: videos.length,
      analysisResultId: analysisResult.id,
      featureEngine: {
        collectedVideoCount: normalizedDataset.collectedVideoCount,
        totalScore: scoreResult.totalScore,
        sectionScores: scoreResult.sectionScores,
      },
    });
  } catch (error: any) {
    console.error("Worker error full:", error);
    console.error("Worker error message:", error?.message);
    console.error("Worker error stack:", error?.stack);

    try {
      if (runningQueueId && runningJobId) {
        const supabase = getAdminClient();

        await supabase
          .from("analysis_queue")
          .update({
            status: ANALYSIS_QUEUE_STATUS.FAILED,
            error_message: error?.message || "Unknown worker error",
            finished_at: new Date().toISOString(),
          })
          .eq("id", runningQueueId);

        await supabase
          .from("analysis_jobs")
          .update({
            status: ANALYSIS_JOB_STATUS.FAILED,
            error_message: error?.message || "Unknown worker error",
            finished_at: new Date().toISOString(),
          })
          .eq("id", runningJobId);

        const { data: resultRow } = await supabase
          .from("analysis_results")
          .select("id")
          .eq("job_id", runningJobId)
          .maybeSingle();

        if (resultRow?.id) {
          await supabase
            .from("analysis_results")
            .update({
              gemini_status: "failed",
              gemini_error: error?.message || "Unknown worker error",
              status: ANALYSIS_RESULT_STATUS.FAILED,
            })
            .eq("id", resultRow.id);
        }
      }
    } catch (rollbackError) {
      console.error("Worker rollback error:", rollbackError);
    }

    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Worker failed",
        stack: process.env.NODE_ENV === "development" ? error?.stack : undefined,
      },
      { status: 500 }
    );
  }
}