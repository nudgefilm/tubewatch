export const dynamic = "force-dynamic";
export const maxDuration = 120; // Vercel Pro — Claude 응답 대기

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { buildReportPayload } from "@/lib/manus/prompt";
import { generateReport } from "@/lib/claude/reportClient";
import type { NormalizedVideo } from "@/lib/analysis/engine/types";

// POST /api/manus/generate
// Body: { user_channel_id: string }
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const userChannelId: string | undefined = body?.user_channel_id;
  if (!userChannelId) {
    return NextResponse.json({ error: "user_channel_id required" }, { status: 400 });
  }

  // 채널 소유권 검증
  const { data: channel } = await supabaseAdmin
    .from("user_channels")
    .select("id, channel_title, channel_id, subscriber_count, view_count, video_count, description, published_at")
    .eq("id", userChannelId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!channel) {
    return NextResponse.json({ error: "Channel not found" }, { status: 404 });
  }

  // 월 1회 제한 확인 (KST 기준)
  const yearMonth = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 7);

  const { data: existing } = await supabaseAdmin
    .from("manus_reports")
    .select("id, status, access_token, created_at")
    .eq("user_channel_id", userChannelId)
    .eq("year_month", yearMonth)
    .maybeSingle();

  if (existing) {
    if (existing.status === "completed") {
      return NextResponse.json({
        error: "already_generated",
        report_id: existing.id,
        status: existing.status,
        access_token: existing.access_token,
      }, { status: 409 });
    }

    // processing 2분 이내 → 현재 생성 중, 기존 토큰으로 안내
    if (existing.status === "processing") {
      const ageMs = Date.now() - new Date(existing.created_at).getTime();
      if (ageMs < 2 * 60 * 1000) {
        return NextResponse.json({
          error: "already_generated",
          report_id: existing.id,
          status: existing.status,
          access_token: existing.access_token,
        }, { status: 409 });
      }
    }
    // failed 또는 2분 초과 processing → 삭제 후 재생성
    await supabaseAdmin.from("manus_reports").delete().eq("id", existing.id);
  }

  // 분석 결과 조회
  const { data: result } = await supabaseAdmin
    .from("analysis_results")
    .select("id, feature_snapshot, channel_summary")
    .eq("user_channel_id", userChannelId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!result) {
    return NextResponse.json({ error: "분석 결과가 없습니다. 먼저 채널 분석을 실행해주세요." }, { status: 404 });
  }

  // 모듈 결과 조회
  const { data: moduleRows } = await supabaseAdmin
    .from("analysis_module_results")
    .select("module_key, result")
    .eq("snapshot_id", result.id)
    .eq("user_id", user.id)
    .eq("status", "completed");

  const moduleMap: Record<string, Record<string, unknown>> = {};
  for (const row of moduleRows ?? []) {
    moduleMap[row.module_key] = row.result as Record<string, unknown>;
  }

  const snapshot = result.feature_snapshot as {
    channel?: { description?: string; publishedAt?: string };
    videos?: NormalizedVideo[];
    metrics?: {
      avgViewCount: number; medianViewCount: number; avgLikeRatio: number;
      avgCommentRatio: number; avgVideoDuration: number; avgUploadIntervalDays: number;
      recent30dUploadCount: number; avgTitleLength: number; avgTagCount: number;
    };
  } | null;

  const payload = buildReportPayload({
    channelName: channel.channel_title ?? "채널",
    channelDescription: snapshot?.channel?.description ?? channel.description ?? "",
    subscriberCount: channel.subscriber_count ?? 0,
    totalViewCount: channel.view_count ?? 0,
    videoCount: channel.video_count ?? 0,
    publishedAt: snapshot?.channel?.publishedAt ?? channel.published_at ?? null,
    metrics: snapshot?.metrics ?? {
      avgViewCount: 0, medianViewCount: 0, avgLikeRatio: 0, avgCommentRatio: 0,
      avgVideoDuration: 0, avgUploadIntervalDays: 0, recent30dUploadCount: 0,
      avgTitleLength: 0, avgTagCount: 0,
    },
    videos: snapshot?.videos ?? [],
    channelDna: moduleMap["channel_dna"] ?? null,
    actionPlan: moduleMap["action_plan"] ?? null,
    nextTrend: moduleMap["next_trend"] ?? null,
  });

  // DB에 processing 상태로 삽입
  const { data: reportRow, error: insertError } = await supabaseAdmin
    .from("manus_reports")
    .insert({
      user_id: user.id,
      user_channel_id: userChannelId,
      snapshot_id: result.id,
      year_month: yearMonth,
      status: "processing",
    })
    .select("id, access_token")
    .single();

  if (insertError || !reportRow) {
    return NextResponse.json({ error: "리포트 레코드 저장에 실패했습니다." }, { status: 500 });
  }

  // Claude API 동기 호출 — 완료 후 반환
  try {
    const resultJson = await generateReport(payload);
    await supabaseAdmin
      .from("manus_reports")
      .update({ status: "completed", result_json: resultJson, error_message: null })
      .eq("id", reportRow.id);

    return NextResponse.json({
      report_id: reportRow.id,
      access_token: reportRow.access_token,
      status: "completed",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await supabaseAdmin
      .from("manus_reports")
      .update({ status: "failed", error_message: message })
      .eq("id", reportRow.id);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
