export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
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
 *   { summary: string }                  — 성공
 *   { noAnalysis: true }                 — 분석 데이터 없음 (모달에서 안내 처리)
 *   { error: string }         status 4xx/5xx
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

    // ── 3. 최신 analysis_results 조회 ────────────────────────────────────────
    const { data: snap, error: snapError } = await supabase
      .from("analysis_results")
      .select(
        "id, channel_title, gemini_raw_json, feature_total_score, feature_section_scores, feature_snapshot, created_at"
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

    // ── 4. 채널명 조회 (user_channels 직접 조회 — analysis_results 값보다 신뢰도 높음) ──
    const { data: channelRow } = await supabase
      .from("user_channels")
      .select("channel_title")
      .eq("id", userChannelId)
      .eq("user_id", user.id)
      .maybeSingle();

    const channelTitle: string | null =
      (channelRow?.channel_title as string | null | undefined) ?? null;

    // ── 5. 프롬프트 빌드 + Gemini 호출 ───────────────────────────────────────
    const prompt = buildIntegratedSummaryPrompt(snap as Record<string, unknown>);
    const summary = await callGeminiForIntegratedSummary(prompt);

    if (!summary) {
      console.error("[integrated-summary] Gemini returned null for channel:", userChannelId);
      return NextResponse.json(
        { error: "AI 요약 생성에 실패했습니다. 잠시 후 다시 시도해 주세요." },
        { status: 502 }
      );
    }

    return NextResponse.json({ summary, channelTitle });
  } catch (e) {
    console.error("[integrated-summary] unexpected error:", e);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
