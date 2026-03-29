/**
 * POST /api/analysis/request
 *
 * 등록 채널에 대해 베이스 분석(analysis_results)을 실행한다.
 * YouTube API + Gemini AI 호출 후 analysis_results에 저장.
 * 쿨다운: last_analyzed_at 기준 72시간.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getRecentVideos } from "@/lib/youtube";
import { normalizeVideoMetrics } from "@/lib/analysis/engine/normalizeVideoMetrics";
import { buildChannelFeatures } from "@/lib/analysis/engine/buildChannelFeatures";
import { featureScoring } from "@/lib/analysis/engine/featureScoring";
import { computeChannelMetrics } from "@/lib/analysis/engine/computeChannelMetrics";
import { detectPatterns } from "@/lib/analysis/engine/detectPatterns";
import { buildAnalysisContext } from "@/lib/analysis/engine/buildAnalysisContext";
import {
  analyzeChannelWithGemini,
  type ChannelVideoSample,
} from "@/lib/ai/analyzeChannelWithGemini";
import { saveAnalysisResult } from "@/lib/server/analysis/saveAnalysisResult";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { VideoInfo } from "@/lib/youtube";

const COOLDOWN_HOURS = 72;

function toChannelVideoSamples(videos: VideoInfo[]): ChannelVideoSample[] {
  return videos.map((v) => ({
    videoId: v.video_id,
    title: v.title,
    publishedAt: v.published_at,
    viewCount: v.view_count,
    likeCount: v.like_count,
    commentCount: v.comment_count,
    duration: v.duration,
    description: v.description,
    thumbnail: v.thumbnail_url ?? null,
    tags: v.tags,
    categoryId: v.category_id,
  }));
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "요청 본문을 읽을 수 없습니다." },
      { status: 400 }
    );
  }

  const raw = body as Record<string, unknown>;
  const userChannelId =
    typeof raw.user_channel_id === "string" ? raw.user_channel_id.trim() : "";

  console.log("[Analysis Start API] request body:", JSON.stringify(body));

  if (!userChannelId) {
    return NextResponse.json(
      { ok: false, error: "user_channel_id가 필요합니다." },
      { status: 400 }
    );
  }

  // 인증
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  console.log("[Analysis Start API] user:", user ? { id: user.id } : null);

  if (authError || !user) {
    return NextResponse.json(
      { ok: false, error: "로그인이 필요합니다." },
      { status: 401 }
    );
  }

  // 채널 소유권 확인
  const { data: channelRow, error: channelErr } = await supabase
    .from("user_channels")
    .select(
      "id, channel_id, channel_title, channel_url, subscriber_count, video_count, last_analyzed_at"
    )
    .eq("id", userChannelId)
    .eq("user_id", user.id)
    .maybeSingle();

  console.log("[Analysis Start API] channelId:", channelRow?.channel_id ?? null);

  if (channelErr || !channelRow) {
    return NextResponse.json(
      { ok: false, error: "채널을 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  // 쿨다운 체크
  if (channelRow.last_analyzed_at) {
    const lastAt = new Date(channelRow.last_analyzed_at as string).getTime();
    const hoursElapsed = (Date.now() - lastAt) / (1000 * 60 * 60);
    if (hoursElapsed < COOLDOWN_HOURS) {
      const remaining = Math.ceil(COOLDOWN_HOURS - hoursElapsed);
      console.log(`[Analysis Start API] cooldown active: ${remaining}h remaining`);
      return NextResponse.json(
        {
          ok: false,
          code: "COOLDOWN_ACTIVE",
          error: `분석은 ${remaining}시간 후에 다시 요청할 수 있습니다.`,
        },
        { status: 429 }
      );
    }
  }

  // 기존 스냅샷 확인 (로그용)
  const { data: existingSnapshot } = await supabase
    .from("analysis_results")
    .select("id, created_at")
    .eq("user_channel_id", userChannelId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  console.log(
    "[Analysis Start API] existing snapshot:",
    existingSnapshot?.id ?? null
  );

  const youtubeChannelId = channelRow.channel_id as string | null;
  if (!youtubeChannelId) {
    return NextResponse.json(
      { ok: false, error: "YouTube 채널 ID가 없습니다." },
      { status: 422 }
    );
  }

  // YouTube API: 최근 영상 수집
  let youtubeVideos: VideoInfo[];
  try {
    youtubeVideos = await getRecentVideos(youtubeChannelId, 20);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    console.error("[Analysis Start API] error: getRecentVideos failed:", msg);
    return NextResponse.json(
      { ok: false, error: "YouTube 영상 데이터를 가져오지 못했습니다." },
      { status: 502 }
    );
  }

  // 분석 파이프라인
  const normalizedDataset = normalizeVideoMetrics({
    channel: {
      youtube_channel_id: youtubeChannelId,
      title: (channelRow.channel_title as string | null) ?? "",
      description: "",
      published_at: null,
      subscriber_count: (channelRow.subscriber_count as number | null) ?? null,
      video_count: (channelRow.video_count as number | null) ?? null,
      view_count: null,
    },
    videos: youtubeVideos.map((v) => ({
      video_id: v.video_id,
      title: v.title,
      description: v.description,
      published_at: v.published_at,
      thumbnail: v.thumbnail_url,
      view_count: v.view_count,
      like_count: v.like_count,
      comment_count: v.comment_count,
      duration: v.duration,
      tags: v.tags,
      category_id: v.category_id,
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
      subscriberCount:
        (channelRow.subscriber_count as number | null) ?? undefined,
      sampleVideoCount: youtubeVideos.length,
      collectedVideoCount: normalizedDataset.collectedVideoCount,
    }
  );

  // Gemini AI 분석
  const gemini = await analyzeChannelWithGemini({
    channelTitle:
      (channelRow.channel_title as string | null) ?? "Untitled Channel",
    subscriberCount: (channelRow.subscriber_count as number | null) ?? null,
    videos: toChannelVideoSamples(youtubeVideos),
    analysisContext,
  });

  if (!gemini.ok) {
    console.error("[Analysis Start API] error: Gemini failed:", gemini.error);
    return NextResponse.json(
      { ok: false, error: "AI 분석에 실패했습니다. 잠시 후 다시 시도하세요." },
      { status: 502 }
    );
  }

  const now = new Date().toISOString();

  const featureSnapshot = {
    collectedVideoCount: normalizedDataset.collectedVideoCount,
    sampleVideoCount: youtubeVideos.length,
    metrics: channelMetrics,
    patterns: channelPatterns.flags,
    videos: youtubeVideos.map((v) => ({
      title: v.title,
      publishedAt: v.published_at ?? null,
      viewCount: v.view_count ?? null,
      thumbnail: v.thumbnail_url ?? null,
      duration: v.duration ?? null,
    })),
  };

  // analysis_jobs 선삽입 (FK 제약 충족)
  const jobId = crypto.randomUUID();
  const jobPayload = {
    id: jobId,
    user_id: user.id,
    user_channel_id: userChannelId,
    status: "success",
    started_at: now,
    finished_at: now,
  };
  console.log("[Analysis Start API] create analysis_job payload:", JSON.stringify(jobPayload));
  const { data: jobRow, error: jobError } = await supabaseAdmin
    .from("analysis_jobs")
    .insert(jobPayload)
    .select("id")
    .single();
  console.log("[Analysis Start API] create analysis_job result:", jobRow?.id ?? null);
  if (jobError || !jobRow) {
    console.error("[Analysis Start API] create analysis_job error:", JSON.stringify(jobError));
    return NextResponse.json(
      { ok: false, error: "분석 작업 생성에 실패했습니다." },
      { status: 500 }
    );
  }

  let savedRow: { id: string };
  try {
    savedRow = await saveAnalysisResult({
      userId: user.id,
      userChannelId,
      jobId,
      channelId: youtubeChannelId,
      channelUrl: (channelRow.channel_url as string | null) ?? "",
      channelTitle: (channelRow.channel_title as string | null) ?? null,
      thumbnailUrl: null,
      sampleVideoCount: youtubeVideos.length,
      analysisConfidence: gemini.result.analysis_confidence ?? null,
      status: "analyzed",
      geminiModel: gemini.model,
      geminiStatus: "completed",
      geminiAnalyzedAt: now,
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
      featureSnapshot: featureSnapshot as unknown as import("@/lib/server/analysis/storageTypes").JsonValue,
      featureTotalScore: scoreResult.totalScore,
      featureSectionScores: scoreResult.sectionScores as unknown as import("@/lib/server/analysis/storageTypes").JsonValue,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    console.error("[Analysis Start API] error: insert failed:", msg);
    return NextResponse.json(
      { ok: false, error: "분석 결과 저장에 실패했습니다." },
      { status: 500 }
    );
  }

  console.log("[Analysis Start API] created run:", savedRow.id);

  // last_analyzed_at 업데이트
  await supabase
    .from("user_channels")
    .update({ last_analyzed_at: now })
    .eq("id", userChannelId)
    .eq("user_id", user.id);

  return NextResponse.json({
    ok: true,
    analysisResultId: savedRow.id,
  });
}
