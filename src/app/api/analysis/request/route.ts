/**
 * POST /api/analysis/request
 *
 * 등록 채널에 대해 베이스 분석(analysis_results)을 실행한다.
 * YouTube API + Gemini AI 호출 후 analysis_results에 저장.
 * 쿨다운: last_analyzed_at 기준 12시간.
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
import { detectDeltaRun } from "@/lib/server/analysis/detectDeltaRun";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { isAdminUser } from "@/lib/server/isAdminUser";
import type { VideoInfo } from "@/lib/youtube";

const COOLDOWN_HOURS = 12;

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
  // 클라이언트는 { channelId } 형태로 전송한다. 구 필드명(user_channel_id)도 fallback으로 허용.
  const userChannelId =
    typeof raw.channelId === "string" && raw.channelId.trim()
      ? raw.channelId.trim()
      : typeof raw.user_channel_id === "string"
        ? raw.user_channel_id.trim()
        : "";

  console.log("[Analysis Start API] request body:", JSON.stringify(body));
  console.log("[Analysis Start API] resolved userChannelId:", userChannelId || "(empty)");

  if (!userChannelId) {
    console.error("[Analysis Start API] REJECTED: channelId missing. body keys:", Object.keys(raw));
    return NextResponse.json(
      { ok: false, error: "채널 ID가 누락되었습니다. (channelId 필드 필요)" },
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
    console.error("[Analysis Start API] REJECTED: auth failed.", authError?.message ?? "no user");
    return NextResponse.json(
      { ok: false, error: "로그인이 필요합니다." },
      { status: 401 }
    );
  }

  // admin 판별 — profiles.role 기준, 이메일 하드코딩 없음
  const isAdmin = await isAdminUser(user.id);
  console.log("[Analysis Start API] isAdmin:", isAdmin, "userId:", user.id);

  // 채널 소유권 확인
  const { data: channelRow, error: channelErr } = await supabase
    .from("user_channels")
    .select(
      "id, channel_id, channel_title, channel_url, subscriber_count, video_count, last_analyzed_at"
    )
    .eq("id", userChannelId)
    .eq("user_id", user.id)
    .maybeSingle();

  console.log("[Analysis Start API] channel lookup — userChannelId:", userChannelId, "userId:", user.id);
  console.log("[Analysis Start API] channel lookup result:", channelRow ? { id: channelRow.id, channel_id: channelRow.channel_id } : null);

  if (channelErr) {
    console.error("[Analysis Start API] REJECTED: channel DB error:", channelErr.message, "code:", channelErr.code);
    return NextResponse.json(
      { ok: false, error: "채널 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
  if (!channelRow) {
    console.error("[Analysis Start API] REJECTED: channel not found. userChannelId:", userChannelId, "userId:", user.id);
    return NextResponse.json(
      { ok: false, error: "채널을 찾을 수 없습니다. 올바른 채널을 선택했는지 확인하세요." },
      { status: 404 }
    );
  }

  // 쿨다운 체크 — admin은 bypass
  if (!isAdmin && channelRow.last_analyzed_at) {
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
  } else if (isAdmin && channelRow.last_analyzed_at) {
    console.log("[Analysis Start API] admin: cooldown bypassed");
  }

  // 기존 스냅샷 확인 — delta 재분석에서 Gemini 재사용 판단에 사용
  const { data: existingSnapshot } = await supabase
    .from("analysis_results")
    .select(
      "id, created_at, feature_snapshot, gemini_raw_json, gemini_model, channel_summary, content_pattern_summary, content_patterns, target_audience, strengths, weaknesses, bottlenecks, recommended_topics, growth_action_plan, sample_size_note, analysis_confidence"
    )
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
    console.error("[Analysis Start API] REJECTED: channel_id (YouTube ID) is null. userChannelId:", userChannelId);
    return NextResponse.json(
      { ok: false, error: "채널에 YouTube ID가 없습니다. 채널을 삭제 후 다시 등록하세요." },
      { status: 422 }
    );
  }

  // YouTube API: 최근 영상 수집
  let youtubeVideos: VideoInfo[];
  try {
    youtubeVideos = await getRecentVideos(youtubeChannelId, 50);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    console.error("[Analysis Start API] error: getRecentVideos failed:", msg);
    return NextResponse.json(
      { ok: false, error: "YouTube 영상 데이터를 가져오지 못했습니다." },
      { status: 502 }
    );
  }

  // [pipe/1] 원본 수집 직후 영상 개수
  console.log(`[Analysis/pipe-1/collect] youtubeVideos: ${youtubeVideos.length}`);
  if (youtubeVideos.length === 0) {
    console.warn("[Analysis/pipe-1/collect] WARNING: YouTube API returned 0 videos — featureSnapshot.videos will be empty");
  }

  // Delta 감지: 신규 영상이 없으면 Gemini 스킵 (detectDeltaRun.ts 참고)
  const { isDeltaRun, prevKnownCount, newVideoCount } = detectDeltaRun(
    existingSnapshot?.feature_snapshot,
    youtubeVideos.map((v) => v.video_id)
  );
  console.log(`[Analysis/delta] prev_known=${prevKnownCount} new=${newVideoCount} skip_gemini=${isDeltaRun}`);

  // 분석 파이프라인 — try/catch 없으면 unhandled throw → Next.js 500 (HTML) 반환
  let normalizedDataset: ReturnType<typeof normalizeVideoMetrics>;
  let featureMap: ReturnType<typeof buildChannelFeatures>;
  let scoreResult: ReturnType<typeof featureScoring>;
  let channelMetrics: ReturnType<typeof computeChannelMetrics>;
  let channelPatterns: ReturnType<typeof detectPatterns>;
  let analysisContext: ReturnType<typeof buildAnalysisContext>;

  try {
    normalizedDataset = normalizeVideoMetrics({
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
    featureMap = buildChannelFeatures(normalizedDataset);
    scoreResult = featureScoring(featureMap);
    channelMetrics = computeChannelMetrics(normalizedDataset);
    channelPatterns = detectPatterns(channelMetrics, featureMap);
    analysisContext = buildAnalysisContext(
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
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[Analysis Start API] PIPELINE ERROR (unhandled 500 방지):", msg);
    return NextResponse.json(
      { ok: false, error: "분석 파이프라인 오류가 발생했습니다. 잠시 후 다시 시도하세요." },
      { status: 500 }
    );
  }

  // Gemini AI 분석 — delta run(신규 영상 0개)이면 이전 스냅샷 재사용, 아니면 신규 호출
  let gemini: Awaited<ReturnType<typeof analyzeChannelWithGemini>>;

  if (isDeltaRun && existingSnapshot) {
    console.log("[Analysis/delta] Gemini skipped — reusing previous snapshot Gemini data");
    const prev = existingSnapshot;
    const rawConfidence = prev.analysis_confidence;
    const prevConfidence: "low" | "medium" | "high" =
      rawConfidence === "low" || rawConfidence === "medium" || rawConfidence === "high"
        ? rawConfidence
        : "medium";
    gemini = {
      ok: true,
      model: typeof prev.gemini_model === "string" ? prev.gemini_model : "",
      rawJson: typeof prev.gemini_raw_json === "string" ? prev.gemini_raw_json : "{}",
      result: {
        version: "",
        channel_summary: typeof prev.channel_summary === "string" ? prev.channel_summary : "",
        content_pattern_summary: typeof prev.content_pattern_summary === "string" ? prev.content_pattern_summary : "",
        content_patterns: Array.isArray(prev.content_patterns) ? (prev.content_patterns as string[]) : [],
        target_audience: Array.isArray(prev.target_audience) ? (prev.target_audience as string[]) : [],
        strengths: Array.isArray(prev.strengths) ? (prev.strengths as string[]) : [],
        weaknesses: Array.isArray(prev.weaknesses) ? (prev.weaknesses as string[]) : [],
        bottlenecks: Array.isArray(prev.bottlenecks) ? (prev.bottlenecks as string[]) : [],
        recommended_topics: Array.isArray(prev.recommended_topics) ? (prev.recommended_topics as string[]) : [],
        growth_action_plan: Array.isArray(prev.growth_action_plan) ? (prev.growth_action_plan as string[]) : [],
        analysis_confidence: prevConfidence,
        interpretation_mode: "delta",
        sample_size_note: typeof prev.sample_size_note === "string" ? prev.sample_size_note : "",
      },
    };
  } else {
    // 신규 영상 있음 or 첫 분석 — Gemini 정식 호출
    try {
      gemini = await analyzeChannelWithGemini({
        channelTitle:
          (channelRow.channel_title as string | null) ?? "Untitled Channel",
        subscriberCount: (channelRow.subscriber_count as number | null) ?? null,
        videos: toChannelVideoSamples(youtubeVideos),
        analysisContext,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[Analysis Start API] GEMINI THROW (unhandled 500 방지):", msg);
      return NextResponse.json(
        { ok: false, error: `AI 분석 호출 중 예외 발생: ${msg}` },
        { status: 502 }
      );
    }

    if (!gemini.ok) {
      console.error("[Analysis Start API] error: Gemini failed:", gemini.error);
      return NextResponse.json(
        { ok: false, error: `AI 분석에 실패했습니다: ${gemini.error}` },
        { status: 502 }
      );
    }
  }

  const now = new Date().toISOString();

  const featureSnapshotVideos = youtubeVideos.map((v) => ({
    videoId: v.video_id,
    title: v.title,
    publishedAt: v.published_at ?? null,
    viewCount: v.view_count ?? null,
    thumbnail: v.thumbnail_url ?? null,
    duration: v.duration ?? null,
  }));

  // [pipe/2] 저장 직전 영상 배열 확인
  console.log(`[Analysis/pipe-2/snapshot] featureSnapshot.videos: ${featureSnapshotVideos.length}, metrics keys: ${Object.keys(channelMetrics).length}`);
  if (featureSnapshotVideos.length > 0) {
    const sample = featureSnapshotVideos[0];
    console.log(`[Analysis/pipe-2/snapshot] sample[0]: title="${sample.title}" viewCount=${sample.viewCount} publishedAt=${sample.publishedAt}`);
  }

  const featureSnapshot = {
    collectedVideoCount: normalizedDataset.collectedVideoCount,
    sampleVideoCount: youtubeVideos.length,
    metrics: channelMetrics,
    patterns: channelPatterns.flags,
    videos: featureSnapshotVideos,
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
