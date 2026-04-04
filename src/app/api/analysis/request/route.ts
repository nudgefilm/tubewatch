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
  type AnalyzeChannelWithGeminiSuccess,
  type ChannelVideoSample,
} from "@/lib/ai/analyzeChannelWithGemini";
import { saveAnalysisResult } from "@/lib/server/analysis/saveAnalysisResult";
import { detectDeltaRun } from "@/lib/server/analysis/detectDeltaRun";
import { CURRENT_ENGINE_VERSION } from "@/lib/analysis/engineVersion";
import {
  reserveCredit,
  confirmCredit,
  rollbackCredit,
  CreditReservationError,
} from "@/lib/server/analysis/atomicCredit";
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

  if (!userChannelId) {
    console.error("[Analysis Start API] REJECTED: channelId missing");
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

  if (authError || !user) {
    console.error("[Analysis Start API] REJECTED: auth failed.", authError?.message ?? "no user");
    return NextResponse.json(
      { ok: false, error: "로그인이 필요합니다." },
      { status: 401 }
    );
  }

  // admin 판별 — profiles.role 기준, 이메일 하드코딩 없음
  const isAdmin = await isAdminUser(user.id);

  // 채널 소유권 확인
  const { data: channelRow, error: channelErr } = await supabase
    .from("user_channels")
    .select(
      "id, channel_id, channel_title, channel_url, subscriber_count, video_count, last_analyzed_at"
    )
    .eq("id", userChannelId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (channelErr) {
    console.error("[Analysis Start API] REJECTED: channel DB error:", channelErr.message, "code:", channelErr.code);
    return NextResponse.json(
      { ok: false, error: "채널 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
  if (!channelRow) {
    console.error("[Analysis Start API] REJECTED: channel not found");
    return NextResponse.json(
      { ok: false, error: "채널을 찾을 수 없습니다. 올바른 채널을 선택했는지 확인하세요." },
      { status: 404 }
    );
  }

  // 기존 스냅샷 확인 — delta 재분석 판단 + 엔진 버전 비교에 사용
  const { data: existingSnapshot } = await supabase
    .from("analysis_results")
    .select(
      "id, created_at, feature_snapshot, gemini_raw_json, gemini_model, channel_summary, content_pattern_summary, content_patterns, target_audience, strengths, weaknesses, bottlenecks, recommended_topics, growth_action_plan, sample_size_note, analysis_confidence, engine_version"
    )
    .eq("user_channel_id", userChannelId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const storedEngineVersion =
    (existingSnapshot as { engine_version?: string | null } | null)?.engine_version ?? null;
  const isEngineVersionStale =
    existingSnapshot != null && storedEngineVersion !== CURRENT_ENGINE_VERSION;

  console.log(
    "[Analysis Start API] existing snapshot:", existingSnapshot?.id ?? null,
    "engine_version:", storedEngineVersion ?? "none",
    "stale:", isEngineVersionStale
  );

  // 쿨다운 체크 — admin bypass, 엔진 버전 불일치 시 bypass
  if (!isAdmin && channelRow.last_analyzed_at) {
    const lastAt = new Date(channelRow.last_analyzed_at as string).getTime();
    const hoursElapsed = (Date.now() - lastAt) / (1000 * 60 * 60);
    if (hoursElapsed < COOLDOWN_HOURS) {
      if (isEngineVersionStale) {
        console.log("[Analysis Start API] cooldown bypassed — engine version stale:", storedEngineVersion, "→", CURRENT_ENGINE_VERSION);
      } else {
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
  } else if (isAdmin && channelRow.last_analyzed_at) {
    console.log("[Analysis Start API] admin: cooldown bypassed");
  }

  // 크레딧 예약 (Atomic) — admin bypass
  let reservationId: string | null = null;
  let isFreePlan = true;

  if (!isAdmin) {
    try {
      const reservation = await reserveCredit(user.id, userChannelId);
      reservationId = reservation.reservationId;
      isFreePlan = reservation.isFreePlan;
    } catch (e) {
      if (e instanceof CreditReservationError && e.code === "CREDITS_EXHAUSTED") {
        return NextResponse.json(
          { ok: false, code: "CREDITS_EXHAUSTED", error: e.message },
          { status: 402 }
        );
      }
      throw e;
    }
  }

  const youtubeChannelId = channelRow.channel_id as string | null;
  if (!youtubeChannelId) {
    console.error("[Analysis Start API] REJECTED: channel_id (YouTube ID) is null");
    return NextResponse.json(
      { ok: false, error: "채널에 YouTube ID가 없습니다. 채널을 삭제 후 다시 등록하세요." },
      { status: 422 }
    );
  }

  // analysis_job 선생성 — 진행 단계 추적용 (progress_step: Master Plan v1.2 § 4-1)
  const jobId = crypto.randomUUID();
  const jobStartedAt = new Date().toISOString();
  const { error: jobCreateError } = await supabaseAdmin
    .from("analysis_jobs")
    .insert({
      id: jobId,
      user_id: user.id,
      user_channel_id: userChannelId,
      status: "running",
      progress_step: "fetching_yt",
      started_at: jobStartedAt,
    });
  if (jobCreateError) {
    console.error("[Analysis Start API] job create failed:", jobCreateError.message);
    // non-blocking — 진행은 계속
  }

  async function updateJobStep(step: string, finalStatus?: string) {
    const patch: Record<string, string> = { progress_step: step };
    if (finalStatus) patch.status = finalStatus;
    if (step === "completed" || step === "failed") patch.finished_at = new Date().toISOString();
    await supabaseAdmin.from("analysis_jobs").update(patch).eq("id", jobId);
  }

  // YouTube API: 최근 영상 수집
  let youtubeVideos: VideoInfo[];
  try {
    youtubeVideos = await getRecentVideos(youtubeChannelId, 50);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    console.error("[Analysis Start API] error: getRecentVideos failed:", msg);
    void updateJobStep("failed", "failed");
    if (reservationId) void rollbackCredit(reservationId, isFreePlan);
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

  void updateJobStep("processing_data");

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
    void updateJobStep("failed", "failed");
    if (reservationId) void rollbackCredit(reservationId, isFreePlan);
    return NextResponse.json(
      { ok: false, error: "분석 파이프라인 오류가 발생했습니다. 잠시 후 다시 시도하세요." },
      { status: 500 }
    );
  }

  void updateJobStep("generating_ai");

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
        next_trend_plan: null,
        channel_dna_narrative: null,
        action_execution_hints: null,
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
      void updateJobStep("failed", "failed");
      if (reservationId) void rollbackCredit(reservationId, isFreePlan);
      return NextResponse.json(
        { ok: false, error: `AI 분석 호출 중 예외 발생: ${msg}` },
        { status: 502 }
      );
    }

    if (!gemini.ok) {
      console.error("[Analysis Start API] error: Gemini failed:", gemini.error);
      void updateJobStep("failed", "failed");
      if (reservationId) void rollbackCredit(reservationId, isFreePlan);
      return NextResponse.json(
        { ok: false, error: `AI 분석에 실패했습니다: ${gemini.error}` },
        { status: 502 }
      );
    }
  }

  // At this point gemini.ok is always true (failure paths returned early above)
  const geminiSuccess = gemini as AnalyzeChannelWithGeminiSuccess;

  const now = new Date().toISOString();

  const featureSnapshotVideos = youtubeVideos.map((v) => ({
    videoId: v.video_id,
    title: v.title,
    publishedAt: v.published_at ?? null,
    viewCount: v.view_count ?? null,
    likeCount: v.like_count ?? null,
    commentCount: v.comment_count ?? null,
    thumbnail: v.thumbnail_url ?? null,
    duration: v.duration ?? null,
    tags: v.tags ?? [],
    descriptionLength: typeof v.description === "string" ? v.description.length : 0,
    categoryId: v.category_id ?? null,
  }));

  const featureSnapshot = {
    collectedVideoCount: normalizedDataset.collectedVideoCount,
    sampleVideoCount: youtubeVideos.length,
    metrics: channelMetrics,
    patterns: channelPatterns.flags,
    videos: featureSnapshotVideos,
  };

  void updateJobStep("saving_results");

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
      analysisConfidence: geminiSuccess.result.analysis_confidence ?? null,
      status: "analyzed",
      geminiModel: geminiSuccess.model,
      geminiStatus: "completed",
      geminiAnalyzedAt: now,
      geminiRawJson: geminiSuccess.rawJson,
      geminiAttemptCount: 1,
      channelSummary: geminiSuccess.result.channel_summary,
      contentPatternSummary: geminiSuccess.result.content_pattern_summary,
      contentPatterns: geminiSuccess.result.content_patterns,
      strengths: geminiSuccess.result.strengths,
      weaknesses: geminiSuccess.result.weaknesses,
      bottlenecks: geminiSuccess.result.bottlenecks,
      recommendedTopics: geminiSuccess.result.recommended_topics,
      growthActionPlan: geminiSuccess.result.growth_action_plan,
      targetAudience: geminiSuccess.result.target_audience,
      sampleSizeNote: geminiSuccess.result.sample_size_note,
      interpretationMode: geminiSuccess.result.interpretation_mode,
      featureSnapshot: featureSnapshot as unknown as import("@/lib/server/analysis/storageTypes").JsonValue,
      featureTotalScore: scoreResult.totalScore,
      featureSectionScores: scoreResult.sectionScores as unknown as import("@/lib/server/analysis/storageTypes").JsonValue,
      engineVersion: CURRENT_ENGINE_VERSION,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    console.error("[Analysis Start API] error: insert failed:", msg);
    void updateJobStep("failed", "failed");
    if (reservationId) void rollbackCredit(reservationId, isFreePlan);
    return NextResponse.json(
      { ok: false, error: "분석 결과 저장에 실패했습니다." },
      { status: 500 }
    );
  }

  console.log("[Analysis Start API] created run:", savedRow.id);

  // 페이지별 AI 콘텐츠를 analysis_module_results에 저장 (non-fatal)
  if (isDeltaRun && existingSnapshot?.id) {
    // Delta run: 신규 Gemini 호출 없음 → 이전 snapshot의 모듈 결과를 새 snapshot으로 복사
    const { data: prevModules, error: prevModErr } = await supabaseAdmin
      .from("analysis_module_results")
      .select("module_key, result")
      .eq("snapshot_id", existingSnapshot.id)
      .eq("user_id", user.id)
      .eq("status", "completed");

    if (prevModErr) {
      console.error("[Analysis Start API] delta: prev module_results fetch failed (non-fatal):", prevModErr.message);
    } else if (prevModules && prevModules.length > 0) {
      const copyRows = (prevModules as Array<{ module_key: string; result: Record<string, unknown> }>).map((m) => ({
        user_id: user.id,
        channel_id: userChannelId,
        snapshot_id: savedRow.id,
        module_key: m.module_key,
        result: m.result,
        status: "completed",
        analyzed_at: now,
      }));
      const { error: copyErr } = await supabaseAdmin.from("analysis_module_results").insert(copyRows);
      if (copyErr) {
        console.error("[Analysis Start API] delta: module_results copy failed (non-fatal):", copyErr.message);
      } else {
        console.log("[Analysis Start API] delta: module_results copied from", existingSnapshot.id, "→", savedRow.id, "keys:", prevModules.map((m) => m.module_key));
      }
    } else {
      console.log("[Analysis Start API] delta: no previous module_results to copy (snapshot:", existingSnapshot.id, ")");
    }
  } else {
    // Full run: Gemini 신규 호출 결과를 저장
    const modulesToSave: Array<{ module_key: string; result: Record<string, unknown> }> = [];
    if (geminiSuccess.result.next_trend_plan) {
      modulesToSave.push({ module_key: "next_trend", result: { plan: geminiSuccess.result.next_trend_plan } });
    }
    if (geminiSuccess.result.channel_dna_narrative) {
      modulesToSave.push({ module_key: "channel_dna", result: { narrative: geminiSuccess.result.channel_dna_narrative } });
    }
    if (geminiSuccess.result.action_execution_hints) {
      modulesToSave.push({ module_key: "action_plan", result: { execution_hints: geminiSuccess.result.action_execution_hints } });
    }
    if (modulesToSave.length > 0) {
      const insertRows = modulesToSave.map((m) => ({
        user_id: user.id,
        channel_id: userChannelId,
        snapshot_id: savedRow.id,
        module_key: m.module_key,
        result: m.result,
        status: "completed",
        analyzed_at: now,
      }));
      const { error: modErr } = await supabaseAdmin
        .from("analysis_module_results")
        .insert(insertRows);
      if (modErr) {
        console.error("[Analysis Start API] module_results insert failed (non-fatal):", modErr.message);
      } else {
        console.log("[Analysis Start API] module_results saved:", modulesToSave.map((m) => m.module_key));
      }
    }
  }

  void updateJobStep("completed", "success");

  // 크레딧 예약 확정 — non-fatal
  if (reservationId) void confirmCredit(reservationId, savedRow.id);

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
