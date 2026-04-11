export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  buildIntegratedSummaryPrompt,
  callGeminiForIntegratedSummary,
} from "@/lib/server/ai/generateIntegratedSummary";

/**
 * POST /api/analysis/integrated-summary
 *
 * Body: { userChannelId: string }  — user_channels.id (ChannelRow.id)
 *
 * 응답:
 *   { summary: string, snapshotId: string, channelTitle: string | null }  — 성공
 *   { noAnalysis: true }                                                  — 분석 데이터 없음
 *   { error: string }                                     status 4xx/5xx
 *
 * 캐싱 전략:
 *   analysis_results.integrated_summary 컬럼에 생성된 요약을 저장한다.
 *   이미 값이 있으면 Gemini를 재호출하지 않고 즉시 반환한다.
 *   채널 재분석 시 새 analysis_results 레코드가 생성되므로 자동으로 리셋된다.
 */
export async function POST(req: NextRequest) {
  try {
    // ── 1. 인증 ───────────────────────────────────────────────────────────────
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── 2. 요청 파싱 ──────────────────────────────────────────────────────────
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const userChannelId =
      body != null && typeof body === "object" && "userChannelId" in body
        ? String((body as Record<string, unknown>).userChannelId)
        : null;

    if (!userChannelId) {
      return NextResponse.json({ error: "userChannelId required" }, { status: 400 });
    }

    // ── 3. 최신 analysis_results 조회 (integrated_summary 포함) ──────────────
    const { data: snap, error: snapError } = await supabase
      .from("analysis_results")
      .select(
        "id, channel_title, gemini_raw_json, feature_total_score, feature_section_scores, feature_snapshot, created_at, integrated_summary"
      )
      .eq("user_id", user.id)
      .eq("user_channel_id", userChannelId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (snapError) {
      console.error("[integrated-summary] DB error:", snapError.message);
      return NextResponse.json({ error: "데이터 조회 중 오류가 발생했습니다." }, { status: 500 });
    }

    // 분석 데이터 없음 → 모달에서 친절한 안내 처리
    if (!snap) {
      return NextResponse.json({ noAnalysis: true });
    }

    // ── 4. DB 캐시 히트 — Gemini 재호출 없이 즉시 반환 ───────────────────────
    if (typeof snap.integrated_summary === "string" && snap.integrated_summary.trim() !== "") {
      // 채널명은 항상 user_channels에서 최신값으로 조회
      const { data: channelRow } = await supabase
        .from("user_channels")
        .select("channel_title")
        .eq("id", userChannelId)
        .eq("user_id", user.id)
        .maybeSingle();

      const channelTitle: string | null =
        (channelRow?.channel_title as string | null | undefined) ?? null;

      return NextResponse.json({
        summary: snap.integrated_summary,
        snapshotId: snap.id,
        channelTitle,
        cached: true,
      });
    }

    // ── 5. 채널명 조회 ────────────────────────────────────────────────────────
    const { data: channelRow } = await supabase
      .from("user_channels")
      .select("channel_title")
      .eq("id", userChannelId)
      .eq("user_id", user.id)
      .maybeSingle();

    const channelTitle: string | null =
      (channelRow?.channel_title as string | null | undefined) ?? null;

    // ── 6. 프롬프트 빌드 + Gemini 호출 ───────────────────────────────────────
    const prompt = buildIntegratedSummaryPrompt(snap as Record<string, unknown>);
    const summary = await callGeminiForIntegratedSummary(prompt);

    if (!summary) {
      console.error("[integrated-summary] Gemini returned null for channel:", userChannelId);
      return NextResponse.json(
        { error: "AI 요약 생성에 실패했습니다. 잠시 후 다시 시도해 주세요." },
        { status: 502 }
      );
    }

    // ── 7. 생성된 요약을 DB에 저장 (이후 요청부터 캐시 히트) ─────────────────
    const { error: updateError } = await supabaseAdmin
      .from("analysis_results")
      .update({ integrated_summary: summary })
      .eq("id", snap.id);

    if (updateError) {
      // 저장 실패는 치명적이지 않음 — 이번 요청은 정상 응답
      console.error("[integrated-summary] Failed to cache summary in DB:", updateError.message);
    }

    return NextResponse.json({ summary, snapshotId: snap.id, channelTitle });
  } catch (e) {
    console.error("[integrated-summary] unexpected error:", e);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
