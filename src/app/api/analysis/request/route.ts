/**
 * POST /api/analysis/request
 *
 * 등록 채널에 대해 베이스 분석(analysis_results)을 실행한다.
 * YouTube API + Gemini AI 호출 후 analysis_results에 저장.
 * 쿨다운: last_analyzed_at 기준 12시간.
 */
export const maxDuration = 300; // Vercel Pro — waitUntil 원페이퍼 생성 포함

import { NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { createClient } from "@/lib/supabase/server";
import { buildAnalysisReportPrompt, callGeminiForAnalysisReport } from "@/lib/server/onepager/generateAnalysisReport";
import { buildChannelDnaReportPrompt, callGeminiForChannelDnaReport } from "@/lib/server/onepager/generateChannelDnaReport";
import { buildStrategyPlanPrompt, callGeminiForStrategyPlan } from "@/lib/server/onepager/generateStrategyPlan";
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
  // forceFullRun: admin 전용 — delta 감지 무시하고 Gemini 신규 호출 강제
  const forceFullRun = raw.forceFullRun === true;

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
      "id, created_at, feature_snapshot, gemini_raw_json, gemini_model, channel_summary, content_pattern_summary, content_patterns, target_audience, strengths, weaknesses, bottlenecks, recommended_topics, growth_action_plan, sample_size_note, analysis_confidence, engine_version, feature_total_score, feature_section_scores"
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
      if (e instanceof CreditReservationError) {
        if (e.code === "CREDITS_EXHAUSTED") {
          return NextResponse.json(
            { ok: false, code: "CREDITS_EXHAUSTED", error: e.message },
            { status: 402 }
          );
        }
        // RPC 오류 등 — 500이지만 JSON으로 반환해 프론트에서 메시지 표시
        console.error("[Analysis Start API] credit reservation error:", e.code, e.message);
        return NextResponse.json(
          { ok: false, code: e.code, error: `크레딧 예약 중 오류가 발생했습니다. (${e.message})` },
          { status: 500 }
        );
      }
      // CreditReservationError가 아닌 예외 (user_credits DB 오류 등)
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[Analysis Start API] unexpected credit error:", msg);
      return NextResponse.json(
        { ok: false, error: `크레딧 처리 중 오류가 발생했습니다. (${msg})` },
        { status: 500 }
      );
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

  // YouTube API: 영상 수집
  // - 첫 분석(스냅샷 없음): 50개 전체 수집
  // - 재분석: 최근 15개만 수집해 신규 감지 → 신규 + 기존 스냅샷 영상 합산
  const FULL_FETCH = 50;
  const DELTA_FETCH = 15;
  const fetchCount = existingSnapshot ? DELTA_FETCH : FULL_FETCH;

  let youtubeVideos: VideoInfo[];
  try {
    youtubeVideos = await getRecentVideos(youtubeChannelId, fetchCount);
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
  console.log(`[Analysis/pipe-1/collect] youtubeVideos: ${youtubeVideos.length} (fetchCount=${fetchCount})`);
  if (youtubeVideos.length === 0) {
    console.warn("[Analysis/pipe-1/collect] WARNING: YouTube API returned 0 videos — featureSnapshot.videos will be empty");
  }

  // Delta 감지: 신규 영상이 없으면 Gemini 스킵 (detectDeltaRun.ts 참고)
  // forceFullRun(admin 전용)이면 delta 무시하고 항상 Gemini 신규 호출
  const { isDeltaRun: _isDeltaRunRaw, prevKnownCount, newVideoCount } = detectDeltaRun(
    existingSnapshot?.feature_snapshot,
    youtubeVideos.map((v) => v.video_id)
  );
  const isDeltaRun = _isDeltaRunRaw && !(isAdmin && forceFullRun);
  console.log(`[Analysis/delta] prev_known=${prevKnownCount} new=${newVideoCount} skip_gemini=${isDeltaRun}${isAdmin && forceFullRun ? " (force-bypassed by admin)" : ""}`);

  // 재분석 시 기존 스냅샷 영상과 합산 (description은 스냅샷에 미저장 → 빈 문자열)
  if (existingSnapshot) {
    type SnapVideo = {
      videoId: string; title: string; publishedAt: string | null;
      viewCount: number | null; likeCount: number | null; commentCount: number | null;
      thumbnail: string | null; duration: string | null; tags: string[]; categoryId: string | null;
    };
    const snapVideos: SnapVideo[] = (
      (existingSnapshot.feature_snapshot as Record<string, unknown>)?.videos as SnapVideo[] | undefined
    ) ?? [];
    const fetchedIds = new Set(youtubeVideos.map((v) => v.video_id));
    const reusable: VideoInfo[] = snapVideos
      .filter((v) => !fetchedIds.has(v.videoId))
      .map((v) => ({
        video_id: v.videoId,
        title: v.title,
        description: "",
        published_at: v.publishedAt,
        view_count: v.viewCount,
        like_count: v.likeCount,
        comment_count: v.commentCount,
        thumbnail_url: v.thumbnail,
        duration: v.duration,
        tags: v.tags ?? [],
        category_id: v.categoryId,
      }));
    // 신규 영상 앞에, 기존 영상 이어서 — 최대 50개
    youtubeVideos = [...youtubeVideos, ...reusable].slice(0, FULL_FETCH);
    console.log(`[Analysis/pipe-1/merge] merged total=${youtubeVideos.length} (new=${youtubeVideos.length - reusable.length} reused=${reusable.length})`);
  };

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
      const isOverloaded = typeof gemini.error === "string" &&
        (gemini.error.includes("high demand") || gemini.error.includes("503") ||
         gemini.error.includes("UNAVAILABLE") || gemini.error.includes("overloaded"));
      const userMessage = isOverloaded
        ? "튜브워치 엔진은 정상 가동 중이나, 연동된 LLM 서버의 일시적인 분석 요청 폭주로 지연이 발생하고 있습니다. 튜브워치 외부 통신 문제이오니 약 1~2분 뒤에 다시 시도해 주시기 바랍니다."
        : `AI 분석에 실패했습니다: ${gemini.error}`;
      return NextResponse.json(
        { ok: false, error: userMessage },
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
  // needsOnepagerGeneration: waitUntil one-pager 생성 필요 여부
  // - full run: 항상 true
  // - delta + 점수 동일 + copy 성공: false (기존 one-pager 재사용)
  // - delta + 점수 변화 또는 copy 실패: true (재생성)
  let needsOnepagerGeneration = true;

  if (isDeltaRun && existingSnapshot?.id) {
    // Delta run: 총점 + 구성 점수 비교 → 메트릭 변화 없으면 이전 one-pager 복사
    // key 순서 무관한 안전한 비교 (Object.entries().sort())
    const isSectionScoresEqual = (
      a: Record<string, unknown> | null | undefined,
      b: Record<string, unknown> | null | undefined
    ): boolean =>
      JSON.stringify(Object.entries(a ?? {}).sort()) ===
      JSON.stringify(Object.entries(b ?? {}).sort());

    const prevTotalScore = (existingSnapshot as Record<string, unknown>).feature_total_score as number | null ?? null;
    const prevSectionScores = (existingSnapshot as Record<string, unknown>).feature_section_scores as Record<string, unknown> | null ?? null;
    const metricsChanged =
      prevTotalScore !== scoreResult.totalScore ||
      !isSectionScoresEqual(prevSectionScores, scoreResult.sectionScores as Record<string, unknown>);

    console.log("[delta-run]", {
      snapshot_id: savedRow.id,
      prevScore: prevTotalScore,
      currentScore: scoreResult.totalScore,
      sectionScoresChanged: !isSectionScoresEqual(prevSectionScores, scoreResult.sectionScores as Record<string, unknown>),
      metricsChanged,
      willCopyModules: !metricsChanged,
    });

    if (!metricsChanged) {
      // 점수 동일 → 이전 snapshot one-pager 복사 (Gemini 비용 절약)
      const { data: prevModules, error: prevModErr } = await supabaseAdmin
        .from("analysis_module_results")
        .select("module_key, result")
        .eq("snapshot_id", existingSnapshot.id)
        .eq("user_id", user.id)
        .eq("status", "completed");

      if (prevModErr) {
        console.error("[Analysis Start API] delta: prev module_results fetch failed (non-fatal):", prevModErr.message);
        // 복사 실패 → waitUntil에서 재생성
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
          // 복사 실패 → waitUntil에서 재생성
        } else {
          const copiedKeys = (prevModules as Array<{ module_key: string; result: Record<string, unknown> }>).map((m) => m.module_key);
          const nextTrendCopied = copiedKeys.includes("next_trend");
          console.log("[Analysis Start API] delta: module_results copied from", existingSnapshot.id, "→", savedRow.id, "keys:", copiedKeys, "nextTrendCopied:", nextTrendCopied);
          // next_trend까지 복사된 경우에만 waitUntil 건너뜀 — 누락 시 재생성 필요
          needsOnepagerGeneration = !nextTrendCopied;
        }
      } else {
        console.log("[Analysis Start API] delta: no previous module_results to copy (snapshot:", existingSnapshot.id, ") — will trigger waitUntil generation");
        // 복사할 게 없으면 waitUntil에서 새로 생성
      }
    } else {
      // 메트릭 변화 있음 → one-pager 재생성 필요 (waitUntil 블록에서 처리)
      console.log("[Analysis Start API] delta: metrics changed — skipping module copy, will regenerate via waitUntil");
    }
  } else {
    // Full run: Gemini 신규 호출 결과를 저장
    const modulesToSave: Array<{ module_key: string; result: Record<string, unknown> }> = [];
    // next_trend: plan이 null이어도 row는 항상 저장 (빈 화면 대신 '준비 중' 상태 유도)
    modulesToSave.push({ module_key: "next_trend", result: { plan: geminiSuccess.result.next_trend_plan ?? null } });
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

  // 원페이퍼 3개를 메인 분석 응답 반환 후 백그라운드에서 순차 생성
  // Vercel Pro maxDuration=300 — waitUntil로 응답 차단 없이 실행
  // delta + 점수 동일 + copy 성공이면 needsOnepagerGeneration=false → 건너뜀
  if (needsOnepagerGeneration) {
    const snapshotId = savedRow.id;
    const rawJson = geminiSuccess.rawJson;
    const ONEPAGER_KEYS = ["analysis_report", "channel_dna_report", "strategy_plan", "next_trend"] as const;

    // pending pre-insert: waitUntil 실행 전 모듈을 pending으로 선점
    // completed 상태는 절대 덮어쓰지 않음 (재요청 / race condition 보호)
    const { data: existingMods } = await supabaseAdmin
      .from("analysis_module_results")
      .select("module_key, status")
      .eq("snapshot_id", snapshotId)
      .in("module_key", ONEPAGER_KEYS);

    const existingMap = Object.fromEntries(
      (existingMods ?? []).map((m: { module_key: string; status: string }) => [m.module_key, m.status])
    );

    const pendingRows = ONEPAGER_KEYS
      .filter((key) => existingMap[key] !== "completed")
      .map((key) => ({
        user_id: user.id, channel_id: userChannelId, snapshot_id: snapshotId,
        module_key: key, status: "pending", started_at: now,
        result: {}, analyzed_at: now,
      }));

    if (pendingRows.length > 0) {
      await supabaseAdmin.from("analysis_module_results")
        .upsert(pendingRows, { onConflict: "snapshot_id,module_key" });
    }

    console.log("[onepager-preinsert]", {
      snapshot_id: snapshotId,
      skipped_completed: ONEPAGER_KEYS.filter((k) => existingMap[k] === "completed"),
      pending_inserted: pendingRows.map((r) => r.module_key),
    });

    // runModule: markdown 결과를 { markdown } 형태로 저장
    // runModulePlan: 임의 result 객체를 저장 (next_trend 등 구조화 데이터용)
    // 공통 원칙: .neq("status","completed") → completed row 역전 차단
    const runModule = async (
      fn: () => Promise<string | null>,
      moduleKey: string
    ): Promise<void> => {
      const start = Date.now();
      try {
        const markdown = await fn();
        if (!markdown) throw new Error("empty markdown");

        await supabaseAdmin.from("analysis_module_results")
          .update({
            status: "completed",
            result: { markdown },
            analyzed_at: new Date().toISOString(),
          })
          .eq("snapshot_id", snapshotId)
          .eq("module_key", moduleKey)
          .neq("status", "completed");

        console.log("[onepager-latency]", {
          module: moduleKey, duration: Date.now() - start, status: "completed"
        });
      } catch (e) {
        await supabaseAdmin.from("analysis_module_results")
          .update({
            status: "failed",
            error_message: String(e).slice(0, 500),
          })
          .eq("snapshot_id", snapshotId)
          .eq("module_key", moduleKey)
          .neq("status", "completed");

        console.error("[onepager-latency]", {
          module: moduleKey, duration: Date.now() - start,
          status: "failed", error: String(e).slice(0, 200)
        });
        throw e;
      }
    };

    const runModulePlan = async (
      fn: () => Promise<Record<string, unknown>>,
      moduleKey: string
    ): Promise<void> => {
      const start = Date.now();
      try {
        const result = await fn();
        await supabaseAdmin.from("analysis_module_results")
          .update({
            status: "completed",
            result,
            analyzed_at: new Date().toISOString(),
          })
          .eq("snapshot_id", snapshotId)
          .eq("module_key", moduleKey)
          .neq("status", "completed");

        console.log("[onepager-latency]", {
          module: moduleKey, duration: Date.now() - start, status: "completed"
        });
      } catch (e) {
        await supabaseAdmin.from("analysis_module_results")
          .update({
            status: "failed",
            error_message: String(e).slice(0, 500),
          })
          .eq("snapshot_id", snapshotId)
          .eq("module_key", moduleKey)
          .neq("status", "completed");

        console.error("[onepager-latency]", {
          module: moduleKey, duration: Date.now() - start,
          status: "failed", error: String(e).slice(0, 200)
        });
        throw e;
      }
    };

    // 이미 completed인 모듈은 Gemini 재호출 없이 건너뜀 (비용 절약)
    const modulesToRun = ONEPAGER_KEYS.filter((k) => existingMap[k] !== "completed");

    waitUntil((async () => {
      // Promise.allSettled 병렬 실행 — 각 모듈 성공/실패 독립 처리
      const results = await Promise.allSettled(
        modulesToRun.map((key) => {
          switch (key) {
            case "analysis_report":
              return runModule(
                () => callGeminiForAnalysisReport(buildAnalysisReportPrompt({
                  gemini_raw_json: rawJson,
                  feature_snapshot: featureSnapshot,
                  channel_title: channelRow.channel_title,
                  feature_total_score: scoreResult.totalScore,
                })),
                key
              );
            case "channel_dna_report":
              return runModule(
                () => callGeminiForChannelDnaReport(buildChannelDnaReportPrompt({
                  gemini_raw_json: rawJson,
                  feature_snapshot: featureSnapshot,
                  channel_title: channelRow.channel_title,
                })),
                key
              );
            case "strategy_plan":
              return runModule(
                () => callGeminiForStrategyPlan(buildStrategyPlanPrompt({
                  gemini_raw_json: rawJson,
                  feature_snapshot: featureSnapshot,
                  channel_title: channelRow.channel_title,
                })),
                key
              );
            case "next_trend":
              return runModulePlan(async () => {
                // rawJson에서 next_trend_plan 추출 (Gemini 재호출 없음)
                let plan: unknown = null;
                try {
                  const parsed = typeof rawJson === "string" ? JSON.parse(rawJson) : (rawJson ?? {});
                  plan = (parsed as Record<string, unknown>)?.next_trend_plan ?? null;
                } catch {
                  plan = null;
                }
                return { plan };
              }, key);
          }
        })
      );

      console.log("[onepager-allsettled]", {
        snapshot_id: snapshotId,
        results: results.map((r, i) => ({
          module: modulesToRun[i],
          outcome: r.status,
          reason: r.status === "rejected" ? String(r.reason).slice(0, 200) : undefined,
        })),
      });
    })());
  }

  return NextResponse.json({
    ok: true,
    analysisResultId: savedRow.id,
  });
}
